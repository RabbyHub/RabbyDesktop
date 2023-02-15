const WEB3_ADDR_FULL_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function isWeb3Addr(text: string) {
  return WEB3_ADDR_FULL_REGEX.test(text);
}
