import { useShellWallet } from '@/renderer/hooks-shell/useShellWallet';

/**
 * @description make sure use this hooks only once at top-level component in whole page-level app
 *
 * `useShellWallet` is a custom hook that returns a `walletController` object, which made by
 * `makeShellWallet`. See src/renderer/utils-shell/shell-wallet.ts to get details. In process
 * of `makeShellWallet`, we register listener for all events broadcast from rabbyx's background,
 * which would be handled by `eventBus`.
 *
 * So if you need to subscribe to events in React Component, you should wrap your component with
 * `ShellWalletProvider`, then you can subscribe to events by `eventBus.addEventListener(..., handler)`,
 * remember dipose it by `eventBus.removeEventListener(..., handler)`.
 *
 */
export function ShellWalletProvider({
  children,
  alwaysRender = false,
}: {
  children: React.ReactNode;
  alwaysRender?: boolean;
}) {
  const walletController = useShellWallet();

  if (!alwaysRender && !walletController) return null;

  return <>{children}</>;
}
