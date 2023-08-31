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

type NetSwitchTabsProps = SwitchTabProps & {
  size?: 'sm';
  options?: {
    key: keyof typeof NetTypes;
    label: ReactNode;
  }[];
};

export default function NetSwitchTabs(props: NetSwitchTabsProps) {
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

NetSwitchTabs.ApprovalsPage = function ApprovalsPage(
  props: NetSwitchTabsProps
) {
  const { size, className, ...rest } = props;

  const switchOptions = useSwitchOptions();

  return (
    <PillsSwitch
      {...rest}
      className={clsx(
        'flex w-[232px] h-[36px]',
        'net-switch',
        size ? `net-switch--${size}` : '',
        className
      )}
      itemClassname={clsx('w-[112px]')}
      // itemClassnameInActive={clsx('text-[#4b4d59]')}
      options={switchOptions}
    />
  );
};
