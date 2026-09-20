import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, Copy, Check, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
export function WalletConnectButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);

  if (!connected) {
    return (
      <Button
        type="button"
        onClick={() => setVisible(true)}
        className="wallet-connect-trigger h-9 min-w-0 gap-2 rounded-full border-0 bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 sm:h-10 sm:px-4 sm:text-sm"
      >
        <Wallet className="size-4 shrink-0" />
        <span className="hidden min-[360px]:inline">Select wallet</span>
        <span className="min-[360px]:hidden">Connect</span>
        <ArrowUpRight className="size-3.5 opacity-70" />
      </Button>
    );
  }

  const address = publicKey?.toBase58() ?? '';
  const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
        >
          <Wallet className="h-4 w-4" />
          {shortAddress}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Connected wallet</span>
            <span className="font-mono text-xs break-all">{address}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress} className="gap-2 cursor-pointer">
          {copied ? (
            <>
              <Check className="h-4 w-4 text-accent" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy address
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
