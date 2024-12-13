import { BridgeContent } from './Component/BridgeContent';
import { Header } from './Component/BridgeHeader';
import {
  QuoteVisibleProvider,
  RefreshIdProvider,
  SettingVisibleProvider,
} from './hooks';

export const Bridge = () => {
  return (
    <SettingVisibleProvider>
      <RefreshIdProvider>
        <QuoteVisibleProvider>
          <Header />
          <BridgeContent />
        </QuoteVisibleProvider>
      </RefreshIdProvider>
    </SettingVisibleProvider>
  );
};
