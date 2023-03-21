import { toastMessage } from '@/renderer/components/TransparentToast';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useTabedDapps } from '@/renderer/hooks/useDappsMngr';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useOnTxFinished } from '@/renderer/routes/SendToken/hooks';
import { ellipsis } from '@/renderer/utils/address';
import classNames from 'classnames';
import { useAtom } from 'jotai';
import React from 'react';
import { NFTModal } from './NFTModal';
import { Step } from './Step';
import { TweetModal } from './TweetModal';
import { isTweetAtom, MintedData } from './util';

interface Props {
  onMinted: (params: MintedData) => void;
}

export const StepGroup: React.FC<Props> = ({ onMinted }) => {
  const { dapps } = useTabedDapps();
  const [openTweetModal, setOpenTweetModal] = React.useState(false);
  const [openNFTModal, setOpenNFTModal] = React.useState(false);
  const hashRef = React.useRef<string>('');
  const [isMinting, setIsMinting] = React.useState(false);
  const { currentAccount } = useCurrentAccount();
  const [isAddDapp, setIsAddDapp] = React.useState(false);
  const [isTweet, setIsTweet] = useAtom(isTweetAtom);
  const accountAddress = currentAccount?.address as string;

  // 1. add dapp, then listen dapps length change to next step
  const onAddDapp = React.useCallback(() => {
    showMainwinPopupview({ type: 'dapps-management' });
  }, []);

  React.useEffect(() => {
    setIsAddDapp(dapps.length > 0);
  }, [dapps]);

  // 2. tweet, then listen send tweet to next step
  const onTweet = React.useCallback(() => {
    setOpenTweetModal(true);
  }, []);

  const handleCloseTweetModal = React.useCallback(
    (result: boolean) => {
      setOpenTweetModal(false);
      setIsTweet((prev) => {
        return {
          ...prev,
          [accountAddress]: result,
        };
      });
    },
    [accountAddress, setIsTweet]
  );

  // 3. mint, then listen tx finished to show minted successful
  const onMint = React.useCallback(() => {
    setOpenNFTModal(true);
  }, []);

  const checkTxInfo = React.useCallback(async () => {
    const { completeds } = await walletController.getTransactionHistory(
      accountAddress
    );

    const mintedTx = completeds.find(({ txs }) =>
      txs.find(({ hash }) => hash === hashRef.current)
    );
    if (mintedTx) {
      const nft = mintedTx.explain?.balance_change?.receive_nft_list?.[0];
      if (nft) {
        const { inner_id, contract_id, detail_url } = nft;

        onMinted({
          tokenId: inner_id,
          contractAddress: contract_id,
          detailUrl: detail_url,
        });
      } else {
        onMinted({
          tokenId: '',
          contractAddress: '',
          detailUrl: '',
        });
      }

      toastMessage({
        type: 'success',
        content: `${ellipsis(hashRef.current)} Minted successfully`,
      });
    } else {
      console.error(
        `Can't find tx with hash ${hashRef.current}, account: ${accountAddress}`
      );
    }

    setIsMinting(false);
  }, [accountAddress, onMinted]);

  // close nft modal and start to watch tx
  const handleCloseNFTModal = React.useCallback((result: string) => {
    setOpenNFTModal(false);
    if (result) {
      setIsMinting(true);
      hashRef.current = result;
    }
  }, []);

  const watchMintFinished = React.useCallback(
    async (result: { hash: string }) => {
      if (result.hash === hashRef.current) {
        checkTxInfo();
      }
    },
    [checkTxInfo]
  );

  useOnTxFinished(watchMintFinished);

  return (
    <section className={classNames('flex m-auto')}>
      <TweetModal open={openTweetModal} onClose={handleCloseTweetModal} />
      <NFTModal open={openNFTModal} onClose={handleCloseNFTModal} />
      <Step
        no={1}
        isDone={isAddDapp}
        title="Add a Dapp"
        buttonText="Add"
        onButtonClick={onAddDapp}
      />
      <img
        className="ml-[11px] mr-[23px]"
        src="rabby-internal://assets/icons/mint/step-next.svg"
      />
      <Step
        no={2}
        isDone={isTweet[accountAddress]}
        title="Share on Twitter"
        buttonText="Tweet"
        onButtonClick={onTweet}
      />
      <img
        className="mx-[17px]"
        src="rabby-internal://assets/icons/mint/step-next.svg"
      />

      <Step
        disabled={!isTweet[accountAddress] || !isAddDapp}
        no={3}
        title="Free Mint 1 NFT"
        buttonText={isMinting ? 'Minting' : 'Mint'}
        onButtonClick={onMint}
        loading={isMinting}
      />
    </section>
  );
};
