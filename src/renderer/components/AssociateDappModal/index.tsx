import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import { useOpenDapp } from '@/renderer/utils/react-router';
import styled from 'styled-components';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import ModalAddDapp from '@/renderer/components/ModalAddDapp';
import {
  useProtocolDappsBinding,
  useTabedDapps,
} from '@/renderer/hooks/useDappsMngr';
import { isDomainLikeStr, removeProtocolFromUrl } from '@/renderer/utils/url';
import { ellipsisTokenSymbol } from '@/renderer/utils/token';
import { formatDappURLToShow } from '@/isomorphic/dapp';
import { usePrevious } from 'react-use';
import { Modal, Props as ModalProps } from '../Modal/Modal';
import styles from './index.module.less';
import { DappFavicon } from '../DappFavicon';
import { TipsWrapper } from '../TipWrapper';

const BindDappWrapper = styled.div`
  padding: 32px 60px;
  height: 500px;
  .header {
    color: #fff;
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    text-align: center;
    margin-bottom: 32px;
  }
  .search-result {
    height: 240px;
    overflow: overlay;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    color: #fff;
    margin-top: 16px;
    position: relative;
  }
  .footer {
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 8px;
    font-size: 13px;
    line-height: 16px;
    color: #fff;
    margin-top: 28px;
    .url {
      font-weight: 700;
      text-decoration: underline;
    }
  }
`;

const DappItemWrapper = styled.div`
  padding: 20px 16px;
  display: flex;
  align-items: center;
  .dapp-icon {
    width: 24px;
    height: 24px;
    border-radius: 2px;
    margin-right: 12px;
  }
  .dapp-info {
    overflow: hidden;
    p {
      margin-bottom: 2px;
      font-weight: 700;
      font-size: 13px;
      line-height: 16px;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      &:nth-last-child(1) {
        font-weight: normal;
        font-size: 12px;
        line-height: 14px;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 0;
      }
    }
  }
  .open-button {
    background: #27c193;
    box-shadow: 0px 4px 12px rgba(48, 158, 86, 0.2);
    border-color: #27c193;
  }
  .binded-tip {
    display: flex;
    align-items: center;
    font-weight: 500;
    font-size: 13px;
    line-height: 16px;
    color: #ffffff;
    margin-right: 12px;
    .icon-success {
      margin-right: 6px;
    }
  }
`;

const EmptyView = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  text-align: center;
  transform: translate(-50%, -50%);
  p {
    margin-top: 8px;
    margin-bottom: 0;
    font-size: 13px;
    line-height: 16px;
    color: rgba(255, 255, 255, 0.5);
  }
`;

const DappItem = ({
  dapp,
  onBind,
  onOpen,
  isBinded,
  protocol,
}: {
  dapp: {
    id?: string;
    alias: string;
    origin: string;
    faviconUrl?: string | undefined;
    faviconBase64?: string;
  };
  onBind(origin: string): void;
  onOpen(url: string): void;
  isBinded: boolean;
  protocol: DisplayProtocol;
}) => {
  const previousBind = usePrevious(isBinded);
  const tip = useMemo(
    () => previousBind === false && isBinded,
    [isBinded, previousBind]
  );

  return (
    <DappItemWrapper>
      <DappFavicon
        className="dapp-icon"
        src={dapp.faviconBase64 ? dapp.faviconBase64 : dapp.faviconUrl}
        origin={dapp.origin}
      />
      <div className="flex-1 dapp-info">
        <p>{dapp.alias}</p>
        <p>{formatDappURLToShow(dapp.origin)}</p>
      </div>
      <TipsWrapper
        clickTips="Added"
        defaultClicked={tip}
        align={{
          targetOffset: [-65, 0],
        }}
      >
        {isBinded ? (
          <div className="flex">
            <div className="binded-tip">
              <img
                src="rabby-internal://assets/icons/home/success.svg"
                className="icon-success"
              />
              Bound to {protocol.name}
            </div>
            <Button
              type="primary"
              className="open-button rounded"
              onClick={() => onOpen(dapp.origin)}
            >
              Open
            </Button>
          </div>
        ) : (
          <Button
            type="primary"
            className="w-[72px] rounded"
            onClick={() => onBind(dapp.origin)}
          >
            Bind
          </Button>
        )}
      </TipsWrapper>
    </DappItemWrapper>
  );
};

const BindDapp = ({
  protocol,
  onCancel,
}: {
  protocol: DisplayProtocol;
  onCancel(e?: any): void;
}) => {
  const { dapps } = useTabedDapps();
  const [kw, setKw] = useState('');
  const [openAddDapp, setOpenAddDapp] = useState(false);
  const [addDappUrl, setAddDappUrl] = useState<string | undefined>(undefined);
  const { protocolDappsBinding, bindingDappsToProtocol } =
    useProtocolDappsBinding();

  const binded = useMemo(() => {
    return protocolDappsBinding[protocol.id];
  }, [protocolDappsBinding, protocol]);

  const searchResult = useMemo(() => {
    if (!kw) return [];
    try {
      const arr = dapps.filter(
        (dapp) =>
          dapp.alias.toLowerCase().includes(kw.toLowerCase()) ||
          dapp.origin.toLowerCase().includes(kw.toLowerCase())
      );
      return arr;
    } catch (e) {
      return [];
    }
  }, [kw, dapps]);

  // const shouldAdd = useMemo(() => {
  //   if (isDomainLikeKw && searchResult.length <= 0) return true;
  //   return false;
  // }, [isDomainLikeKw, searchResult]);
  // const shouldAdd = useMemo(() => {
  //   if (searchResult.length <= 0) return true;
  //   return false;
  // }, [searchResult]);

  const shouldAdd = useMemo(() => {
    return !!kw?.trim().length;
  }, [kw]);

  const handleBind = async (origin: string) => {
    await bindingDappsToProtocol(protocol.id, {
      origin,
      siteUrl: protocol.site_url,
    });
  };

  const openDapp = useOpenDapp();

  const handleOpenDapp = (url: string) => {
    onCancel();
    openDapp(url);
  };

  const handleAddDapp = () => {
    if (!shouldAdd) return;
    setAddDappUrl(kw);
    setTimeout(() => {
      setOpenAddDapp(true);
    }, 100);
  };

  const handleBack = (dapp: IDapp) => {
    setKw(dapp.alias);
    setOpenAddDapp(false);
  };

  return (
    <BindDappWrapper>
      <div className="header">Bind Dapp for {protocol.name}</div>
      <div className="body">
        <RabbyInput
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          className={styles.input}
          placeholder="Input the Dapp name or domain"
          autoFocus
          spellCheck={false}
          suffix={
            <img
              className="cursor-pointer"
              src="rabby-internal://assets/icons/add-dapp/icon-search.svg"
            />
          }
        />
        {(kw || searchResult.length > 0) && (
          <>
            <div className="search-result">
              {searchResult.length > 0 ? (
                searchResult.map((item) => (
                  <DappItem
                    dapp={item}
                    onBind={handleBind}
                    isBinded={binded?.origin === item.origin}
                    onOpen={handleOpenDapp}
                    protocol={protocol}
                    key={item.origin}
                  />
                ))
              ) : (
                <EmptyView>
                  <img
                    src="rabby-internal://assets/icons/home/no-search-result.svg"
                    alt=""
                  />
                  <p>No Match</p>
                </EmptyView>
              )}
            </div>
            <div
              className={classNames('footer', {
                'cursor-pointer': shouldAdd,
              })}
              onClick={handleAddDapp}
            >
              {shouldAdd ? (
                <div className="flex items-center">
                  <div className="flex-1">
                    Don't see the Dapp you want? Add{' '}
                    <span className="url">{ellipsisTokenSymbol(kw, 20)}</span>{' '}
                    as new Dapp and bind
                  </div>
                  <img
                    className="icon-enter"
                    src="rabby-internal://assets/icons/home/arrow-right.svg"
                  />
                </div>
              ) : (
                "Don't see the Dapp you want? Try searching the Dapp domain."
              )}
            </div>
          </>
        )}
      </div>
      <ModalAddDapp
        onCancel={() => setOpenAddDapp(false)}
        open={openAddDapp}
        url={addDappUrl}
        isGoBack
        onGoBackClick={handleBack}
      />
    </BindDappWrapper>
  );
};

export default function AssociateDappModal({
  onOk,
  relateDappProtocol,
  ...modalProps
}: React.PropsWithChildren<
  ModalProps & {
    relateDappProtocol: DisplayProtocol;
    onOk?: (origin: string) => void;
  }
>) {
  return (
    <Modal
      width={620}
      centered
      {...modalProps}
      onCancel={(e) => {
        modalProps.onCancel?.(e);
      }}
      footer={null}
      className={classNames('bind-dapp-modal', modalProps.className)}
      wrapClassName={classNames(modalProps.wrapClassName)}
      destroyOnClose
    >
      <BindDapp
        protocol={relateDappProtocol}
        onCancel={(e) => {
          modalProps.onCancel?.(e);
        }}
      />
    </Modal>
  );
}
