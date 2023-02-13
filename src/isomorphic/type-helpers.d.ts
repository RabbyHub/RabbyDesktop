type GetListenerFirstParams<T> = T extends (...args: infer A) => any
  ? A[0]
  : never;

type GetIpcRequestListenerFirstParams<
  T,
  E extends GetListenerFirstParams<T>
> = T extends (evt: E, ...args: infer A) => any ? A[0] : never;

type GetListenerByEvent<T, E extends string> = T extends (
  evt: E,
  listener: infer U
) => any
  ? U
  : never;

type GetListenerEventParams<
  T,
  E extends GetListenerFirstParams<T>
> = T extends (evt: E, listener: (...args: infer A) => any) => any ? A : never;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type ExtractNS<T> = T extends `${infer NS}.${string}` ? NS : never;
type ExtractMember<T, NS extends string> = T extends `${NS}.${infer Member}`
  ? Member
  : never;

type IndexNSAndMember<T> = T extends `${infer NS}.${infer Member}`
  ? {
      [K in NS]: Member;
    }
  : never;

// type IndexNSAndMember<T> = T extends `${infer NS}.${infer Member}` ? Record<NS, Member> : never;

type ExtractPromiseValue<T> = T extends Promise<infer R> ? R : never;

type ItOrItsPromise<T> = T extends Promise<any>
  ? ExtractPromiseValue<T> | T
  : T | Promise<T>;

type AllNonFnFields<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? void : K;
}[keyof T] &
  string;

type PickAllNonFnFields<T extends Record<string, any>> = Pick<
  T,
  AllNonFnFields<T>
>;

type NullableFields<T extends object> = {
  [K in keyof T]: T[K] | null;
};

type EventTypeOfBrowserOn = [
  'page-title-updated',
  'close',
  'closed',
  'session-end',
  'unresponsive',
  'responsive',
  'blur',
  'focus',
  'show',
  'hide',
  'ready-to-show',
  'maximize',
  'unmaximize',
  'minimize',
  'restore',
  'will-resize',
  'resize',
  'resized',
  'will-move',
  'move',
  'moved',
  'enter-full-screen',
  'leave-full-screen',
  'enter-html-full-screen',
  'leave-html-full-screen',
  'always-on-top-changed',
  'app-command',
  'scroll-touch-begin',
  'scroll-touch-end',
  'scroll-touch-edge',
  'swipe',
  'rotate-gesture',
  'sheet-begin',
  'sheet-end',
  'new-window-for-tab',
  'system-context-menu'
][number];
