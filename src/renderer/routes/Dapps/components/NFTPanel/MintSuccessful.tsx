import { openExternalUrl } from '@/renderer/ipcRequest/app';
import React from 'react';

export interface Props {
  hash: string;
  mintId: string;
}

export const MintSuccessful: React.FC<Props> = ({ hash, mintId }) => {
  const openOpenSea = () => {
    openExternalUrl(
      `https://opensea.io/assets/ethereum/0xe473a20617f20f4a7b4fbdd39490380b78430141/${mintId}`
    );
  };

  const openDiscord = () => {
    openExternalUrl('https://discord.com/invite/aDpDE7DNQe');
  };
  return (
    <div>
      <h1>
        <span>🎉</span> Mint successfully #{mintId}
      </h1>
      <section>
        <div onClick={openOpenSea}>
          <img
            src="internal-rabby://assets/icons/mint/opensea.svg"
            alt="opensea"
          />
          <span>OpenSea</span>
        </div>
        <div onClick={openDiscord}>
          <img
            src="internal-rabby://assets/icons/mint/discord.svg"
            alt="discord"
          />
          <span>Discord</span>
        </div>
      </section>
    </div>
  );
};
