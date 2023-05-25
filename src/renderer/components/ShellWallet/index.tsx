import { useShellWallet } from '@/renderer/hooks-shell/useShellWallet';

/**
 * @description make sure use this hooks only once at top-level component in whole app
 *
 * `useShellWallet` is a custom hook that returns a `walletController` object, which made by
 * `makeShellWallet`. all events broadcast from rabbyx's backend will be handled by `walletController`.
 * So if you need to subscribe to events, you should wrap your component with `ShellWalletProvider`, then
 * you can subscribe to events by `walletController.addEventListener(..., handler)`.
 *
 */
export function ShellWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const walletController = useShellWallet();

  if (!walletController) return null;

  return <>{children}</>;
}
