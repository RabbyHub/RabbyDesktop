import { nativeImage } from 'electron';
import html2canvas from 'html2canvas';
import { ipcRendererObj } from './base';

export async function setupScreenCapture(
  screenshotTarget: HTMLElement = document.body
) {
  const canvas = await html2canvas(screenshotTarget);

  return canvas.toDataURL('image/png');
}

if (
  ['http:', 'https:'].some((proto) => {
    return window.location.href.startsWith(proto);
  })
) {
  ipcRendererObj.on('__internal_rpc:rabbyx:get-dapp-screenshot', (payload) => {
    setupScreenCapture().then((imageDataURL) => {
      ipcRendererObj.sendMessage('__internal_rpc:rabbyx:get-dapp-screenshot', {
        type: 'captured',
        reqid: payload.reqid,
        image: nativeImage.createFromDataURL(imageDataURL),
      });
    });
  });
}
