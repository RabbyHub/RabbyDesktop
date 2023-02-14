import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import type { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { BrowserView, BrowserWindow, Session } from 'electron';
import { Subject, ReplaySubject, Observable } from 'rxjs';
import TabbedBrowserWindow from '../browser/browsers';
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
  } as IConf<
    ReplaySubject<{
      mainSession: Session;
      dappSafeViewSession: Session;
      checkingViewSession: Session;
      checkingProxySession: Session;
    }>
  >,
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
  } as IConf<ReplaySubject<TabbedBrowserWindow>>,
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
  securityNotificationsWindowReady: {
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
      switchChain: BrowserWindow;
    }>
  >,
  popupViewsOnMainwinReady: {
    subject: new ReplaySubject(1),
    once: true,
  } as IConf<
    ReplaySubject<{
      addAddress: BrowserView;
      addressManagement: BrowserView;
      dappsManagement: BrowserView;
      selectDevices: BrowserView;
      zPopup: BrowserView;
    }>
  >,

  appRuntimeProxyConf: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<IAppProxyConf>>,
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
    cLog('valueToMainSubject', `Subject '${type}' initialized`);
  }

  store[type].initialized = true;
  CONF[type].subject.next(value as never);
}

export function fromMainSubject<T extends keyof IMainSubjects>(type: T) {
  return store[type].observable as Observable<IMainSubjectValues<T>>;
}
