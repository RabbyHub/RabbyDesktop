import { formatDappURLToShow, makeDappURLToOpen } from '@/isomorphic/dapp';
import { SignTextHistoryItem } from '@/isomorphic/types/rabbyx';
import { DappFavicon } from '@/renderer/components/DappFavicon';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useMatchDappByOrigin } from '@/renderer/hooks/useDappsMngr';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { hex2Text } from '@/renderer/utils';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { sinceTime } from '@/renderer/utils/time';
import { message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useCopyToClipboard } from 'react-use';
import './style.less';
import { useDappOriginInfo } from '@/renderer/hooks/useDappOriginInfo';
import { Empty } from '../Empty';

const SignedTextHistoryItem = ({ item }: { item: SignTextHistoryItem }) => {
  const formatedContent = useMemo(() => {
    if (item.type === 'personalSign') {
      return hex2Text(item.text);
    }
    try {
      return JSON.stringify(JSON.parse(item.text), null, 2);
    } catch (e) {
      console.log('error', e);
      return item.text;
    }
  }, [item.text, item.type]);

  const [, copyToClipboard] = useCopyToClipboard();

  const handleCopyText = React.useCallback(() => {
    copyToClipboard(formatedContent);
    message.success('Copied');
  }, [formatedContent, copyToClipboard]);

  const { url, openDapp: handleClickLink } = useDappOriginInfo(
    item.site.origin
  );

  return (
    <div className="text-history__item">
      <div className="text-history__item--content">
        {formatedContent}
        <img
          src="rabby-internal://assets/icons/mainwin-settings/icon-copy-text.svg"
          className="icon icon-copy"
          onClick={handleCopyText}
        />
      </div>
      <div className="text-history__item--footer">
        <div className="site">
          <DappFavicon
            src={item.site.icon}
            origin={item.site.origin}
            width="14px"
            height="14px"
            style={{
              borderRadius: '2px',
            }}
          />
          {url ? (
            <div className="link" onClick={handleClickLink}>
              {url}
            </div>
          ) : null}
        </div>
        <div className="time">{sinceTime(item.createAt / 1000)}</div>
      </div>
    </div>
  );
};

const SignedTextHistory = () => {
  const [textHistory, setTextHistory] = useState<SignTextHistoryItem[]>([]);

  const init = async (address?: string) => {
    if (!address) {
      return;
    }
    const history = await walletController.getSignTextHistory(address);
    setTextHistory(history);
  };

  const { currentAccount } = useCurrentAccount();

  useEffect(() => {
    init(currentAccount?.address);
  }, [currentAccount?.address]);

  return (
    <div className="text-history">
      {textHistory.map((item) => (
        <SignedTextHistoryItem item={item} />
      ))}
      {textHistory.length <= 0 && (
        <Empty
          title="No signed texts yet"
          desc="All texts signed via Rabby will be listed here."
          className="pt-[120px]"
        />
      )}
    </div>
  );
};

export default SignedTextHistory;
