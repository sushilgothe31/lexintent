import {
  ArrowUpRight,
  ArrowDownLeft,
  Gavel,
  FileText,
  Shield,
  Vote,
  Eye,
  History,
  X,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useStore } from '@/providers/store-provider';
import type { TransactionRecord, TxType } from '@/lib/types';

const TX_ICONS: Record<TxType, typeof FileText> = {
  create_escrow: ArrowUpRight,
  accept_work: ArrowDownLeft,
  file_dispute: Gavel,
  stake_for_jury: Shield,
  commit_vote: Vote,
  reveal_vote: Eye,
};

const TX_LABELS: Record<TxType, string> = {
  create_escrow: 'Create Escrow',
  accept_work: 'Accept Work',
  file_dispute: 'File Dispute',
  stake_for_jury: 'Stake for Jury',
  commit_vote: 'Commit Vote',
  reveal_vote: 'Reveal Vote',
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatusIcon({ status }: { status: TransactionRecord['status'] }) {
  if (status === 'success') return <CheckCircle2 className="h-3.5 w-3.5 text-accent" />;
  if (status === 'error') return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function TransactionHistoryPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { transactions } = useStore();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
      )}
      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full sm:w-96 bg-card border-l border-border z-50 shadow-2xl transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Transaction History</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100%-65px)]">
          <div className="p-4 space-y-3">
            {transactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <History className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Your on-chain activity will appear here
                </p>
              </div>
            )}
            {transactions.map((tx, i) => {
              const Icon = TX_ICONS[tx.type];
              return (
                <div key={tx.id}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{TX_LABELS[tx.type]}</span>
                        <StatusIcon status={tx.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {tx.amount && (
                          <span className="text-xs font-mono text-accent">{tx.amount} SOL</span>
                        )}
                        <span className="text-xs text-muted-foreground/60">{timeAgo(tx.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <code className="text-xs text-muted-foreground/50 font-mono truncate">
                          {tx.signature.slice(0, 20)}...{tx.signature.slice(-6)}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
