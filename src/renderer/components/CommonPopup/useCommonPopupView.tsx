import { createContext, useContext, useState } from 'react';

export type CommonPopupComponentName =
  | 'WalletConnect'
  | 'SwitchAddress'
  | 'SwitchChain'
  | 'Ledger';

export const useCommonPopupViewState = () => {
  const [componentName, setComponentName] = useState<
    CommonPopupComponentName | false
  >();
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('Sign');
  const [height, setHeight] = useState(360);
  const [className, setClassName] = useState<'isConnectView' | undefined>();
  const [account, setAccount] = useState<{
    address: string;
    brandName: string;
    realBrandName?: string;
  }>();

  const activePopup = (name: CommonPopupComponentName) => {
    setComponentName(name);
    setVisible(true);
  };

  const closePopup = () => {
    setVisible(false);
    setComponentName(undefined);
  };

  return {
    visible,
    setVisible,
    closePopup,
    componentName,
    activePopup,
    title,
    setTitle,
    height,
    setHeight,
    className,
    setClassName,
    account,
    setAccount,
  };
};

export const CommonPopupContext = createContext<{
  commonPopupView: ReturnType<typeof useCommonPopupViewState>;
}>({} as any);

export const useCommonPopupView = () => {
  const { commonPopupView } = useContext(CommonPopupContext);

  return commonPopupView;
};
