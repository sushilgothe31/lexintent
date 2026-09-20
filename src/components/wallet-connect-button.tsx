import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, Copy, Check } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export function WalletConnectButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  if (!connected) {
    return (
      <WalletMultiButton className="!bg-primary !text-primary-foreground !rounded-lg !h-9 !px-4 !text-sm !font-medium !border-0 hover:!bg-primary/90 !transition-colors" />
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
