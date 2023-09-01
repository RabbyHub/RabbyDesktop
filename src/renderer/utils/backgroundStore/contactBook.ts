export interface ContactBookItem {
  name: string;
  address: string;
  isAlias: boolean;
  isContact: boolean;
}

export interface UIContactBookItem {
  name: string;
  address: string;
}

export type ContactBookStore = Record<string, ContactBookItem | undefined>;
