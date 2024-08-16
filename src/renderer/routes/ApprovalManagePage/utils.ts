import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

import {
  ApprovalItem,
  AssetApprovalSpender,
  ContractApprovalItem,
  RiskNumMap,
  SpenderInTokenApproval,
  compareContractApprovalItemByRiskLevel,
} from '@/renderer/utils/approval';
import { ApprovalSpenderItemToBeRevoked } from '@/isomorphic/approve';
import { SorterResult } from 'antd/lib/table/interface';
import {
  NFTApproval,
  NFTApprovalContract,
  Spender,
} from '@rabby-wallet/rabby-api/dist/types';
import { Chain } from '@debank/common';
import { openExternalUrl } from '@/renderer/ipcRequest/app';

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

export function formatTimeFromNow(time?: Date | number) {
  if (!time) return '';

  const obj = dayjs(time);
  if (!obj.isValid()) return '';

  dayjs.updateLocale('en', {
    relativeTime: {
      future: 'in %s',
      past: '%s ago',
      s: 'a few seconds',
      m: '1 minute',
      mm: '%d minutes',
      h: '1 hour',
      hh: '%d hours',
      d: '1 day',
      dd: '%d days',
      M: '1 month',
      MM: '%d months',
      y: '1 year',
      yy: '%d years',
    },
  });

  return dayjs(time).fromNow();
}

export function isRiskyContract(contract: ContractApprovalItem) {
  return ['danger', 'warning'].includes(contract.risk_level);
}

export function checkCompareContractItem(
  a: ContractApprovalItem,
  b: ContractApprovalItem,
  sortedInfo: SorterResult<ContractApprovalItem>,
  columnKey: string
) {
  const comparison = compareContractApprovalItemByRiskLevel(a, b);

  const isColumnAsc =
    sortedInfo.columnKey === columnKey && sortedInfo.order === 'ascend';

  return {
    comparison,
    shouldEarlyReturn: !!comparison,
    keepRiskFirstReturnValue: isColumnAsc ? -comparison : comparison,
  };
}

export function encodeRevokeItemIndex(approval: ApprovalItem) {
  return `${approval.chain}:${approval.id}`;
}

export function getFirstSpender(spenderHost: ApprovalItem['list'][number]) {
  if ('spender' in spenderHost) return spenderHost.spender;

  if ('spenders' in spenderHost) return spenderHost.spenders[0];

  return undefined;
}

type SpendersHost = ApprovalItem['list'][number];
/**
 * @description spenderHost should from `contract.list[number]`
 * @param spenderHost
 * @param contract
 * @returns
 */
function queryContractMatchedSpender(
  spenderHost: SpendersHost,
  contract: ContractApprovalItem
) {
  const result = {
    ofContractPermit2Spender: undefined as Spender | undefined,
    matchedSpenders: [] as SpenderInTokenApproval[],
  };
  if ('spenders' in spenderHost) {
    spenderHost.spenders.forEach((spender: SpenderInTokenApproval) => {
      if (
        spender.$assetContract &&
        spender.$assetContract?.id === contract.id
      ) {
        result.matchedSpenders.push(spender);
        if (spender.permit2_id) {
          result.ofContractPermit2Spender = spender;
        }
      }
    });
  }

  return result;
}

export const findIndexRevokeList = <
  T extends SpendersHost = ApprovalItem['list'][number]
>(
  list: ApprovalSpenderItemToBeRevoked[],
  input: {
    spenderHost: T;
  } & (
    | {
        item: ContractApprovalItem;
        itemIsContractApproval?: true;
      }
    | {
        item: Exclude<ApprovalItem, ContractApprovalItem>;
        assetApprovalSpender?: AssetApprovalSpender;
      }
  )
) => {
  const { item, spenderHost } = input;

  if (item.type === 'contract') {
    let assetApprovalSpender =
      'assetApprovalSpender' in input
        ? input.assetApprovalSpender ?? null
        : null;
    const itemIsContractApproval =
      'itemIsContractApproval' in input ? input.itemIsContractApproval : false;
    if (itemIsContractApproval && '$indexderSpender' in spenderHost) {
      assetApprovalSpender = spenderHost.$indexderSpender ?? null;
    }
    const permit2IdToMatch = assetApprovalSpender?.permit2_id;

    if ('inner_id' in spenderHost) {
      return list.findIndex((revoke) => {
        if (
          revoke.contractId === spenderHost.contract_id &&
          revoke.spender === spenderHost.spender.id &&
          (permit2IdToMatch
            ? revoke.permit2Id === permit2IdToMatch
            : !revoke.permit2Id) &&
          revoke.tokenId === spenderHost.inner_id &&
          revoke.chainServerId === spenderHost.chain
        ) {
          return true;
        }
        return false;
      });
    }
    if ('contract_name' in spenderHost) {
      return list.findIndex((revoke) => {
        if (
          revoke.contractId === spenderHost.contract_id &&
          revoke.spender === spenderHost.spender.id &&
          (permit2IdToMatch
            ? revoke.permit2Id === permit2IdToMatch
            : !revoke.permit2Id) &&
          revoke.chainServerId === spenderHost.chain
        ) {
          return true;
        }
        return false;
      });
    }
    return list.findIndex((revoke) => {
      if (
        revoke.spender === item.id &&
        (permit2IdToMatch
          ? revoke.permit2Id === permit2IdToMatch
          : !revoke.permit2Id) &&
        revoke.tokenId === spenderHost.id &&
        revoke.chainServerId === item.chain
      ) {
        return true;
      }
      return false;
    });
  }
  if (item.type === 'token') {
    return list.findIndex((revoke) => {
      if (
        revoke.spender === (spenderHost as Spender).id &&
        // revoke.id === item.id &&
        revoke.tokenId === item.id &&
        revoke.chainServerId === item.chain
      ) {
        return true;
      }
      return false;
    });
  }
  if (item.type === 'nft') {
    return list.findIndex((revoke) => {
      const isNftContracts = !!item.nftContract;
      const nftInfo = isNftContracts ? item.nftContract : item.nftToken;

      if (
        revoke.spender === (spenderHost as Spender).id &&
        revoke.tokenId === (nftInfo as NFTApproval).inner_id &&
        revoke.chainServerId === item.chain
      ) {
        return true;
      }
      return false;
    });
  }
  return -1;
};

export const toRevokeItem = <T extends ApprovalItem>(
  item: T,
  spenderHost: T['list'][number],
  assetApprovalSpenderOrIsContractItem?: AssetApprovalSpender | true
): ApprovalSpenderItemToBeRevoked | undefined => {
  if (item.type === 'contract') {
    const assetApprovalSpender =
      assetApprovalSpenderOrIsContractItem === true
        ? '$indexderSpender' in spenderHost
          ? spenderHost.$indexderSpender
          : null
        : assetApprovalSpenderOrIsContractItem ?? null;

    const permit2Id = assetApprovalSpender?.permit2_id;

    if ('inner_id' in spenderHost) {
      const abi = spenderHost?.is_erc721
        ? 'ERC721'
        : spenderHost?.is_erc1155
        ? 'ERC1155'
        : '';
      return {
        chainServerId: spenderHost?.chain,
        contractId: spenderHost?.contract_id,
        permit2Id,
        spender: spenderHost?.spender?.id,
        abi,
        nftTokenId: spenderHost?.inner_id,
        isApprovedForAll: false,
      } as const;
    }
    if ('contract_name' in spenderHost) {
      const abi = spenderHost?.is_erc721
        ? 'ERC721'
        : spenderHost?.is_erc1155
        ? 'ERC1155'
        : '';
      return {
        chainServerId: spenderHost?.chain,
        contractId: spenderHost?.contract_id,
        permit2Id,
        spender: spenderHost?.spender?.id,
        nftTokenId: null,
        abi,
        isApprovedForAll: true,
      } as const;
    }
    return {
      chainServerId: item.chain,
      permit2Id,
      tokenId: spenderHost?.id,
      id: spenderHost?.id,
      spender: item.id,
    };
  }

  if (item.type === 'token') {
    return {
      chainServerId: item.chain,
      tokenId: (spenderHost as Spender).id,
      id: item.id,
      spender: (spenderHost as Spender).id,
    };
  }

  if (item.type === 'nft') {
    const isNftContracts = !!item.nftContract;
    const nftInfo = isNftContracts ? item.nftContract : item.nftToken;
    const abi = nftInfo?.is_erc721
      ? 'ERC721'
      : nftInfo?.is_erc1155
      ? 'ERC1155'
      : '';
    return {
      chainServerId: item?.chain,
      contractId: nftInfo?.contract_id || '',
      spender: (spenderHost as Spender).id,
      nftTokenId: (nftInfo as NFTApproval)?.inner_id || null,
      abi,
      isApprovedForAll: !(nftInfo && 'inner_id' in nftInfo),
    };
  }

  return undefined;
};

export function getFinalRiskInfo(contract: ContractApprovalItem) {
  const eva = contract.$contractRiskEvaluation;
  const finalMaxScore = Math.max(eva.clientMaxRiskScore, eva.serverRiskScore);

  const isDanger = finalMaxScore >= RiskNumMap.danger;
  const isWarning = !isDanger && finalMaxScore >= RiskNumMap.warning;

  return {
    isServerRisk: eva.serverRiskScore >= RiskNumMap.warning,
    // isServerDanger: eva.serverRiskScore >= RiskNumMap.danger,
    // isServerWarning: eva.serverRiskScore >= RiskNumMap.warning,
    isDanger,
    isWarning,
  };
}

export function openScanLinkFromChainItem(
  spanLink: Chain['scanLink'] | null | undefined,
  address: string
) {
  if (!spanLink) return;

  openExternalUrl(spanLink.replace(/tx\/_s_/, `address/${address}`));
}

export function maybeNFTLikeItem(
  contractListItem: ContractApprovalItem['list'][number]
): contractListItem is NFTApproval | NFTApprovalContract {
  return (
    'spender' in contractListItem &&
    (contractListItem.is_erc1155 || contractListItem.is_erc721)
  );
}
