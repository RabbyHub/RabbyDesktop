type GetListenerFirstParams<T> = T extends (...args: infer A) => any
  ? A[0]
  : never;
