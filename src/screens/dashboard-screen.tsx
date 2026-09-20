import { useWallet } from '@solana/wallet-adapter-react';
import {
  FilePlus2,
  Lock,
  Gavel,
  CheckCircle2,
  TrendingUp,
  Users,
  Scale,
  ChevronRight,
  Wallet2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/providers/store-provider';
import { navigate } from '@/lib/router';
import {
  STATE_COLORS,
  STATE_LABELS,
  type EscrowAgreement,
} from '@/lib/types';
import { cn } from '@/lib/utils';

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Lock;
  label: string;
  value: string;
  accent: 'primary' | 'accent' | 'destructive' | 'amber';
}) {
  const accentMap = {
    primary: 'from-primary/20 to-primary/5 text-primary border-primary/20',
    accent: 'from-accent/20 to-accent/5 text-accent border-accent/20',
    destructive: 'from-destructive/20 to-destructive/5 text-destructive border-destructive/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
  };
  return (
    <Card className={cn('relative overflow-hidden border bg-gradient-to-br', accentMap[accent])}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/50">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgreementCard({ agreement }: { agreement: EscrowAgreement }) {
  const shortClient = `${agreement.client.slice(0, 4)}...${agreement.client.slice(-4)}`;
  const shortFreelancer = `${agreement.freelancer.slice(0, 4)}...${agreement.freelancer.slice(-4)}`;

  return (
    <Card
      className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 animate-fade-in-up"
      onClick={() => navigate({ name: 'agreement', id: agreement.id })}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold line-clamp-1">
              {agreement.intentText.slice(0, 60)}
              {agreement.intentText.length > 60 ? '...' : ''}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              <code className="text-xs">{shortClient}</code>
              <ChevronRight className="h-3 w-3" />
              <code className="text-xs">{shortFreelancer}</code>
            </CardDescription>
          </div>
          <Badge className={cn('shrink-0 border', STATE_COLORS[agreement.state])}>
            {STATE_LABELS[agreement.state]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-mono font-medium text-accent">{agreement.amount} SOL</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(agreement.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardScreen() {
  const { agreements, jurors } = useStore();
  const { connected } = useWallet();

  const activeCount = agreements.filter((a) => a.state === 'Active').length;
  const disputedCount = agreements.filter((a) => a.state === 'Disputed').length;
  const completedCount = agreements.filter((a) => a.state === 'Completed').length;
  const totalLocked = agreements
    .filter((a) => a.state === 'Active' || a.state === 'Disputed')
    .reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/5 p-6 lg:p-8">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-24 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Decentralized Escrow & Arbitration
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
            Trustless agreements for{' '}
            <span className="solana-gradient">freelancers & clients</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mb-6">
            Lock SOL in escrow with a statement of intent. If either party disputes the work,
            a staked jury votes to resolve — all on-chain, all transparent.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90"
              onClick={() => navigate({ name: 'create' })}
            >
              <FilePlus2 className="h-4 w-4" />
              Create Agreement
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-accent/30 text-accent hover:bg-accent/10"
              onClick={() => navigate({ name: 'jury' })}
            >
              <Gavel className="h-4 w-4" />
              Join the Jury
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Lock} label="Total Locked" value={`${totalLocked} SOL`} accent="accent" />
        <StatCard icon={TrendingUp} label="Active" value={String(activeCount)} accent="primary" />
        <StatCard icon={Gavel} label="Disputed" value={String(disputedCount)} accent="destructive" />
        <StatCard icon={CheckCircle2} label="Completed" value={String(completedCount)} accent="amber" />
      </div>

      {/* Agreements list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Active Agreements</h2>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate({ name: 'create' })}>
            <FilePlus2 className="h-4 w-4" />
            New
          </Button>
        </div>

        {!connected && (
          <Card className="border-primary/20 bg-primary/5 mb-4">
            <CardContent className="p-4 flex items-center gap-3">
              <Wallet2 className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">Demo mode active.</span>{' '}
                You can browse agreements and explore the interface. Connect a Solana wallet
                to create agreements and interact on devnet.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {agreements.map((a) => (
            <AgreementCard key={a.id} agreement={a} />
          ))}
        </div>
      </div>

      {/* Jury stats */}
      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">Jury Pool</CardTitle>
          </div>
          <CardDescription>
            {jurors.length} staked jurors ready to arbitrate disputes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {jurors.slice(0, 5).map((j, i) => (
                <div
                  key={j.id}
                  className="h-8 w-8 rounded-full border-2 border-card bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white"
                  style={{ zIndex: 5 - i }}
                >
                  {j.staker.slice(0, 2)}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-2 border-accent/30 text-accent" onClick={() => navigate({ name: 'jury' })}>
              <Gavel className="h-4 w-4" />
              View Jury Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
