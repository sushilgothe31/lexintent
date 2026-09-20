export type EscrowState =
  | 'Active'
  | 'Completed'
  | 'Disputed'
  | 'ResolvedClient'
  | 'ResolvedFreelancer'
  | 'ResolvedSplit';

export interface EscrowAgreement {
  id: string;
  client: string;
  freelancer: string;
  amount: number; // in SOL
  intentText: string;
  state: EscrowState;
  createdAt: number;
  disputeStartedAt: number | null;
  commitCount: number;
  revealCount: number;
  votesClient: number;
  votesFreelancer: number;
}

export interface JurorRecord {
  id: string;
  staker: string;
  stakeAmount: number; // in SOL
  isActive: boolean;
}

export interface VoteRecord {
  id: string;
  juror: string;
  escrowId: string;
  voteHash: string | null;
  revealed: boolean;
  vote: 0 | 1 | null; // 0 = client, 1 = freelancer
}

export type TxType =
  | 'create_escrow'
  | 'accept_work'
  | 'file_dispute'
  | 'stake_for_jury'
  | 'commit_vote'
  | 'reveal_vote';

export type TxStatus = 'success' | 'error' | 'pending';

export interface TransactionRecord {
  id: string;
  type: TxType;
  status: TxStatus;
  signature: string;
  timestamp: number;
  description: string;
  amount?: number;
}

export const JURY_STAKE_SOL = 1;
export const JURY_SIZE = 3;
export const MAJORITY = 2;

export const STATE_LABELS: Record<EscrowState, string> = {
  Active: 'Active',
  Completed: 'Completed',
  Disputed: 'Disputed',
  ResolvedClient: 'Resolved — Client Wins',
  ResolvedFreelancer: 'Resolved — Freelancer Wins',
  ResolvedSplit: 'Resolved — Split 50/50',
};

export const STATE_COLORS: Record<EscrowState, string> = {
  Active: 'bg-accent/20 text-accent border-accent/30',
  Completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Disputed: 'bg-destructive/20 text-destructive border-destructive/30',
  ResolvedClient: 'bg-primary/20 text-primary border-primary/30',
  ResolvedFreelancer: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  ResolvedSplit: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};
