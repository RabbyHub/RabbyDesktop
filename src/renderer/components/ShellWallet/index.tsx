import { useShellWallet } from '@/renderer/hooks-shell/useShellWallet';

export function ShellWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const walletController = useShellWallet();

  if (!walletController) return null;

  return <>{children}</>;
}
