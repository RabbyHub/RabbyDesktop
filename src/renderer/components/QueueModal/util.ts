import { isSameAddress } from '@/renderer/utils/address';

export const crossCompareOwners = (owners1: string[], owners2: string[]) => {
  return owners1.filter(
    (owner) => !!owners2.find((own) => isSameAddress(own, owner))
  );
};
