import { expect } from 'chai'
import path from 'path'
import { emittedOnce } from './events-helpers'

import { useExtensionBrowser, useServer } from './hooks'

describe.only('rabby extension capabilities', () => {
  const server = useServer()
  const browser = useExtensionBrowser({
    // url: server.getUrl,
    url: () => {
      return 'https://metamask.github.io/test-dapp/'
      // return `chrome-extension://${browser.extension.id}/popup.html`
    },
    
    partitionName: 'extension-rabby',
    // extensionName: 'rpc'
    extensionName: path.resolve(__dirname, '../assets/chrome_exts/rabby'),
    // extensionName: path.resolve(process.env.RD_DEV_EXTPATH!),
    openDevTools: true,
  })

  describe('rabby extension basic', () => {
    it('loaded', async () => {
      const rabbyExt = browser.extension;
      expect(typeof rabbyExt.id).to.equal('string');
    });

    it('gets details on the window', async function () {
      this.timeout(600 * 1e3);
      const windowId = browser.window.id

      browser.window.show();
      // browser.webContents.loadURL(`chrome-extension://${browser.extension.id}/popup.html`);
      browser.webContents.loadURL(`chrome-extension://${browser.extension.id}/background.html`);

      // timeout 500s Promise
      await new Promise((resolve) => setTimeout(resolve, 500 * 1e3))
      expect(windowId).to.equal(1)
    });
  })
})
