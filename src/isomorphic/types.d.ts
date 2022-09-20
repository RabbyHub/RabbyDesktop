type IDapp = {
  // TODO: implement it;
  id?: string;
  alias: string;
  origin: string | `https://${string}${string}`;
  faviconUrl: string;
  faviconBase64?: string;
};

type IDesktopAppState = {
  firstStartApp: boolean
}

type IDappsDetectResult<T extends string = string> = {
  data: null | {
    urlInfo: Partial<URL> | null;
    origin: string;
    icon: import('parse-favicon').Icon;
    faviconUrl: string;
    faviconBase64?: string; // base64
  }
  error?: {
    type: T;
    message?: string;
  }
}
