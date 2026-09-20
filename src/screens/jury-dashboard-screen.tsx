import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import {
  Shield,
  Gavel,
  Vote,
  Eye,
  Lock,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Hash,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStore } from '@/providers/store-provider';
import { navigate } from '@/lib/router';
import {
  JURY_STAKE_SOL,
  JURY_SIZE,
  STATE_COLORS,
  STATE_LABELS,
} from '@/lib/types';
import { cn } from '@/lib/utils';

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

// Simple hash for demo (in production this would use keccak256)
function demoHash(vote: string, salt: string): string {
  let h = 0;
  const str = vote + salt;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0');
  return hex.repeat(8).slice(0, 64);
}

export function JuryDashboardScreen() {
  const {
    agreements,
    jurors,
    isJuror,
    getJuror,
    stakeForJury,
    commitVote,
    revealVote,
  } = useStore();
  const { publicKey, connected } = useWallet();

  const [stakeAmount, setStakeAmount] = useState(String(JURY_STAKE_SOL));
  const [staking, setStaking] = useState(false);
  const [commitDialog, setCommitDialog] = useState<string | null>(null);
  const [revealDialog, setRevealDialog] = useState<string | null>(null);

  // Commit form state
  const [commitVoteChoice, setCommitVoteChoice] = useState<0 | 1 | null>(null);
  const [commitSalt, setCommitSalt] = useState('');
  const [committing, setCommitting] = useState(false);

  // Reveal form state
  const [revealVoteChoice, setRevealVoteChoice] = useState<0 | 1 | null>(null);
  const [revealSalt, setRevealSalt] = useState('');
  const [revealing, setRevealing] = useState(false);

  const walletAddr = publicKey?.toBase58() ?? '';
  const userIsJuror = connected && isJuror(walletAddr);
  const userJuror = connected ? getJuror(walletAddr) : undefined;

  const disputedAgreements = agreements.filter((a) => a.state === 'Disputed');
  const resolvedAgreements = agreements.filter(
    (a) =>
      a.state === 'ResolvedClient' ||
      a.state === 'ResolvedFreelancer' ||
      a.state === 'ResolvedSplit'
  );

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount < JURY_STAKE_SOL) {
      toast.error('Insufficient stake', {
        description: `Minimum stake is ${JURY_STAKE_SOL} SOL.`,
      });
      return;
    }
    setStaking(true);
    try {
      await stakeForJury(amount);
    } finally {
      setStaking(false);
    }
  };

  const handleCommit = async () => {
    if (!commitDialog) return;
    if (commitVoteChoice === null) {
      toast.error('Select a vote', { description: 'Choose Client or Freelancer.' });
      return;
    }
    if (!commitSalt.trim()) {
      toast.error('Salt required', { description: 'Enter a secret salt for the commit/reveal scheme.' });
      return;
    }
    setCommitting(true);
    try {
      const hash = demoHash(String(commitVoteChoice), commitSalt);
      await commitVote(commitDialog, hash);
      setCommitDialog(null);
      setCommitVoteChoice(null);
      setCommitSalt('');
    } finally {
      setCommitting(false);
    }
  };

  const handleReveal = async () => {
    if (!revealDialog) return;
    if (revealVoteChoice === null) {
      toast.error('Select a vote', { description: 'Choose Client or Freelancer.' });
      return;
    }
    if (!revealSalt.trim()) {
      toast.error('Salt required', { description: 'Enter the same salt you used during commit.' });
      return;
    }
    setRevealing(true);
    try {
      await revealVote(revealDialog, revealVoteChoice, revealSalt);
      setRevealDialog(null);
      setRevealVoteChoice(null);
      setRevealSalt('');
    } finally {
      setRevealing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gavel className="h-6 w-6 text-primary" />
          Jury Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stake SOL to become a juror and arbitrate disputes via commit/reveal voting.
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Jurors</span>
            </div>
            <p className="text-2xl font-bold">{jurors.length}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Gavel className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Disputes</span>
            </div>
            <p className="text-2xl font-bold">{disputedAgreements.length}</p>
          </CardContent>
        </Card>
        <Card className="border-accent/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Staked</span>
            </div>
            <p className="text-2xl font-bold">{jurors.reduce((s, j) => s + j.stakeAmount, 0)} SOL</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Resolved</span>
            </div>
            <p className="text-2xl font-bold">{resolvedAgreements.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={userIsJuror ? 'disputes' : 'stake'}>
        {/* Stake tab */}
        <TabsContent value="stake" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Become a Juror
              </CardTitle>
              <CardDescription>
                Stake SOL to join the jury pool. Your stake is held in a vault and returned when you leave.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!connected && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Connect a Solana wallet to stake and become a juror.
                  </p>
                </div>
              )}

              {userIsJuror && userJuror && (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span className="font-medium text-accent">You are an active juror</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your stake</span>
                    <span className="font-mono font-medium">{userJuror.stakeAmount} SOL</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="stake">Stake Amount (SOL)</Label>
                <div className="relative">
                  <Input
                    id="stake"
                    type="number"
                    step="0.1"
                    min={JURY_STAKE_SOL}
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="pr-16 text-lg font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    SOL
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum stake: {JURY_STAKE_SOL} SOL
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stake amount</span>
                  <span className="font-mono">{parseFloat(stakeAmount) || 0} SOL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span>Juror (voting rights)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="text-accent">Devnet</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90"
                onClick={handleStake}
                disabled={staking || !connected || userIsJuror}
              >
                {staking ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                {userIsJuror ? 'Already a Juror' : 'Stake & Join Jury'}
              </Button>
            </CardContent>
          </Card>

          {/* Current jurors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Jurors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {jurors.map((j) => (
                <div key={j.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
                      {j.staker.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-mono text-xs">{shortAddr(j.staker)}</p>
                      <p className="text-xs text-muted-foreground">{j.stakeAmount} SOL staked</p>
                    </div>
                  </div>
                  <Badge className="bg-accent/20 text-accent border-accent/30 gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Active
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes tab */}
        <TabsContent value="disputes" className="space-y-6">
          {disputedAgreements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Gavel className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No active disputes</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Disputed agreements will appear here for jury voting
                </p>
              </CardContent>
            </Card>
          ) : (
            disputedAgreements.map((a) => {
              const hasCommitted = connected && publicKey
                ? a.commitCount > 0
                : false;
              const progress = (a.revealCount / JURY_SIZE) * 100;

              return (
                <Card key={a.id} className="border-destructive/20">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-1">
                          {a.intentText.slice(0, 70)}
                          {a.intentText.length > 70 ? '...' : ''}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-xs">{a.id}</span>
                          <span>·</span>
                          <span>{a.amount} SOL</span>
                        </CardDescription>
                      </div>
                      <Badge className={cn('border', STATE_COLORS[a.state])}>
                        {STATE_LABELS[a.state]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Voting progress</span>
                        <span className="font-mono">{a.revealCount}/{JURY_SIZE} revealed</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Vote tally */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Client</p>
                        <p className="text-xl font-bold text-primary">{a.votesClient}</p>
                      </div>
                      <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Freelancer</p>
                        <p className="text-xl font-bold text-accent">{a.votesFreelancer}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => {
                          setCommitDialog(a.id);
                          setCommitVoteChoice(null);
                          setCommitSalt('');
                        }}
                        disabled={!userIsJuror || a.commitCount >= JURY_SIZE}
                      >
                        <Vote className="h-4 w-4" />
                        Commit Vote
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 border-accent/30 text-accent hover:bg-accent/10"
                        onClick={() => {
                          setRevealDialog(a.id);
                          setRevealVoteChoice(null);
                          setRevealSalt('');
                        }}
                        disabled={!userIsJuror}
                      >
                        <Eye className="h-4 w-4" />
                        Reveal Vote
                      </Button>
                    </div>

                    {!userIsJuror && (
                      <p className="text-xs text-muted-foreground text-center">
                        Stake SOL in the "Stake" tab to vote on disputes
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Resolved history */}
          {resolvedAgreements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Resolved Disputes
              </h3>
              <div className="space-y-2">
                {resolvedAgreements.map((a) => (
                  <Card
                    key={a.id}
                    className="cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => navigate({ name: 'agreement', id: a.id })}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {a.intentText.slice(0, 60)}
                          {a.intentText.length > 60 ? '...' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.votesClient} for client · {a.votesFreelancer} for freelancer
                        </p>
                      </div>
                      <Badge className={cn('border ml-3', STATE_COLORS[a.state])}>
                        {STATE_LABELS[a.state]}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Commit dialog */}
      <Dialog open={commitDialog !== null} onOpenChange={(o) => !o && setCommitDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5 text-primary" />
              Commit Vote
            </DialogTitle>
            <DialogDescription>
              Your vote is hashed with a secret salt and submitted on-chain.
              This prevents other jurors from seeing your choice until the reveal phase.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Your Vote</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                    commitVoteChoice === 0
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/30'
                  )}
                  onClick={() => setCommitVoteChoice(0)}
                >
                  <Shield className="h-6 w-6" />
                  <span className="text-sm font-medium">Client</span>
                </button>
                <button
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                    commitVoteChoice === 1
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border hover:border-accent/30'
                  )}
                  onClick={() => setCommitVoteChoice(1)}
                >
                  <Users className="h-6 w-6" />
                  <span className="text-sm font-medium">Freelancer</span>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salt">Secret Salt</Label>
              <Input
                id="salt"
                placeholder="Enter a random secret phrase"
                value={commitSalt}
                onChange={(e) => setCommitSalt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <KeyRound className="h-3 w-3" />
                Save this salt — you'll need it to reveal your vote later.
              </p>
            </div>
            {commitVoteChoice !== null && commitSalt && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Computed hash (demo)
                </p>
                <p className="font-mono text-xs break-all text-primary">
                  {demoHash(String(commitVoteChoice), commitSalt)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommitDialog(null)}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-primary to-primary/80"
              onClick={handleCommit}
              disabled={committing}
            >
              {committing ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Vote className="h-4 w-4" />
              )}
              Commit Vote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal dialog */}
      <Dialog open={revealDialog !== null} onOpenChange={(o) => !o && setRevealDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-accent" />
              Reveal Vote
            </DialogTitle>
            <DialogDescription>
              Submit your original vote and salt. The contract verifies the hash matches
              your committed vote.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Your Vote</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                    revealVoteChoice === 0
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/30'
                  )}
                  onClick={() => setRevealVoteChoice(0)}
                >
                  <Shield className="h-6 w-6" />
                  <span className="text-sm font-medium">Client</span>
                </button>
                <button
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                    revealVoteChoice === 1
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border hover:border-accent/30'
                  )}
                  onClick={() => setRevealVoteChoice(1)}
                >
                  <Users className="h-6 w-6" />
                  <span className="text-sm font-medium">Freelancer</span>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reveal-salt">Your Secret Salt</Label>
              <Input
                id="reveal-salt"
                placeholder="Enter the same salt you used during commit"
                value={revealSalt}
                onChange={(e) => setRevealSalt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <KeyRound className="h-3 w-3" />
                Must match the salt used during the commit phase.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevealDialog(null)}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90"
              onClick={handleReveal}
              disabled={revealing}
            >
              {revealing ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Reveal Vote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
