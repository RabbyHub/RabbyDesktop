import { Subject, ReplaySubject, Observable } from 'rxjs';
import { cLog } from '../utils/log';

type IConf<T extends Subject<any>> = {
  subject: T;
  once?: boolean;
}
const CONF = {
  webuiExtension: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<Electron.Extension>>,
  rabbyExtension: {
    subject: new ReplaySubject(1),
  } as IConf<ReplaySubject<Electron.Extension>>,
}

type IMainSubjects = typeof CONF;
type IMainSubjectValues = {
  [K in keyof IMainSubjects]:
    IMainSubjects[K]['subject'] extends Subject<infer V> ? V
    : IMainSubjects[K]['subject'] extends ReplaySubject<infer V> ? V
    : never;
};

const store = (Object.keys(CONF) as (keyof IMainSubjects)[]).reduce((acc, type) => {
  acc[type] = {
    initialized: false,
    observable: CONF[type].subject.asObservable(),
  }

  return acc;
}, {} as {
  [K in keyof IMainSubjects]: {
    initialized: boolean;
    observable: Observable<IMainSubjectValues[keyof IMainSubjects]>;
  }
});

export function valueToMainSubject<T extends keyof IMainSubjects> (type: T, value: IMainSubjectValues[T]) {
  if (CONF[type].once && store[type].initialized) {
    throw new Error(`[valueToMainSubject] '${type}' already initialized`);
  }

  cLog('valueToMainSubject', `Subject '${type}' initialized`);

  store[type].initialized = true;
  CONF[type].subject.next(value);
}

export function fromMainSubject<T extends keyof IMainSubjects> (type: T) {
  return store[type].observable;
}
