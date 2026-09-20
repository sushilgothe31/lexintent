import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { ArrowLeft, Lock, AlertCircle, Info } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/providers/store-provider';
import { navigate } from '@/lib/router';

export function CreateAgreementScreen() {
  const { createEscrow } = useStore();
  const { connected, publicKey } = useWallet();

  const [freelancer, setFreelancer] = useState('');
  const [amount, setAmount] = useState('');
  const [intentText, setIntentText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!connected || !publicKey) {
      toast.error('Wallet not connected', {
        description: 'Connect a Solana wallet to create an escrow.',
      });
      return;
    }
    if (!freelancer.trim()) {
      toast.error('Freelancer address required', {
        description: 'Enter the freelancer wallet address.',
      });
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Invalid amount', {
        description: 'Enter a valid SOL amount greater than 0.',
      });
      return;
    }
    if (intentText.trim().length < 10) {
      toast.error('Statement too short', {
        description: 'Describe the work in at least 10 characters.',
      });
      return;
    }

    setLoading(true);
    try {
      await createEscrow(freelancer.trim(), amountNum, intentText.trim());
      navigate({ name: 'dashboard' });
    } catch {
      toast.error('Failed to create escrow', {
        description: 'The transaction could not be completed.',
      });
    } finally {
      setLoading(false);
    }
  };

  const amountNum = parseFloat(amount) || 0;
  const lamports = Math.floor(amountNum * 1_000_000_000);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ name: 'dashboard' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Agreement</h1>
          <p className="text-sm text-muted-foreground">
            Lock SOL in escrow with a statement of intent
          </p>
        </div>
      </div>

      {!connected && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-400">Wallet not connected</p>
              <p className="text-muted-foreground mt-0.5">
                Connect a Solana wallet to lock funds. You can still fill out the form in demo mode.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Escrow Details
          </CardTitle>
          <CardDescription>
            Funds will be locked in a PDA vault until the work is accepted or a dispute is resolved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Freelancer address */}
          <div className="space-y-2">
            <Label htmlFor="freelancer">Freelancer Address</Label>
            <Input
              id="freelancer"
              placeholder="e.g. 7xKXtg2CW87d97TXJDSpbWD5Qk... (Solana wallet address)"
              value={freelancer}
              onChange={(e) => setFreelancer(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              The wallet address of the freelancer who will receive funds on completion.
            </p>
          </div>

          <Separator />

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (SOL)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="5.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-16 text-lg font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                SOL
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{lamports.toLocaleString()} lamports</span>
              <span>~${(amountNum * 180).toFixed(2)} USD</span>
            </div>
          </div>

          <Separator />

          {/* Statement of intent */}
          <div className="space-y-2">
            <Label htmlFor="intent">Statement of Intent</Label>
            <Textarea
              id="intent"
              placeholder="Describe the work to be performed, deliverables, timeline, and any acceptance criteria..."
              value={intentText}
              onChange={(e) => setIntentText(e.target.value)}
              rows={6}
              maxLength={1024}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                This text is stored on-chain as the agreement's intent.
              </span>
              <span className={intentText.length > 1000 ? 'text-destructive' : 'text-muted-foreground'}>
                {intentText.length} / 1024
              </span>
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Escrow amount</span>
              <span className="font-mono font-medium">{amountNum || 0} SOL</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Network</span>
              <span className="font-mono text-accent">Devnet</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Vault</span>
              <span className="font-mono text-xs">PDA (program-derived)</span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 text-base"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Locking funds...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Lock Funds in Escrow
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-accent mb-1">How it works</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>SOL is locked in a program-controlled vault (PDA)</li>
              <li>The freelancer completes the work</li>
              <li>The client accepts and funds release — or either party files a dispute</li>
              <li>If disputed, a jury of 3 staked jurors votes via commit/reveal</li>
              <li>Majority (2/3) decides where funds go</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
