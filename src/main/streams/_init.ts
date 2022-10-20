import { BrowserView } from 'electron';
import { Subject, ReplaySubject, Observable } from 'rxjs';
import TabbedBrowserWindow from '../browser/browsers';
import { cLog } from '../utils/log';

type IConf<T extends Subject<any>> = {
  subject: T;
  once?: boolean;
}
const CONF = {
  userAppReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<void>>,
  sessionReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<void>>,
  webuiExtensionReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<Electron.Extension>>,
  rabbyExtension: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<Electron.Extension>>,
  mainWindowReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<TabbedBrowserWindow>>,
  mainPopupGhostViewReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<BrowserView>>,
  securityNotificationsViewReady: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<BrowserView>>,
}

type IMainSubjects = typeof CONF;
type IMainSubjectValues<K extends keyof IMainSubjects> =
  IMainSubjects[K]['subject'] extends ReplaySubject<infer V> ? V
  : IMainSubjects[K]['subject'] extends Subject<infer V> ? V
  : never;

const store = (Object.keys(CONF) as (keyof IMainSubjects)[]).reduce((acc, type) => {
  acc[type] = {
    initialized: false,
    observable: CONF[type].subject.asObservable() as Observable<Exclude<IMainSubjectValues<typeof type>, void>>,
  }

  return acc;
}, {} as {
  [K in keyof IMainSubjects]: {
    initialized: boolean;
    observable: Observable<Exclude<IMainSubjectValues<keyof IMainSubjects>, void>>;
  }
});

export function valueToMainSubject<T extends keyof IMainSubjects> (type: T, value: IMainSubjectValues<T>) {
  if (CONF[type].once && store[type].initialized) {
    throw new Error(`[valueToMainSubject] '${type}' already initialized`);
  }

  cLog('valueToMainSubject', `Subject '${type}' initialized`);

  store[type].initialized = true;
  CONF[type].subject.next(value as never);
}

export function fromMainSubject<T extends keyof IMainSubjects> (type: T) {
  return store[type].observable as Observable<IMainSubjectValues<T>>;
}
