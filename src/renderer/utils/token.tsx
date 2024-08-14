/* eslint-disable import/no-cycle */
/* eslint-disable no-multi-assign */
import BigNumber from 'bignumber.js';

import { GasLevel, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { Contract, providers } from 'ethers';
import { hexToString } from 'web3-utils';
import styled from 'styled-components';
import LabelWithIcon from '@/renderer/components/LabelWithIcon';
import TokensIcons from '../routes/Home/components/TokenIcons';
import { formatUsdValue } from './number';
import { getCollectionDisplayName, PortfolioItemNft } from './nft';
import { TokenActionSymbol } from '../components/TokenActionModal/TokenActionModal';
import { getTokenSymbol } from '.';
import { findChain } from './chain';
import { MINIMUM_GAS_LIMIT } from './constant';

export const ellipsisTokenSymbol = (text: string, length = 6) => {
  if (text?.length <= length) return text;

  const regexp = new RegExp(`^(.{${length}})(.*)$`);
  return text?.replace(regexp, '$1...');
};

export const isTestnetTokenItem = (token: TokenItem) => {
  return findChain({
    serverId: token.chain,
  })?.isTestnet;
};

function checkGasIsEnough({
  token_balance_hex,
  price,
  gasLimit,
}: {
  token_balance_hex: TokenItem['raw_amount_hex_str'];
  price: number;
  gasLimit: number;
}) {
  return new BigNumber(token_balance_hex || 0, 16).gte(
    new BigNumber(gasLimit).times(price)
  );
}
export function checkIfTokenBalanceEnough(
  token: TokenItem,
  options?: {
    gasList?: GasLevel[];
    gasLimit?: number;
  }
) {
  const { gasLimit = MINIMUM_GAS_LIMIT, gasList = [] } = options || {};
  const normalLevel = gasList?.find((e) => e.level === 'normal');
  const slowLevel = gasList?.find((e) => e.level === 'slow');
  const customLevel = gasList?.find((e) => e.level === 'custom');

  const isNormalEnough = checkGasIsEnough({
    token_balance_hex: token?.raw_amount_hex_str,
    price: normalLevel?.price || 0,
    gasLimit,
  });
  const isSlowEnough = checkGasIsEnough({
    token_balance_hex: token?.raw_amount_hex_str,
    price: slowLevel?.price || 0,
    gasLimit,
  });

  return {
    normalLevel,
    isNormalEnough,
    isSlowEnough,
    slowLevel,
    customLevel,
  };
}

export const geTokenDecimals = async (
  id: string,
  provider: providers.JsonRpcProvider
) => {
  try {
    const contract = new Contract(
      id,
      [
        {
          constant: true,
          inputs: [],
          name: 'decimals',
          outputs: [
            {
              name: '',
              type: 'uint8',
            },
          ],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
      ],
      provider
    );
    const decimals = await contract.decimals();
    return decimals;
  } catch (e) {
    const contract = new Contract(
      id,
      [
        {
          constant: true,
          inputs: [],
          name: 'DECIMALS',
          outputs: [
            {
              name: '',
              type: 'uint8',
            },
          ],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
      ],
      provider
    );
    return contract.DECIMALS();
  }
};

export const getTokenName = async (
  id: string,
  provider: providers.JsonRpcProvider
) => {
  try {
    const contract = new Contract(
      id,
      [
        {
          constant: true,
          inputs: [],
          name: 'name',
          outputs: [
            {
              name: '',
              type: 'string',
            },
          ],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
      ],
      provider
    );
    const name = await contract.name();
    return name;
  } catch (e) {
    try {
      const contract = new Contract(
        id,
        [
          {
            constant: true,
            inputs: [],
            name: 'name',
            outputs: [
              {
                name: '',
                type: 'bytes32',
              },
            ],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
        ],
        provider
      );
      const name = await contract.name();
      return hexToString(name);
    } catch (error) {
      const contract = new Contract(
        id,
        [
          {
            constant: true,
            inputs: [],
            name: 'NAME',
            outputs: [
              {
                name: '',
                type: 'string',
              },
            ],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
        ],
        provider
      );
      return contract.NAME();
    }
  }
};

export type ValidateTokenParam = {
  id: string;
  symbol: string;
  decimals: number;
};

export function wrapUrlInImg(
  url: string,
  alt?: string,
  size?: number,
  style?: React.CSSProperties
) {
  return (
    <img
      src={url}
      style={{ ...style, width: size || 20, height: size || 20 }}
      alt={alt || ''}
      onError={(ev) => {
        // @ts-ignore
        ev.target.src =
          'rabby-internal://assets/icons/common/token-default.svg';
      }}
    />
  );
}

export const wrapUrlInImgOrDefault = (
  url?: string,
  size?: number,
  style?: React.CSSProperties
) => {
  return url ? (
    wrapUrlInImg(url, undefined, size, style)
  ) : (
    <img
      src="rabby-internal://assets/icons/common/token-default.svg"
      style={{ ...style, width: size || 20, height: size || 20 }}
    />
  );
};

const DebtTag = styled.div`
  border: 1px solid #ff6565;
  border-radius: 4px;
  padding: 2px 5px;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  text-transform: uppercase;
  color: #ff6565;
  margin-left: 6px;
`;

export function getTokens(
  tokens: TokenItem[] = [],
  separator = ' + ',
  isDebt = false,
  nfts?: PortfolioItemNft[],
  enableAction?: boolean
) {
  const tokenStr = tokens
    .filter((item) => !!item)
    .map((token, idx) => (
      <span key={token.id}>
        {idx !== 0 && separator}
        <TokenActionSymbol enable={enableAction} token={token}>
          {ellipsisTokenSymbol(getTokenSymbol(token))}
        </TokenActionSymbol>
      </span>
    ));

  const nftStr = nfts
    ?.map((n) => getCollectionDisplayName(n.collection))
    .join(separator);
  const label = nftStr ? (
    <>
      {nftStr} {separator} {tokenStr}
    </>
  ) : (
    tokenStr
  );
  const icon = (
    <TokensIcons
      icons={tokens
        .filter((item) => item.chain !== '0')
        .map((v) => v?.logo_url)}
      nftIcons={nfts?.map((n) => n.collection?.logo_url)}
    />
  );
  return (
    <div className="flex items-center flex-wrap">
      <LabelWithIcon label={label} icon={icon} />
      {isDebt && <DebtTag>Debt</DebtTag>}
    </div>
  );
}

export function getUsd(tokens: TokenItem[] = []) {
  // 沒有价格
  if (tokens.every((v) => !v.price)) return '-';
  return `${formatUsdValue(
    tokens.reduce((sum, curr) => {
      const res = (sum += (curr.price || 0) * curr.amount);
      return res;
    }, 0)
  )}`;
}

export type PortfolioItemToken = {
  logo_url: string;
  amount: number;
  symbol: string;
  display_symbol?: string;
  optimized_symbol?: string;
  price: number;
  id: string;
  chain: string;
  claimable_amount?: number;
  is_custom?: boolean;
};
