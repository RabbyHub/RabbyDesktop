import { useShowTestnet } from '@/renderer/hooks/rabbyx/useShowTestnet';
import clsx from 'clsx';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import PillsSwitch, { PillsSwitchProps } from '.';

const NetTypes = {
  mainnet: 'Mainnets',
  testnet: 'Testnets',
} as const;

export type NetSwitchTabsKey = keyof typeof NetTypes;
type OptionType = {
  key: NetSwitchTabsKey;
  label: string;
};
type SwitchTabProps = Omit<PillsSwitchProps<OptionType[]>, 'options'>;

export function useSwitchNetTab(options?: { hideTestnetTab?: boolean }) {
  const { isShowTestnet } = useShowTestnet();
  const { hideTestnetTab = false } = options || {};

  const [selectedTab, setSelectedTab] = useState<OptionType['key']>('mainnet');
  const alwaysMain = useMemo(
    () => !isShowTestnet || hideTestnetTab,
    [isShowTestnet, hideTestnetTab]
  );

  const onTabChange = useCallback(
    (key: OptionType['key']) => {
      setSelectedTab(alwaysMain ? 'mainnet' : key);
    },
    [alwaysMain]
  );

  return {
    isShowTestnet: isShowTestnet && !hideTestnetTab,
    selectedTab: alwaysMain ? 'mainnet' : selectedTab,
    onTabChange,
  };
}

function useSwitchOptions() {
  return useMemo(() => {
    return [
      {
        key: 'mainnet',
        label: 'Mainnet',
      },
      {
        key: 'testnet',
        label: 'Testnet',
      },
    ] as const;
  }, []);
}

export default function NetSwitchTabs(
  props: SwitchTabProps & {
    size?: 'sm';
    options?: {
      key: keyof typeof NetTypes;
      label: ReactNode;
    }[];
  }
) {
  const { size, options, className, ...rest } = props;

  const switchOptions = useSwitchOptions();

  return (
    <PillsSwitch
      {...rest}
      options={options || switchOptions}
      className={clsx(
        'net-switch',
        size ? `net-switch--${size}` : '',
        className
      )}
    />
  );
}
