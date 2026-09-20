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
      <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/20 bg-gradient-to-br from-[#171229] via-card to-[#071d1b] p-5 shadow-2xl shadow-primary/10 sm:p-7 lg:p-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-40 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Scale className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                On-chain justice protocol
              </span>
            </div>
            <h1 className="font-display text-[2.35rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Agreements with <span className="solana-gradient">conviction.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              A premium escrow and arbitration layer for the Solana economy. Put intent on-chain,
              lock value with confidence, and let a staked jury protect the outcome.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
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
          <div className="hero-art relative min-h-48 overflow-hidden rounded-2xl border border-white/10 bg-black/30 sm:min-h-64">
            <img src="/justice-statue.jpeg" alt="Classical statue of Justice holding the scales of law" className="absolute inset-0 h-full w-full object-cover opacity-75 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0b0718] via-transparent to-accent/20" />
            <div className="absolute bottom-4 left-4 rounded-xl border border-white/15 bg-black/40 px-3 py-2 backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Solana / Devnet</p>
              <p className="mt-1 text-xs text-white/80">Justice, verified by code.</p>
            </div>
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
