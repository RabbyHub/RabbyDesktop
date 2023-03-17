import { openExternalUrl } from '@/renderer/ipcRequest/app';
import classNames from 'classnames';
import React from 'react';
import { MintedData } from './util';

const LabelButton = ({
  icon,
  label,
  to,
}: {
  to: string;
  icon: string;
  label: string;
}) => {
  const onClickLink = () => {
    openExternalUrl(to);
  };

  return (
    <div
      onClick={onClickLink}
      className={classNames(
        'flex flex-cols gap-[6px] items-center',
        'cursor-pointer hover:opacity-80'
      )}
    >
      <img src={icon} alt={label} />
      <span>{label}</span>
    </div>
  );
};

export const MintedSuccessful: React.FC<Partial<MintedData>> = ({
  contractAddress,
  tokenId,
} = {}) => {
  return (
    <div className="m-auto">
      <h1
        className={classNames(
          'flex gap-[10px] flex-cols items-center mb-[12px]',
          'text-white text-[20px]'
        )}
      >
        <span className="text-[26px]">🎉</span>
        <span>Mint successfully {tokenId ? `#${tokenId}` : ''}</span>
      </h1>

      <section
        className={classNames(
          'flex gap-[10px] flex-cols items-center justify-center',
          'text-[12px] opacity-70'
        )}
      >
        <LabelButton
          to={`https://opensea.io/assets/${contractAddress}/${tokenId ?? ''}`}
          icon="rabby-internal://assets/icons/mint/opensea.svg"
          label="OpenSea"
        />

        <LabelButton
          to="https://discord.com/invite/aDpDE7DNQe"
          icon="rabby-internal://assets/icons/mint/discord.svg"
          label="Discord"
        />
      </section>
    </div>
  );
};
