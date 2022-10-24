type GetListenerFirstParams<T> = T extends (...args: infer A) => any
  ? A[0]
  : never;

type GetIpcRequestListenerFirstParams<T, E extends GetListenerFirstParams<T>> = T extends (evt: E, ...args: infer A) => any
  ? A[0]
  : never;
