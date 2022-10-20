import { app, clipboard } from "electron";
import { interval, Subscription } from "rxjs";
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import { attachClipboardSecurityNotificationView } from "./securityNotification";

const clipboardText$ = interval(300).pipe(
  map(() => clipboard.readText('clipboard'))
);

const clipboardChanged$ = clipboardText$.pipe(
  distinctUntilChanged((prev, cur) => prev === cur)
);

const WEB3_ADDR_REGEX = /(0x[a-fA-F0-9]{40})/;
// checkout one web3 ens address
const clipboardTextWithWeb3Addrs$ = clipboardChanged$.pipe(
  filter((text) => {
    return !WEB3_ADDR_FULL_REGEX.test(text) && WEB3_ADDR_REGEX.test(text);
  }),
  map(text => {
    return {
      fullText: text,
      web3Addr: text.match(WEB3_ADDR_REGEX)![0]
    }
  })
)

const WEB3_ADDR_FULL_REGEX = /^0x[a-fA-F0-9]{40}$/;
const clipboardFullWeb3Addrs$ = clipboardChanged$.pipe(
  filter((text) => {
    return WEB3_ADDR_FULL_REGEX.test(text.trim());
  })
)

let subs: Subscription[] = []

subs = subs.concat(
  clipboardChanged$.subscribe(async (text) => {
    // cLog('[feat] latestValue is', text);
  }),

  // clipboardTextWithWeb3Addrs$.subscribe(async ({ fullText, web3Addr }) => {
  //   cLog('[feat] with web3Addr is', web3Addr);
  // }),

  clipboardFullWeb3Addrs$.subscribe(async (web3Addr) => {
    // cLog('[feat] full web3Addr is', web3Addr);

    attachClipboardSecurityNotificationView(web3Addr);
  }),
);

app.on('will-quit', () => {
  subs.forEach(sub => sub.unsubscribe());
});
