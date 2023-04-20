/* eslint-disable import/no-cycle */
/* eslint-disable no-multi-assign */
import { TokenItem } from '@debank/rabby-api/dist/types';
import { Contract, providers } from 'ethers';
import { hexToString } from 'web3-utils';
import styled from 'styled-components';
import { PropsWithChildren, useCallback } from 'react';
import clsx from 'clsx';
import LabelWithIcon from '@/renderer/components/LabelWithIcon';
import TokensIcons from '../routes/Home/components/TokenIcons';
import { formatUsdValue } from './number';
import { getCollectionDisplayName, PortfolioItemNft } from './nft';
import { useTokenAction } from '../routes/Home/components/TokenActionModal';

export const ellipsisTokenSymbol = (text: string, length = 6) => {
  if (text?.length <= length) return text;

  const regexp = new RegExp(`^(.{${length}})(.*)$`);
  return text?.replace(regexp, '$1...');
};

export const getTokenSymbol = async (
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
          name: 'symbol',
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
    const symbol = await contract.symbol();
    return symbol;
  } catch (e) {
    try {
      const contract = new Contract(
        id,
        [
          {
            constant: true,
            inputs: [],
            name: 'symbol',
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
      const symbol = await contract.symbol();
      return hexToString(symbol);
    } catch (error) {
      const contract = new Contract(
        id,
        [
          {
            constant: true,
            inputs: [],
            name: 'SYMBOL',
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
      return contract.SYMBOL();
    }
  }
};

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

const TokenAction = (
  props: PropsWithChildren<{ enableAction?: boolean; token: TokenItem }>
) => {
  const { token, enableAction = true, children } = props;
  const { enableTokenAction, setTokenAction } = useTokenAction();

  const handleClick = useCallback(() => {
    if (enableAction && enableTokenAction) {
      setTokenAction(token);
    }
  }, [enableAction, enableTokenAction, setTokenAction, token]);

  return (
    <span
      onClick={handleClick}
      className={clsx(
        enableAction &&
          enableTokenAction &&
          'hover:underline hover:text-blue-light cursor-pointer'
      )}
    >
      {children}
    </span>
  );
};

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
        <TokenAction enableAction={enableAction} token={token}>
          {ellipsisTokenSymbol(token.symbol)}
        </TokenAction>
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
