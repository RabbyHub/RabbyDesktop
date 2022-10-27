import { app, clipboard } from 'electron';
import { interval, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, pairwise } from 'rxjs/operators';
import { cLog } from '../utils/log';

import { openSecurityNotificationView } from './securityNotification';

const trimedClipboardText$ = interval(300).pipe(
  map(() => ({
    text: clipboard.readText('clipboard').trim(),
    time: Date.now(),
  }))
);

const clipboardChanged$ = trimedClipboardText$.pipe(
  distinctUntilChanged((prev, cur) => prev.text === cur.text)
);

// const WEB3_ADDR_REGEX = /(0x[a-fA-F0-9]{40})/;

const WEB3_ADDR_FULL_REGEX = /^0x[a-fA-F0-9]{40}$/;
const inContinuousWeb3Addrs$ = clipboardChanged$.pipe(
  pairwise(),
  filter(([prev, cur]) => {
    const prevIsWeb3Addr = WEB3_ADDR_FULL_REGEX.test(prev.text);
    const curIsWeb3Addr = WEB3_ADDR_FULL_REGEX.test(cur.text);
    // return !!(prevIsWeb3Addr ^ curIsWeb3Addr)

    return !prevIsWeb3Addr && curIsWeb3Addr;
  })
);
const continuousWeb3Addrs$ = clipboardChanged$.pipe(
  pairwise(),
  filter(([prev, cur]) => {
    return (
      WEB3_ADDR_FULL_REGEX.test(prev.text) &&
      WEB3_ADDR_FULL_REGEX.test(cur.text)
    );
  })
);

let subs: Subscription[] = [];

subs = subs.concat(
  clipboardChanged$.subscribe(async (ref) => {
    // cLog('[feat] latestValue is', ref);
  }),
  inContinuousWeb3Addrs$.subscribe(async ([, cur]) => {
    openSecurityNotificationView({
      type: 'full-web3-addr',
      web3Addr: cur.text,
    });
  }),
  continuousWeb3Addrs$.subscribe(async ([prev, cur]) => {
    openSecurityNotificationView({
      type:
        cur.time - prev.time >= 1e3
          ? 'full-web3-addr-changed'
          : 'full-web3-addr-quick-changed',
      prevAddr: prev.text,
      curAddr: cur.text,
    });
  })
);

app.on('will-quit', () => {
  subs.forEach((sub) => sub.unsubscribe());
});
