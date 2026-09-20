import { SolanaProvider } from '@/providers/solana-provider';
import { StoreProvider } from '@/providers/store-provider';
import { AppLayout } from '@/components/app-layout';
import { DashboardScreen } from '@/screens/dashboard-screen';
import { CreateAgreementScreen } from '@/screens/create-agreement-screen';
import { AgreementDetailScreen } from '@/screens/agreement-detail-screen';
import { JuryDashboardScreen } from '@/screens/jury-dashboard-screen';
import { useRoute } from '@/lib/router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

import '@solana/wallet-adapter-react-ui/styles.css';

function ScreenRouter() {
  const route = useRoute();

  switch (route.name) {
    case 'dashboard':
      return <DashboardScreen />;
    case 'create':
      return <CreateAgreementScreen />;
    case 'agreement':
      return <AgreementDetailScreen />;
    case 'jury':
      return <JuryDashboardScreen />;
    default:
      return <DashboardScreen />;
  }
}

function App() {
  return (
    <SolanaProvider>
      <StoreProvider>
        <TooltipProvider delayDuration={200}>
          <AppLayout>
            <ScreenRouter />
          </AppLayout>
          <Toaster richColors position="bottom-right" />
        </TooltipProvider>
      </StoreProvider>
    </SolanaProvider>
  );
}

export default App;
