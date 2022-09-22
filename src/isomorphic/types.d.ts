/* from builder-util-runtime/out/ProgressCallbackTransform.d.ts */
interface ProgressInfo {
  total: number;
  delta: number;
  transferred: number;
  percent: number;
  bytesPerSecond: number;
}


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
    icon: import('@debank/parse-favicon').Icon;
    faviconUrl: string;
    faviconBase64?: string; // base64
  }
  error?: {
    type: T;
    message?: string;
  }
}

type IAppUpdatorCheckResult = {
  hasNewRelease: true,
  releaseVersion: string
} | {
  hasNewRelease: false,
  releaseVersion: null
}

type IAppUpdatorDownloadProgress = {
  progress: ProgressInfo
  isEnd: false
} | {
  progress: null
  isEnd: true
}
