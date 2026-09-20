use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_lang::solana_program::entrypoint::ProgramResult;

declare_id!("LexIntent111111111111111111111111111111111111");

/// The minimum stake (in lamports) required to become a juror.
const JURY_STAKE_LAMPORTS: u64 = 1_000_000_000; // 1 SOL
/// Number of jurors required to resolve a dispute.
const JURY_SIZE: u8 = 3;
/// Majority threshold (2 of 3).
const MAJORITY: u8 = 2;

#[program]
pub mod lex_intent {
    use super::*;

    /// Creates a new escrow agreement. The client locks SOL in a PDA vault.
    /// `intent_text` is the statement of work / intent that the freelancer agrees to.
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        amount: u64,
        intent_text: String,
    ) -> Result<()> {
        require!(amount > 0, EscrowError::InvalidAmount);
        require!(intent_text.len() > 0 && intent_text.len() <= 1024, EscrowError::InvalidIntent);

        let escrow = &mut ctx.accounts.escrow;
        escrow.client = ctx.accounts.client.key();
        escrow.freelancer = ctx.accounts.freelancer.key();
        escrow.amount = amount;
        escrow.intent_text = intent_text;
        escrow.state = EscrowState::Active as u8;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.bump = ctx.bumps.escrow;

        // Transfer SOL from client to the vault PDA
        let transfer_ix = system_program::transfer(
            &ctx.accounts.client.to_account_info(),
            &ctx.accounts.vault.to_account_info(),
            amount,
        )?;
        invoke(
            &transfer_ix,
            &[
                ctx.accounts.client.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        emit!(EscrowCreated {
            escrow: escrow.key(),
            client: escrow.client,
            freelancer: escrow.freelancer,
            amount,
        });
        Ok(())
    }

    /// The client accepts the work and releases the locked funds to the freelancer.
    /// Only callable while the escrow is Active.
    pub fn accept_work(ctx: Context<AcceptWork>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(
            escrow.state == EscrowState::Active as u8,
            EscrowError::NotActive
        );
        require!(
            ctx.accounts.client.key() == escrow.client,
            EscrowError::NotClient
        );

        let amount = escrow.amount;
        escrow.state = EscrowState::Completed as u8;

        // Transfer from vault PDA to freelancer
        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.freelancer.to_account_info().try_borrow_mut_lamports()? += amount;

        emit!(WorkAccepted {
            escrow: escrow.key(),
            freelancer: escrow.freelancer,
            amount,
        });
        Ok(())
    }

    /// Either party can file a dispute, freezing the funds and moving to Disputed state.
    /// where the jury will vote.
    pub fn file_dispute(ctx: Context<FileDispute>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(
            escrow.state == EscrowState::Active as u8,
            EscrowError::NotActive
        );
        let signer = ctx.accounts.signer.key();
        require!(
            signer == escrow.client || signer == escrow.freelancer,
            EscrowError::NotParticipant
        );

        escrow.state = EscrowState::Disputed as u8;
        escrow.dispute_started_at = Clock::get()?.unix_timestamp;

        emit!(DisputeFiled {
            escrow: escrow.key(),
            filed_by: signer,
        });
        Ok(())
    }

    /// A user stakes SOL to become a juror. The stake is held in the juror PDA.
    pub fn stake_for_jury(ctx: Context<StakeForJury>, amount: u64) -> Result<()> {
        require!(amount >= JURY_STAKE_LAMPORTS, EscrowError::InsufficientStake);

        let juror = &mut ctx.accounts.juror;
        juror.staker = ctx.accounts.staker.key();
        juror.stake_amount = amount;
        juror.is_active = true;
        juror.bump = ctx.bumps.juror;

        // Transfer stake to vault
        let transfer_ix = system_program::transfer(
            &ctx.accounts.staker.to_account_info(),
            &ctx.accounts.vault.to_account_info(),
            amount,
        )?;
        invoke(
            &transfer_ix,
            &[
                ctx.accounts.staker.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        emit!(JuryStaked {
            staker: juror.staker,
            amount,
        });
        Ok(())
    }

    /// A juror submits a hashed vote (commit phase). The vote_hash = hash(vote || salt).
    /// This prevents vote copying until the reveal phase.
    pub fn commit_vote(ctx: Context<CommitVote>, vote_hash: [u8; 32]) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(
            escrow.state == EscrowState::Disputed as u8,
            EscrowError::NotDisputed
        );
        require!(
            escrow.commit_count < JURY_SIZE,
            EscrowError::VotingClosed
        );

        let vote_record = &mut ctx.accounts.vote_record;
        vote_record.juror = ctx.accounts.juror.key();
        vote_record.escrow = escrow.key();
        vote_record.vote_hash = vote_hash;
        vote_record.revealed = false;
        vote_record.vote = 0;
        vote_record.bump = ctx.bumps.vote_record;

        escrow.commit_count += 1;

        emit!(VoteCommitted {
            escrow: escrow.key(),
            juror: vote_record.juror,
        });
        Ok(())
    }

    /// A juror reveals their vote and salt. The contract verifies the hash matches.
    /// Once all jurors have revealed, if 2/3 agree, funds release to the winner.
    pub fn reveal_vote(
        ctx: Context<RevealVote>,
        vote: u8, // 0 = client, 1 = freelancer
        salt: String,
    ) -> Result<()> {
        let vote_record = &mut ctx.accounts.vote_record;
        let escrow = &mut ctx.accounts.escrow;

        require!(!vote_record.revealed, EscrowError::AlreadyRevealed);
        require!(vote <= 1, EscrowError::InvalidVote);

        // Verify hash
        let mut hasher = anchor_lang::solana_program::keccak::Hasher::default();
        hasher.hash(&[vote]);
        hasher.hash(salt.as_bytes());
        let computed_hash = hasher.result().to_bytes();
        require!(
            computed_hash == vote_record.vote_hash,
            EscrowError::HashMismatch
        );

        vote_record.revealed = true;
        vote_record.vote = vote;
        escrow.reveal_count += 1;

        // Tally votes
        if vote == 0 {
            escrow.votes_client += 1;
        } else {
            escrow.votes_freelancer += 1;
        }

        // If all jurors revealed, resolve
        if escrow.reveal_count >= JURY_SIZE {
            Self::resolve_dispute(ctx)?;
        }

        emit!(VoteRevealed {
            escrow: escrow.key(),
            juror: vote_record.juror,
            vote,
        });
        Ok(())
    }

    /// Internal: resolves the dispute once all votes are revealed.
    /// If majority favors the client, funds return to client.
    /// If majority favors the freelancer, funds go to freelancer.
    /// If tied, funds split 50/50.
    fn resolve_dispute(ctx: Context<RevealVote>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let amount = escrow.amount;

        let client_wins = escrow.votes_client >= MAJORITY;
        let freelancer_wins = escrow.votes_freelancer >= MAJORITY;

        if client_wins {
            escrow.state = EscrowState::ResolvedClient as u8;
            // Return funds to client
            **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
            **ctx.accounts.client.to_account_info().try_borrow_mut_lamports()? += amount;
        } else if freelancer_wins {
            escrow.state = EscrowState::ResolvedFreelancer as u8;
            // Send funds to freelancer
            **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
            **ctx.accounts.freelancer.to_account_info().try_borrow_mut_lamports()? += amount;
        } else {
            // Tie: split 50/50
            escrow.state = EscrowState::ResolvedSplit as u8;
            let half = amount / 2;
            **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
            **ctx.accounts.client.to_account_info().try_borrow_mut_lamports()? += half;
            **ctx.accounts.freelancer.to_account_info().try_borrow_mut_lamports()? += amount - half;
        }

        emit!(DisputeResolved {
            escrow: escrow.key(),
            votes_client: escrow.votes_client,
            votes_freelancer: escrow.votes_freelancer,
            final_state: escrow.state,
        });
        Ok(())
    }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

#[account]
pub struct EscrowAccount {
    pub client: Pubkey,
    pub freelancer: Pubkey,
    pub amount: u64,
    pub intent_text: String,
    pub state: u8,
    pub created_at: i64,
    pub dispute_started_at: i64,
    pub commit_count: u8,
    pub reveal_count: u8,
    pub votes_client: u8,
    pub votes_freelancer: u8,
    pub bump: u8,
}

#[account]
pub struct JurorAccount {
    pub staker: Pubkey,
    pub stake_amount: u64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
pub struct VoteRecord {
    pub juror: Pubkey,
    pub escrow: Pubkey,
    pub vote_hash: [u8; 32],
    pub revealed: bool,
    pub vote: u8,
    pub bump: u8,
}

// ─── States ─────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum EscrowState {
    Active = 0,
    Completed = 1,
    Disputed = 2,
    ResolvedClient = 3,
    ResolvedFreelancer = 4,
    ResolvedSplit = 5,
}

// ─── Contexts ───────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = client,
        space = 8 + 32 + 32 + 8 + (4 + 1024) + 1 + 8 + 8 + 1 + 1 + 1 + 1 + 1,
        seeds = [b"escrow", client.key().as_ref(), freelancer.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,

    /// CHECK: The freelancer's wallet. Verified off-chain via intent.
    pub freelancer: AccountInfo<'info>,

    #[account(mut)]
    pub client: Signer<'info>,

    /// CHECK: PDA vault that holds the locked SOL.
    #[account(
        mut,
        seeds = [b"vault", escrow.key().as_ref()],
        bump
    )]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptWork<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub freelancer: AccountInfo<'info>,

    #[account(mut)]
    pub client: Signer<'info>,
}

#[derive(Accounts)]
pub struct FileDispute<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,

    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct StakeForJury<'info> {
    #[account(
        init,
        payer = staker,
        space = 8 + 32 + 8 + 1 + 1,
        seeds = [b"juror", staker.key().as_ref()],
        bump
    )]
    pub juror: Account<'info, JurorAccount>,

    #[account(mut)]
    pub staker: Signer<'info>,

    /// CHECK: PDA vault for jury stakes.
    #[account(
        mut,
        seeds = [b"jury_vault"],
        bump
    )]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CommitVote<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(
        init,
        payer = juror,
        space = 8 + 32 + 32 + 32 + 1 + 1 + 1,
        seeds = [b"vote", escrow.key().as_ref(), juror.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub juror: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevealVote<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub client: AccountInfo<'info>,

    #[account(mut)]
    pub freelancer: AccountInfo<'info>,

    #[account(mut)]
    pub juror: Signer<'info>,
}

// ─── Events ─────────────────────────────────────────────────────────────────

#[event]
pub struct EscrowCreated {
    pub escrow: Pubkey,
    pub client: Pubkey,
    pub freelancer: Pubkey,
    pub amount: u64,
}

#[event]
pub struct WorkAccepted {
    pub escrow: Pubkey,
    pub freelancer: Pubkey,
    pub amount: u64,
}

#[event]
pub struct DisputeFiled {
    pub escrow: Pubkey,
    pub filed_by: Pubkey,
}

#[event]
pub struct JuryStaked {
    pub staker: Pubkey,
    pub amount: u64,
}

#[event]
pub struct VoteCommitted {
    pub escrow: Pubkey,
    pub juror: Pubkey,
}

#[event]
pub struct VoteRevealed {
    pub escrow: Pubkey,
    pub juror: Pubkey,
    pub vote: u8,
}

#[event]
pub struct DisputeResolved {
    pub escrow: Pubkey,
    pub votes_client: u8,
    pub votes_freelancer: u8,
    pub final_state: u8,
}

// ─── Errors ─────────────────────────────────────────────────────────────────

#[error_code]
pub enum EscrowError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Intent text must be between 1 and 1024 characters")]
    InvalidIntent,
    #[msg("Escrow is not in Active state")]
    NotActive,
    #[msg("Escrow is not in Disputed state")]
    NotDisputed,
    #[msg("Only the client can perform this action")]
    NotClient,
    #[msg("Only the client or freelancer can file a dispute")]
    NotParticipant,
    #[msg("Stake amount is below the minimum required")]
    InsufficientStake,
    #[msg("Voting is closed for this dispute")]
    VotingClosed,
    #[msg("Vote has already been revealed")]
    AlreadyRevealed,
    #[msg("Invalid vote value (must be 0 or 1)")]
    InvalidVote,
    #[msg("Revealed hash does not match committed hash")]
    HashMismatch,
}
