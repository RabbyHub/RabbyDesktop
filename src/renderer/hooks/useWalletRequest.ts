import { useRef, useEffect, useState } from 'react';

export const useWalletRequest = <TReqArgs extends any[] = any[], TRet = any>(
  requestFn: (...args: TReqArgs) => TRet | Promise<TRet>,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?(ret: TRet, opts: { args: TReqArgs }): void;
    onError?(arg: Error): void;
  }
) => {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);
  const [loading, setLoading] = useState<boolean>(false);
  const [res, setRes] = useState<any>();
  const [err, setErr] = useState<any>();

  const run = async (...args: TReqArgs) => {
    setLoading(true);
    try {
      const result = await Promise.resolve(requestFn(...args));
      if (!mounted.current) {
        return;
      }
      setRes(result);
      onSuccess?.(result, { args });
    } catch (e: any) {
      if (!mounted.current) {
        return;
      }
      setErr(e);
      onError?.(e);
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  return [run, loading, res, err] as const;
};
