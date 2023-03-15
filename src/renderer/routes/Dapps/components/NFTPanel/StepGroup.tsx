import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import classNames from 'classnames';
import React from 'react';
import { Step } from './Step';

export const StepGroup: React.FC = () => {
  const [currentNo, setCurrentNo] = React.useState(3);

  const onAddDapp = React.useCallback(() => {
    showMainwinPopupview({ type: 'dapps-management' });
    // TODO: check if dapp is added
    setCurrentNo(2);
  }, []);
  const onTweet = React.useCallback(() => {}, []);
  const onMint = React.useCallback(() => {
    walletController.mintRabby().then(console.log);
  }, []);
  return (
    <section className={classNames('flex m-auto')}>
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
        buttonText="Mint"
        onButtonClick={onMint}
      />
    </section>
  );
};
