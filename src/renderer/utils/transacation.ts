import { KEYRING_CATEGORY_MAP } from './constant';

export function getKRCategoryByType(type?: string) {
  return KEYRING_CATEGORY_MAP[type as any] || null;
}
