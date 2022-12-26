import type { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { BrowserView, BrowserWindow } from 'electron';
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
  } as IConf<ReplaySubject<void>>,
  sessionReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<void>>,
  electronChromeExtensionsReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<ElectronChromeExtensions>>,

  webuiExtensionReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<Electron.Extension>>,
  rabbyExtensionReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<Electron.Extension>>,
  rabbyExtViews: {
    subject: new ReplaySubject(1),
  } as IConf<
    ReplaySubject<{
      panelView: null;
      backgroundWebContents: Electron.WebContents;
    }>
  >,

  mainWindowReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<TabbedBrowserWindow>>,
  dappLoadingView: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<BrowserView>>,
  dappSafeModeViews: {
    subject: new ReplaySubject(1),
  } as IConf<
    ReplaySubject<{
      baseView: BrowserView;
      safeView: BrowserView;
    }>
  >,
  securityCheckPopupWindowReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<BrowserWindow>>,
  securityNotificationsWindowReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<BrowserWindow>>,
  securityAddressbarPopup: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<BrowserWindow>>,

  contextMenuPopupWindowReady: {
    subject: new ReplaySubject(1),
  } as IConf<
    ReplaySubject<{
      sidebar: BrowserWindow;
      switchChain: BrowserWindow;
    }>
  >,
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

  cLog('valueToMainSubject', `Subject '${type}' initialized`);

  store[type].initialized = true;
  CONF[type].subject.next(value as never);
}

export function fromMainSubject<T extends keyof IMainSubjects>(type: T) {
  return store[type].observable as Observable<IMainSubjectValues<T>>;
}
