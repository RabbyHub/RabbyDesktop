import { Tooltip } from 'antd';
import { ZORE_MINT_FEE } from './util';

export const ZoraTip = () => {
  return (
    <span className="ml-[5px]">
      <Tooltip
        overlayClassName="max-w-[none]"
        title={`A ${ZORE_MINT_FEE}ETH fee goes to Zora for each mint.`}
      >
        <img src="rabby-internal://assets/icons/mint/icon-help.svg" />
      </Tooltip>
    </span>
  );
};
