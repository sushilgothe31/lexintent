import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { createContext, useContext } from 'react';
import type {
  EscrowAgreement,
  EscrowState,
  JurorRecord,
  TransactionRecord,
  VoteRecord,
  TxType,
} from '@/lib/types';
import { JURY_SIZE, MAJORITY } from '@/lib/types';

const STORAGE_KEY = 'lexintent-state-v1';

interface PersistedState {
  agreements: EscrowAgreement[];
  jurors: JurorRecord[];
  votes: VoteRecord[];
  transactions: TransactionRecord[];
}

function loadState(): PersistedState {
  if (typeof window === 'undefined') {
    return { agreements: [], jurors: [], votes: [], transactions: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      agreements: parsed.agreements ?? [],
      jurors: parsed.jurors ?? [],
      votes: parsed.votes ?? [],
      transactions: parsed.transactions ?? [],
    };
  } catch {
    return seedState();
  }
}

function seedState(): PersistedState {
  const now = Date.now();
  return {
    agreements: [
      {
        id: 'escrow-001',
        client: 'DemoClient111111111111111111111111111111111',
        freelancer: 'FreeLancer22222222222222222222222222222222',
        amount: 5,
        intentText:
          'Build a responsive landing page with React and Tailwind CSS. Deliver within 7 days including 2 rounds of revisions.',
        state: 'Active',
        createdAt: now - 86400000 * 3,
        disputeStartedAt: null,
        commitCount: 0,
        revealCount: 0,
        votesClient: 0,
        votesFreelancer: 0,
      },
      {
        id: 'escrow-002',
        client: 'DemoClient111111111111111111111111111111111',
        freelancer: 'DesignerPro33333333333333333333333333333333',
        amount: 12,
        intentText:
          'Design a complete brand identity package: logo, color palette, typography, and brand guidelines document.',
        state: 'Disputed',
        createdAt: now - 86400000 * 7,
        disputeStartedAt: now - 86400000 * 2,
        commitCount: 2,
        revealCount: 0,
        votesClient: 0,
        votesFreelancer: 0,
      },
      {
        id: 'escrow-003',
        client: 'ClientAlpha444444444444444444444444444444444',
        freelancer: 'FreeLancer22222222222222222222222222222222',
        amount: 3,
        intentText:
          'Write 10 SEO-optimized blog posts of 1500 words each about blockchain technology.',
        state: 'Completed',
        createdAt: now - 86400000 * 14,
        disputeStartedAt: null,
        commitCount: 0,
        revealCount: 0,
        votesClient: 0,
        votesFreelancer: 0,
      },
    ],
    jurors: [
      {
        id: 'juror-001',
        staker: 'JurorOne555555555555555555555555555555555',
        stakeAmount: 1,
        isActive: true,
      },
      {
        id: 'juror-002',
        staker: 'JurorTwo666666666666666666666666666666666',
        stakeAmount: 2,
        isActive: true,
      },
    ],
    votes: [
      {
        id: 'vote-001',
        juror: 'JurorOne555555555555555555555555555555555',
        escrowId: 'escrow-002',
        voteHash: 'a3f5e8d2c1b9f4e7a6d3c2b1a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
        revealed: false,
        vote: null,
      },
      {
        id: 'vote-002',
        juror: 'JurorTwo666666666666666666666666666666666',
        escrowId: 'escrow-002',
        voteHash: 'b4e6f9d3c2a0e5f8b7d4c3a2b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
        revealed: false,
        vote: null,
      },
    ],
    transactions: [
      {
        id: 'tx-001',
        type: 'create_escrow',
        status: 'success',
        signature: '5Kj2n8Qr...mP9xT',
        timestamp: now - 86400000 * 3,
        description: 'Created escrow for landing page project',
        amount: 5,
      },
      {
        id: 'tx-002',
        type: 'create_escrow',
        status: 'success',
        signature: '3Mf7p1Wq...kL8zR',
        timestamp: now - 86400000 * 7,
        description: 'Created escrow for brand identity package',
        amount: 12,
      },
      {
        id: 'tx-003',
        type: 'file_dispute',
        status: 'success',
        signature: '7Pq4r6St...nT2vW',
        timestamp: now - 86400000 * 2,
        description: 'Filed dispute on brand identity escrow',
      },
      {
        id: 'tx-004',
        type: 'accept_work',
        status: 'success',
        signature: '2Xk9p3Qm...rT7yB',
        timestamp: now - 86400000 * 10,
        description: 'Accepted work for blog posts project',
        amount: 3,
      },
    ],
  };
}

function saveState(state: PersistedState) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function genSignature(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let sig = '';
  for (let i = 0; i < 44; i++) sig += chars[Math.floor(Math.random() * chars.length)];
  return sig;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface StoreContextValue {
  agreements: EscrowAgreement[];
  jurors: JurorRecord[];
  votes: VoteRecord[];
  transactions: TransactionRecord[];
  createEscrow: (freelancer: string, amount: number, intentText: string) => Promise<void>;
  acceptWork: (escrowId: string) => Promise<void>;
  fileDispute: (escrowId: string) => Promise<void>;
  stakeForJury: (amount: number) => Promise<void>;
  commitVote: (escrowId: string, voteHash: string) => Promise<void>;
  revealVote: (escrowId: string, vote: 0 | 1, salt: string) => Promise<void>;
  getAgreement: (id: string) => EscrowAgreement | undefined;
  getVotesForEscrow: (escrowId: string) => VoteRecord[];
  isJuror: (address: string) => boolean;
  getJuror: (address: string) => JurorRecord | undefined;
  clearAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const [state, setState] = useState<PersistedState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addTx = useCallback(
    (type: TxType, description: string, amount?: number, status: 'success' | 'error' = 'success') => {
      const tx: TransactionRecord = {
        id: genId('tx'),
        type,
        status,
        signature: genSignature(),
        timestamp: Date.now(),
        description,
        amount,
      };
      setState((s) => ({ ...s, transactions: [tx, ...s.transactions] }));
      return tx;
    },
    []
  );

  const createEscrow = useCallback(
    async (freelancer: string, amount: number, intentText: string) => {
      await delay(800);
      const walletAddr = publicKey?.toBase58() ?? 'DemoClient111111111111111111111111111111111';
      const agreement: EscrowAgreement = {
        id: genId('escrow'),
        client: walletAddr,
        freelancer,
        amount,
        intentText,
        state: 'Active' as EscrowState,
        createdAt: Date.now(),
        disputeStartedAt: null,
        commitCount: 0,
        revealCount: 0,
        votesClient: 0,
        votesFreelancer: 0,
      };
      setState((s) => ({ ...s, agreements: [agreement, ...s.agreements] }));
      addTx('create_escrow', `Created escrow: ${intentText.slice(0, 50)}...`, amount);
      toast.success('Escrow created', {
        description: `${amount} SOL locked in vault. Waiting for work completion.`,
      });
    },
    [publicKey, addTx]
  );

  const acceptWork = useCallback(
    async (escrowId: string) => {
      await delay(800);
      setState((s) => ({
        ...s,
        agreements: s.agreements.map((a) =>
          a.id === escrowId ? { ...a, state: 'Completed' as EscrowState } : a
        ),
      }));
      const agreement = state.agreements.find((a) => a.id === escrowId);
      addTx('accept_work', `Accepted work — funds released to freelancer`, agreement?.amount);
      toast.success('Work accepted', {
        description: 'Funds released to freelancer.',
      });
    },
    [state.agreements, addTx]
  );

  const fileDispute = useCallback(
    async (escrowId: string) => {
      await delay(800);
      setState((s) => ({
        ...s,
        agreements: s.agreements.map((a) =>
          a.id === escrowId
            ? { ...a, state: 'Disputed' as EscrowState, disputeStartedAt: Date.now() }
            : a
        ),
      }));
      addTx('file_dispute', 'Filed dispute — funds frozen pending jury vote');
      toast.warning('Dispute filed', {
        description: 'Funds frozen. A jury of 3 will review and vote.',
      });
    },
    [addTx]
  );

  const stakeForJury = useCallback(
    async (amount: number) => {
      await delay(800);
      const walletAddr = publicKey?.toBase58() ?? 'UnknownWallet11111111111111111111111111';
      const juror: JurorRecord = {
        id: genId('juror'),
        staker: walletAddr,
        stakeAmount: amount,
        isActive: true,
      };
      setState((s) => ({ ...s, jurors: [...s.jurors, juror] }));
      addTx('stake_for_jury', `Staked ${amount} SOL to become a juror`, amount);
      toast.success('Jury stake confirmed', {
        description: `You staked ${amount} SOL. You can now vote on disputes.`,
      });
    },
    [publicKey, addTx]
  );

  const commitVote = useCallback(
    async (escrowId: string, voteHash: string) => {
      await delay(800);
      const walletAddr = publicKey?.toBase58() ?? 'UnknownWallet11111111111111111111111111';
      const vote: VoteRecord = {
        id: genId('vote'),
        juror: walletAddr,
        escrowId,
        voteHash,
        revealed: false,
        vote: null,
      };
      setState((s) => ({
        ...s,
        votes: [...s.votes, vote],
        agreements: s.agreements.map((a) =>
          a.id === escrowId ? { ...a, commitCount: a.commitCount + 1 } : a
        ),
      }));
      addTx('commit_vote', 'Committed hashed vote for dispute');
      toast.success('Vote committed', {
        description: 'Your hashed vote is on-chain. Reveal when voting closes.',
      });
    },
    [publicKey, addTx]
  );

  const revealVote = useCallback(
    async (escrowId: string, vote: 0 | 1, _salt: string) => {
      await delay(800);
      const walletAddr = publicKey?.toBase58() ?? 'UnknownWallet11111111111111111111111111';

      setState((s) => {
        const updatedVotes = s.votes.map((v) =>
          v.escrowId === escrowId && v.juror === walletAddr && !v.revealed
            ? { ...v, revealed: true, vote }
            : v
        );

        const agreement = s.agreements.find((a) => a.id === escrowId);
        if (!agreement) return s;

        const newRevealCount = agreement.revealCount + 1;
        const newVotesClient = agreement.votesClient + (vote === 0 ? 1 : 0);
        const newVotesFreelancer = agreement.votesFreelancer + (vote === 1 ? 1 : 0);

        let newState: EscrowState = 'Disputed';
        if (newRevealCount >= JURY_SIZE) {
          if (newVotesClient >= MAJORITY) newState = 'ResolvedClient';
          else if (newVotesFreelancer >= MAJORITY) newState = 'ResolvedFreelancer';
          else newState = 'ResolvedSplit';
        }

        const updatedAgreements = s.agreements.map((a) =>
          a.id === escrowId
            ? {
                ...a,
                revealCount: newRevealCount,
                votesClient: newVotesClient,
                votesFreelancer: newVotesFreelancer,
                state: newState,
              }
            : a
        );

        return { ...s, votes: updatedVotes, agreements: updatedAgreements };
      });

      addTx('reveal_vote', `Revealed vote: ${vote === 0 ? 'Client' : 'Freelancer'}`);
      toast.success('Vote revealed', {
        description: 'Your vote has been revealed on-chain.',
      });
    },
    [publicKey, addTx]
  );

  const getAgreement = useCallback(
    (id: string) => state.agreements.find((a) => a.id === id),
    [state.agreements]
  );

  const getVotesForEscrow = useCallback(
    (escrowId: string) => state.votes.filter((v) => v.escrowId === escrowId),
    [state.votes]
  );

  const isJuror = useCallback(
    (address: string) => state.jurors.some((j) => j.staker === address && j.isActive),
    [state.jurors]
  );

  const getJuror = useCallback(
    (address: string) => state.jurors.find((j) => j.staker === address),
    [state.jurors]
  );

  const clearAll = useCallback(() => {
    const fresh = seedState();
    setState(fresh);
    saveState(fresh);
  }, []);

  const value: StoreContextValue = {
    agreements: state.agreements,
    jurors: state.jurors,
    votes: state.votes,
    transactions: state.transactions,
    createEscrow,
    acceptWork,
    fileDispute,
    stakeForJury,
    commitVote,
    revealVote,
    getAgreement,
    getVotesForEscrow,
    isJuror,
    getJuror,
    clearAll,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
