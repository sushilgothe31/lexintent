import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Gavel,
  Clock,
  Users,
  Vote,
  AlertTriangle,
  Shield,
  ArrowRight,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStore } from '@/providers/store-provider';
import { navigate, useRoute } from '@/lib/router';
import {
  STATE_COLORS,
  STATE_LABELS,
  JURY_SIZE,
  type EscrowState,
} from '@/lib/types';
import { cn } from '@/lib/utils';

function StateIcon({ state }: { state: EscrowState }) {
  switch (state) {
    case 'Active':
      return <Clock className="h-5 w-5" />;
    case 'Completed':
      return <CheckCircle2 className="h-5 w-5" />;
    case 'Disputed':
      return <Gavel className="h-5 w-5" />;
    case 'ResolvedClient':
    case 'ResolvedFreelancer':
    case 'ResolvedSplit':
      return <Scale className="h-5 w-5" />;
    default:
      return <Clock className="h-5 w-5" />;
  }
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

export function AgreementDetailScreen() {
  const route = useRoute();
  const id = route.name === 'agreement' ? route.id : '';
  const { getAgreement, getVotesForEscrow, acceptWork, fileDispute } = useStore();
  const { publicKey, connected } = useWallet();

  const [loading, setLoading] = useState<'accept' | 'dispute' | null>(null);
  const [disputeDialog, setDisputeDialog] = useState(false);

  const agreement = getAgreement(id);
  const votes = getVotesForEscrow(id);

  if (!agreement) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Agreement not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ name: 'dashboard' })}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isClient = connected && publicKey?.toBase58() === agreement.client;
  const isFreelancer = connected && publicKey?.toBase58() === agreement.freelancer;
  const canAccept = isClient && agreement.state === 'Active';
  const canDispute = (isClient || isFreelancer) && agreement.state === 'Active';

  const handleAccept = async () => {
    setLoading('accept');
    try {
      await acceptWork(agreement.id);
    } finally {
      setLoading(null);
    }
  };

  const handleDispute = async () => {
    setDisputeDialog(false);
    setLoading('dispute');
    try {
      await fileDispute(agreement.id);
    } finally {
      setLoading(null);
    }
  };

  const voteProgress = agreement.state === 'Disputed'
    ? (agreement.revealCount / JURY_SIZE) * 100
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ name: 'dashboard' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Agreement Detail</h1>
          <p className="text-sm text-muted-foreground font-mono">{agreement.id}</p>
        </div>
      </div>

      {/* Status banner */}
      <Card className={cn('border', STATE_COLORS[agreement.state])}>
        <CardContent className="p-5 flex items-center gap-4">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            STATE_COLORS[agreement.state]
          )}>
            <StateIcon state={agreement.state} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{STATE_LABELS[agreement.state]}</h2>
              <Badge className={cn('border', STATE_COLORS[agreement.state])}>
                {agreement.state}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {agreement.state === 'Active' && 'Funds are locked. Waiting for work completion.'}
              {agreement.state === 'Completed' && 'Work accepted. Funds released to freelancer.'}
              {agreement.state === 'Disputed' && `Dispute in progress. ${agreement.revealCount}/${JURY_SIZE} votes revealed.`}
              {agreement.state === 'ResolvedClient' && 'Jury ruled in favor of the client. Funds returned.'}
              {agreement.state === 'ResolvedFreelancer' && 'Jury ruled in favor of the freelancer. Funds released.'}
              {agreement.state === 'ResolvedSplit' && 'Jury split the funds 50/50.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Intent */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statement of Intent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{agreement.intentText}</p>
            </CardContent>
          </Card>

          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Client</p>
                  <p className="font-mono text-sm mt-0.5">{shortAddr(agreement.client)}</p>
                </div>
                {isClient && <Badge className="bg-primary/20 text-primary border-primary/30">You</Badge>}
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Freelancer</p>
                  <p className="font-mono text-sm mt-0.5">{shortAddr(agreement.freelancer)}</p>
                </div>
                {isFreelancer && <Badge className="bg-accent/20 text-accent border-accent/30">You</Badge>}
              </div>
            </CardContent>
          </Card>

          {/* Dispute voting (if disputed) */}
          {agreement.state === 'Disputed' && (
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-destructive" />
                  Jury Voting
                </CardTitle>
                <CardDescription>
                  {agreement.commitCount} committed, {agreement.revealCount} revealed of {JURY_SIZE} jurors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={voteProgress} className="h-2" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Client votes</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{agreement.votesClient}</p>
                  </div>
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-accent" />
                      <span className="text-xs text-muted-foreground">Freelancer votes</span>
                    </div>
                    <p className="text-2xl font-bold text-accent">{agreement.votesFreelancer}</p>
                  </div>
                </div>
                {votes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Vote records</p>
                    {votes.map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2">
                        <span className="font-mono text-xs">{shortAddr(v.juror)}</span>
                        {v.revealed ? (
                          <Badge className={v.vote === 0 ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}>
                            {v.vote === 0 ? 'Client' : 'Freelancer'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Vote className="h-3 w-3" />
                            Committed
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: sidebar */}
        <div className="space-y-6">
          {/* Amount */}
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-accent" />
                Escrow Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-mono">
                {agreement.amount}
                <span className="text-lg text-muted-foreground ml-1">SOL</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {agreement.state === 'Active' || agreement.state === 'Disputed'
                  ? 'Locked in vault'
                  : 'Released'}
              </p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Escrow created</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(agreement.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {agreement.disputeStartedAt && (
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/20 border border-destructive/30">
                    <Gavel className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dispute filed</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(agreement.disputeStartedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {agreement.state === 'Completed' && (
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Work accepted</p>
                    <p className="text-xs text-muted-foreground">Funds released</p>
                  </div>
                </div>
              )}
              {(agreement.state === 'ResolvedClient' ||
                agreement.state === 'ResolvedFreelancer' ||
                agreement.state === 'ResolvedSplit') && (
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 border border-accent/30">
                    <Scale className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dispute resolved</p>
                    <p className="text-xs text-muted-foreground">{STATE_LABELS[agreement.state]}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {(canAccept || canDispute) && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
                <CardDescription>
                  {isClient && isFreelancer
                    ? 'You are both parties'
                    : isClient
                    ? 'You are the client'
                    : isFreelancer
                    ? 'You are the freelancer'
                    : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canAccept && (
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90"
                    onClick={handleAccept}
                    disabled={loading !== null}
                  >
                    {loading === 'accept' ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Accept Work & Release
                  </Button>
                )}
                {canDispute && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => setDisputeDialog(true)}
                    disabled={loading !== null}
                  >
                    {loading === 'dispute' ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-white rounded-full animate-spin" />
                    ) : (
                      <Gavel className="h-4 w-4" />
                    )}
                    File Dispute
                  </Button>
                )}
                {!connected && (
                  <p className="text-xs text-muted-foreground text-center">
                    Connect wallet to interact
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dispute confirmation dialog */}
      <Dialog open={disputeDialog} onOpenChange={setDisputeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              File a Dispute?
            </DialogTitle>
            <DialogDescription>
              This will freeze the escrowed funds and trigger a jury voting process.
              A panel of 3 staked jurors will review the case and vote via commit/reveal.
              You cannot undo this action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleDispute}
            >
              <Gavel className="h-4 w-4" />
              File Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
