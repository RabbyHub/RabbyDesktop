import classNames from 'classnames';
import React from 'react';
import { Step } from './Step';

export const StepGroup: React.FC = () => {
  const onAddDapp = React.useCallback(() => {}, []);
  const onTweet = React.useCallback(() => {}, []);
  const onMint = React.useCallback(() => {}, []);
  return (
    <section className={classNames('flex m-auto')}>
      <Step
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
        no={3}
        title="Free Mint 1 NFT"
        buttonText="Mint"
        onButtonClick={onMint}
      />
    </section>
  );
};
