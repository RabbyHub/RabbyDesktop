type GetListenerFirstParams<T> = T extends (...args: infer A) => any
  ? A[0]
  : never;

type GetIpcRequestListenerFirstParams<
  T,
  E extends GetListenerFirstParams<T>
> = T extends (evt: E, ...args: infer A) => any ? A[0] : never;

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
