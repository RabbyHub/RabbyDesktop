import { useTabedDapps } from '@/renderer/hooks/useDappsMngr';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { useOnTxFinished } from '@/renderer/routes/SendToken/hooks';
import classNames from 'classnames';
import React from 'react';
import { NFTModal } from './NFTModal';
import { Step } from './Step';
import { TweetModal } from './TweetModal';

export const StepGroup: React.FC = () => {
  const [currentNo, setCurrentNo] = React.useState(1);
  const { dapps } = useTabedDapps();
  const [openTweetModal, setOpenTweetModal] = React.useState(false);
  const [openNFTModal, setOpenNFTModal] = React.useState(false);
  const hashRef = React.useRef<string>();
  const [isMinting, setIsMinting] = React.useState(false);
  const [isMinted, setIsMinted] = React.useState(false);

  const onAddDapp = React.useCallback(() => {
    showMainwinPopupview({ type: 'dapps-management' });
  }, []);
  const onTweet = React.useCallback(() => {
    setOpenTweetModal(true);
  }, []);
  const onMint = React.useCallback(() => {
    setOpenNFTModal(true);
  }, []);
  const handleCloseTweetModal = React.useCallback((isSendTweet: boolean) => {
    setOpenTweetModal(false);
    if (isSendTweet) {
      setCurrentNo(3);
    }
  }, []);
  const handleCloseNFTModal = React.useCallback((result: string) => {
    setOpenNFTModal(false);
    if (result) {
      setIsMinting(true);
      hashRef.current = result;
    }
  }, []);

  React.useEffect(() => {
    if (currentNo === 1) {
      if (dapps.length > 0) {
        setCurrentNo(2);
      }
    }
  }, [dapps, currentNo]);

  const watchMintFinished = React.useCallback((result: { hash: string }) => {
    if (result.hash === hashRef.current) {
      setIsMinting(false);
      setIsMinted(true);
    }
  }, []);

  useOnTxFinished(watchMintFinished);

  return (
    <section className={classNames('flex m-auto')}>
      <TweetModal open={openTweetModal} onClose={handleCloseTweetModal} />
      <NFTModal open={openNFTModal} onClose={handleCloseNFTModal} />
      <Step
        currentNo={currentNo}
        no={1}
        title="Add a Dapp"
        buttonText="Add"
        onButtonClick={onAddDapp}
      />
      <img
        className="ml-[11px] mr-[23px]"
        src="rabby-internal://assets/icons/add-dapp/step-next.svg"
      />
      <Step
        currentNo={currentNo}
        no={2}
        title="Share on Twitter"
        buttonText="Tweet"
        onButtonClick={onTweet}
      />
      <img
        className="mx-[17px]"
        src="rabby-internal://assets/icons/add-dapp/step-next.svg"
      />

      <Step
        currentNo={currentNo}
        no={3}
        title="Free Mint 1 NFT"
        buttonText={isMinting ? 'Minting' : 'Mint'}
        onButtonClick={onMint}
        loading={isMinting}
      />
    </section>
  );
};
