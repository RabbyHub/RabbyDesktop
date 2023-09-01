export type AllBackgroundStores = {
  contactBook: import('./contactBook').ContactBookStore;
  preference: import('./preference').PreferenceStore;
  whitelist: import('./whitelist').WhitelistStore;
};
