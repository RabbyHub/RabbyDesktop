import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import type { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { BrowserView, BrowserWindow } from 'electron';
import { Subject, ReplaySubject, Observable } from 'rxjs';
import type { MainTabbedBrowserWindow } from '../browser/browsers';
import { cLog } from '../utils/log';

type IConf<T extends Subject<any>> = {
  subject: T;
  once?: boolean;
};
const CONF = {
  userAppReady: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<ReplaySubject<void>>,
  sessionReady: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<ReplaySubject<IAppSession>>,
  electronChromeExtensionsReady: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<ReplaySubject<ElectronChromeExtensions>>,

  webuiExtensionReady: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<ReplaySubject<Electron.Extension>>,
  rabbyExtensionLoaded: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<ReplaySubject<Electron.Extension>>,
  rabbyExtViews: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<
    ReplaySubject<{
      rabbyNotificationGasket: Electron.BrowserView;
      backgroundWebContents: Electron.WebContents;
    }>
  >,

  mainWindowReady: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<ReplaySubject<MainTabbedBrowserWindow>>,
  mainWindowActiveTabRect: {
    subject: new Subject(),
  } as IConf<Subject<IMainWindowActiveTabRect>>,
  dappLoadingView: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<ReplaySubject<BrowserView>>,
  dappSafeModeViews: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<
    ReplaySubject<{
      baseView: BrowserView;
    }>
  >,
  securityCheckPopupWindowReady: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<ReplaySubject<BrowserWindow>>,
  securityAddressbarPopup: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<ReplaySubject<BrowserWindow>>,

  popupWindowOnMain: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<
    ReplaySubject<{
      sidebarContext: BrowserWindow;
      ghostFloatingWindow: BrowserWindow;
    }>
  >,
  popupViewsOnMainwinReady: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<
    ReplaySubject<{
      addAddress: BrowserView;
      dappsManagement: BrowserView;
      selectDevices: BrowserView;
      zPopup: BrowserView;
      globalToastPopup: BrowserView;
      inDappFind: BrowserView;
      rightSidePopup: BrowserView;
    }>
  >,

  appRuntimeProxyConf: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<IRunningAppProxyConf>>,

  appTray: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<Electron.Tray>>,

  // todo fix me
  ipfsServiceReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<import('../utils/ipfs').IpfsService>>,
};

type IMainSubjects = typeof CONF;
type IMainSubjectValues<K extends keyof IMainSubjects> =
  IMainSubjects[K]['subject'] extends ReplaySubject<infer V>
    ? V
    : IMainSubjects[K]['subject'] extends Subject<infer V>
    ? V
    : never;

const store = (Object.keys(CONF) as (keyof IMainSubjects)[]).reduce(
  (acc, type) => {
    acc[type] = {
      initialized: false,
      observable: CONF[type].subject.asObservable() as Observable<
        Exclude<IMainSubjectValues<typeof type>, void>
      >,
    };

    return acc;
  },
  {} as {
    [K in keyof IMainSubjects]: {
      initialized: boolean;
      observable: Observable<
        Exclude<IMainSubjectValues<keyof IMainSubjects>, void>
      >;
    };
  }
);

export function valueToMainSubject<T extends keyof IMainSubjects>(
  type: T,
  value: IMainSubjectValues<T>
) {
  if (CONF[type].once && store[type].initialized) {
    throw new Error(`[valueToMainSubject] '${type}' already initialized`);
  }

  if (!IS_RUNTIME_PRODUCTION) {
    if (CONF[type].once) {
      cLog('valueToMainSubject', `Subject '${type}' initialized`);
    } else {
      cLog('valueToMainSubject', `Subject '${type}' next value`);
    }
  }

  store[type].initialized = true;
  CONF[type].subject.next(value as never);
}

export function fromMainSubject<T extends keyof IMainSubjects>(type: T) {
  return store[type].observable as Observable<IMainSubjectValues<T>>;
}
