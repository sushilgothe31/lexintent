import { useWallet } from '@solana/wallet-adapter-react';
import {
  LayoutDashboard,
  FilePlus2,
  Gavel,
  History,
  Scale,
  Menu,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { TransactionHistoryPanel } from '@/components/transaction-history-panel';
import { cn } from '@/lib/utils';
import { navigate, useRoute, type Route } from '@/lib/router';

const NAV_ITEMS: {
  label: string;
  icon: typeof LayoutDashboard;
  route: Route;
}[] = [
  { label: 'Dashboard', icon: LayoutDashboard, route: { name: 'dashboard' } },
  { label: 'Create Agreement', icon: FilePlus2, route: { name: 'create' } },
  { label: 'Jury Dashboard', icon: Gavel, route: { name: 'jury' } },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const route = useRoute();
  const { connected } = useWallet();
  const [txPanelOpen, setTxPanelOpen] = useState(false);

  const isActive = (r: Route) => {
    if (r.name === route.name) return true;
    if (r.name === 'dashboard' && route.name === 'agreement') return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      <div className="fixed inset-0 bg-radial-glow pointer-events-none" />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col border-r border-border bg-card/40 glass z-40">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">LexIntent</h1>
            <p className="text-xs text-muted-foreground">Decentralized Arbitration</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.route);
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.route)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={() => setTxPanelOpen(true)}
          >
            <History className="h-4 w-4" />
            Transaction History
          </Button>
        </div>

        <div className="px-4 pb-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                'h-2 w-2 rounded-full',
                connected ? 'bg-accent animate-pulse' : 'bg-muted-foreground'
              )} />
              <span className="text-xs font-medium">
                {connected ? 'Wallet Connected' : 'Not Connected'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {connected
                ? 'Devnet — ready to transact'
                : 'Connect a Solana wallet to begin'}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/80 glass px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Scale className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-sm sm:text-base">LexIntent</span>
        </div>
        <div className="flex items-center gap-2">
          <WalletConnectButton />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                  <Scale className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">LexIntent</h1>
                  <p className="text-xs text-muted-foreground">Decentralized Arbitration</p>
                </div>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.route);
                  return (
                    <SheetClose asChild key={item.label}>
                      <button
                        onClick={() => navigate(item.route)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                          active
                            ? 'bg-primary/15 text-primary border border-primary/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    </SheetClose>
                  );
                })}
                <SheetClose asChild>
                  <button
                    onClick={() => setTxPanelOpen(true)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent transition-all"
                  >
                    <History className="h-4 w-4" />
                    Transaction History
                  </button>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop top bar */}
      <header className="hidden lg:flex sticky top-0 z-30 items-center justify-between border-b border-border bg-card/40 glass px-8 py-3 lg:pl-72">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono text-xs px-2 py-1 rounded-md bg-accent/10 text-accent border border-accent/20">
            Devnet
          </span>
          <span className="text-border">|</span>
          <span>Program: LexIntent111...111</span>
        </div>
        <WalletConnectButton />
      </header>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Transaction history panel */}
      <TransactionHistoryPanel open={txPanelOpen} onOpenChange={setTxPanelOpen} />
    </div>
  );
}
