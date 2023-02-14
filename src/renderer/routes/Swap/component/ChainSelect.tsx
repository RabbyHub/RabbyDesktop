import React, { useMemo, useState } from 'react';
import { Chain, CHAINS, CHAINS_ENUM, CHAINS_LIST } from '@debank/common';
import { useSwap } from '@/renderer/hooks/rabbyx/useSwap';
import { DEX_SUPPORT_CHAINS } from '@rabby-wallet/rabby-swap';

import IconRcSwapArrowDownTriangle from '@/../assets/icons/swap/arrow-caret-down2.svg?rc';
import IconRcSearch from '@/../assets/icons/swap/search.svg?rc';
import IconClose from '@/../assets/icons/swap/modal-close.svg?rc';

import styled from 'styled-components';
import { Input, Modal, Tooltip } from 'antd';
import clsx from 'clsx';
import { usePreference } from '@/renderer/hooks/rabbyx/usePreference';

const TitleWrapper = styled.div`
  display: flex;
  justify-content: center;
  .title {
    font-weight: 500;
    font-size: 22px;
    line-height: 26px;
    text-align: center;
    color: #ffffff;
  }
  .closeIcon {
    position: absolute;
    right: 22px;
    top: 30px;
    cursor: pointer;
    width: 24px !important;
    height: 25px !important;
  }
`;

const ChainItemWrapper = styled.div<{ support: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  position: relative;
  border: 1px solid transparent;
  border-radius: 4px;
  opacity: ${({ support }) => (support ? 1 : 0.4)};
  cursor: ${({ support }) => (support ? 'pointer' : 'not-allowed')};

  .left {
    display: flex;
    align-items: center;
  }
  .icon {
    width: 24px;
    height: 24px;
  }
  .name {
    font-weight: 500;
    font-size: 15px;
    line-height: 18px;
    color: white;
    margin-left: 12px;
  }
  .star,
  .unStar {
    opacity: 1;
    margin-left: 8px;
  }
  .unStar {
    opacity: 0;
  }

  .checked {
    margin-left: auto;
  }
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.07);
    border-radius: 8px;
  }
  &:hover .unStar {
    opacity: 1;
  }

  .actionPin {
    cursor: pointer;
    margin-left: 4px;

    color: var(--color-primary);
  }
`;

function ChainItem({
  chain,
  pinned,
  onClick,
  onPinnedChange,
  checked,
  support = true,
  disabledTips,
}: {
  chain: CHAINS_ENUM;
  pinned: boolean;
  checked: boolean;
  onClick?: React.DOMAttributes<HTMLDivElement>['onClick'];
  onPinnedChange?: (chain: CHAINS_ENUM, pinned: boolean) => void;
  support?: boolean;
  disabledTips?: React.ReactNode;
}) {
  const chainObj = CHAINS[chain];
  return (
    <Tooltip
      trigger={['click', 'hover']}
      mouseEnterDelay={10}
      title={disabledTips}
      open={support ? false : undefined}
      placement="topLeft"
      align={{
        offset: [40, 0],
      }}
    >
      <ChainItemWrapper
        support={support}
        onClick={support ? onClick : undefined}
      >
        <div className="left">
          <img src={chainObj.logo} className="icon" />
          <div className="name">{chainObj.name}</div>
        </div>
        <img
          className={clsx(pinned ? 'star' : 'unStar')}
          src={
            pinned
              ? 'rabby-internal://assets/icons/swap/pinned.svg'
              : 'rabby-internal://assets/icons/swap/unpinned.svg'
          }
          onClick={(evt) => {
            evt.stopPropagation();
            onPinnedChange?.(chainObj.enum, !pinned);
          }}
          alt=""
        />
        {checked && (
          <img
            className="checked"
            src="rabby-internal://assets/icons/swap/checked.svg"
          />
        )}
      </ChainItemWrapper>
    </Tooltip>
  );
}

interface ChainDrawerProps {
  title?: React.ReactNode;
  open?: boolean;
  value: CHAINS_ENUM;
  onChange: (v: CHAINS_ENUM) => void;
  onClose: () => void;
  supportChains?: CHAINS_ENUM[];
  disabledTips?: React.ReactNode;
}

function searchFilter(keyword: string) {
  return (item: typeof CHAINS_LIST[number]) =>
    [item.name, item.enum, item.nativeTokenSymbol].some((token) =>
      token.toLowerCase().includes(keyword)
    );
}

const StyledModal = styled(Modal)`
  .ant-modal-content {
    background-color: transparent;
  }
  .ant-modal-body {
    height: 700px;
    padding: 0 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding-top: 30px;
    background: #525767;
    box-shadow: 0px 24px 80px rgba(19, 20, 26, 0.18);
    border-radius: 12px;
  }
  .searchIcon {
    font-size: 16px;
  }
  .ant-input-affix-wrapper {
    margin-top: 24px;
    margin-bottom: 14px;
    height: 36px;
    font-size: 12px;
    line-height: 14px;
    border: 1px solid #5f6572;
    box-shadow: none;
    border-radius: 6px;
    background-color: transparent;
    color: var(--color-purewhite);

    &.ant-input-affix-wrapper-focused {
      border: 1px solid var(--color-primary);
    }

    & input::placeholder {
      color: #d9d9d9;
    }
  }

  .scrollContainer {
    overflow-x: hidden;
    overflow-y: overlay;

    margin: 0 -16px;
    padding: 0 16px;
    padding-bottom: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .chainList {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 6px;
    margin-top: 16px;
    &:first-child {
      margin-top: 0;
    }
  }
`;

export const ChainSelectModal = ({
  title = 'Select the chain supported by 1inch',
  open = false,
  value = CHAINS_ENUM.ETH,
  onChange,
  onClose,
  supportChains,
  disabledTips,
}: ChainDrawerProps) => {
  const { preferences, setChainPinned } = usePreference();

  const [searchInput, setSearchInput] = useState('');

  const { pinnedChains, unpinnedChains } = useMemo(() => {
    const sortFn = (a: Chain, b: Chain) => {
      if (supportChains) {
        let an = 0;
        let bn = 0;
        if (supportChains.includes(a.enum)) {
          an = 1;
        }
        if (supportChains.includes(b.enum)) {
          bn = 1;
        }

        return bn - an;
      }
      return 0;
    };
    const pinnedSet = new Set(preferences.pinnedChain);
    const pinned: typeof CHAINS_LIST[number][] = [];
    const unpinned: typeof CHAINS_LIST[number][] = [];
    CHAINS_LIST.forEach((chain) => {
      if (pinnedSet.has(chain.enum)) {
        pinned.push(chain);
      } else {
        unpinned.push(chain);
      }
    });
    const keyword = searchInput?.trim().toLowerCase();
    if (!keyword) {
      return {
        pinnedChains: pinned.sort(sortFn),
        unpinnedChains: unpinned.sort(sortFn),
      };
    }

    const filterFunc = searchFilter(keyword);
    const searchedPinned = pinned.filter(filterFunc);
    const searchedUnpinned = unpinned.filter(filterFunc);

    return {
      pinnedChains: searchedPinned.sort(sortFn),
      unpinnedChains: searchedUnpinned.sort(sortFn),
    };
  }, [preferences.pinnedChain, searchInput, supportChains]);

  return (
    <StyledModal
      closable={false}
      onCancel={onClose}
      width={488}
      centered
      open={open}
      title={null}
      footer={null}
      destroyOnClose
    >
      <TitleWrapper>
        <div className="title">{title}</div>
        <IconClose className="closeIcon" onClick={onClose} />
      </TitleWrapper>

      <Input
        autoCorrect="false"
        autoComplete="false"
        prefix={<IconRcSearch className="searchIcon" />}
        value={searchInput}
        placeholder="Search chain"
        onChange={(evt) => {
          setSearchInput(evt.target.value || '');
        }}
        autoFocus
      />

      <div className="scrollContainer">
        <div className="chainList">
          {pinnedChains?.map((e) => (
            <ChainItem
              key={e.id}
              chain={e.enum}
              pinned
              checked={e.enum === value}
              onClick={() => onChange(e.enum)}
              onPinnedChange={setChainPinned}
              support={supportChains ? supportChains?.includes(e.enum) : true}
              disabledTips={disabledTips}
            />
          ))}
        </div>

        <div className="chainList">
          {unpinnedChains?.map((e) => (
            <ChainItem
              key={e.id}
              chain={e.enum}
              pinned={false}
              checked={e.enum === value}
              onClick={() => onChange(e.enum)}
              onPinnedChange={setChainPinned}
              support={supportChains ? supportChains?.includes(e.enum) : true}
              disabledTips={disabledTips}
            />
          ))}
        </div>
      </div>
    </StyledModal>
  );
};

const ChainSelectWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .logo {
    width: 23px;
    height: 23px;
    border-radius: 2px;
    overflow: hidden;
  }

  .name {
    font-weight: 500;
    font-size: 16px;
    color: #ffffff;
  }
`;

interface ChainSelectorProps {
  value: CHAINS_ENUM;
  onChange?(value: CHAINS_ENUM): void;
  readonly?: boolean;
  // direction?: 'top' | 'bottom';
  // supportChains?: CHAINS_ENUM[];
  disabledTips?: React.ReactNode;
  title?: React.ReactNode;
}
export const ChainSelect = ({
  value,
  onChange,
  readonly = false,
  disabledTips,
  title,
}: ChainSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleClickSelector = () => {
    if (readonly) return;
    setOpen(true);
  };

  const handleCancel = () => {
    if (readonly) return;
    setOpen(false);
  };

  const handleChange = (v: CHAINS_ENUM) => {
    if (readonly) return;
    if (onChange) {
      onChange(v);
    }
    setOpen(false);
  };

  const {
    swap: { selectedDex },
  } = useSwap();

  const supportChains = useMemo(
    () =>
      DEX_SUPPORT_CHAINS[
        selectedDex as unknown as keyof typeof DEX_SUPPORT_CHAINS
      ] || [],
    [selectedDex]
  );

  if (!selectedDex) {
    return null;
  }

  return (
    <>
      <ChainSelectWrapper onClick={handleClickSelector}>
        <img src={CHAINS[value].logo} className="logo" />
        <span className="name">{CHAINS[value].name}</span>
        {!readonly && (
          <IconRcSwapArrowDownTriangle
            className="arrow"
            width={10}
            height={6}
          />
        )}
      </ChainSelectWrapper>
      {!readonly && onChange && (
        <ChainSelectModal
          open={open}
          value={value}
          onChange={handleChange}
          onClose={handleCancel}
          supportChains={supportChains}
          title={title}
          disabledTips={disabledTips}
        />
      )}
    </>
  );
};
