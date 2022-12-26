
v0.2.1 / 2022-12-26
==================

  * feat: tuning style on create rabbyx's notification window.
  * fix: app crash on axios fetch failure
  * chore: change some styles (#21)
  * chore: lockfile version fix.

v0.2.0 / 2022-12-26
===================

  * Release v0.2.0
  * chore: code cleanup & normalization.
  * feat: add switch account popup.
  * fix: hide context popup after switched chain.
  * feat: switch chain context menu (#20)
  * feat: add global mask view, used for rabbyx. (#19)
  * chore: robust change.
  * fix: app crash on close some windows.
  * feat: tuning style of dapp view's navigation bar.
  * feat: hide switch-chain popup window on click outside its trigger-button.
  * style: tuning style of dapp view's navbar.
  * fix: use REAL background runtime of rabbyx, add `useShellWallet` as backup capability.
  * chore: inspection helpers change.
  * feat: add hooks about current connection.
  * feat: add quick entry to inspect SwitchChainWindow
  * feat: add `SwitchChainWindow`.
  * feat: add dapp's view nav bar (#18)
  * feat: add new type `IContextMenuPageInfo`
  * fix: `useConnectedSite`.
  * chore: move `useRabbyx.ts`
  * feat: add `useCurrentAccount`
  * feat: add `useDappNavigation`, adjust location of `useConnectedSite`.
  * fix: get started (#17)
  * fix: dapps context menu style
  * feat: edit alias name (#15)
  * feat: leave space enough for dapp's navigation view.
  * chore: cleanup code about hooks-shell
  * feat: adjust app's frame size const
  * feat: simplify dapp get in context-menu window, improve dapps management. (#16)
  * chore: type clean.
  * feat: init import pages (#13)
  * wip: dapps (#12)
  * chore: remove scripts/install_rabby.sh
  * feat: add titlebar for mainWindow. (#14)
  * feat: add rabbyx methods about alias name.
  * feat: add rabbyx background entry on context menu.
  * feat: remove entry getting-started
  * feat: support dapp pin/unpin
  * feat: use packed rabbyx rather than development
  * feat: add method on walletController
  * feat: add necessary utils for context-menu on sidebar.
  * feat: support context menu popup.
  * feat: communicate to with latest rabbyx.
  * feat: basic scaffold for next layout. (#11)
  * chore: update README
  * fix: build for renderer.dev.dll
  * feat: merge webpack config for client bundles.
  * feat: tuning locked window style.
  * feat: use static dappLoadingView.
  * feat: code normalization.
  * feat: basic scaffold of desktop wallet with rabbyx (#10)

v0.1.8 / 2022-11-07
===================

  * Release v0.1.8
  * feat: stability of security popup on address bar.

v0.1.7 / 2022-11-06
===================

  * Release v0.1.7
  * chore: lint fix.
  * feat: hide view in SecurityCheck UI on first render for security check for safety.
  * feat: tuning style for security check
  * chore: lint fix.
  * fix: format seconds on security check work flow
  * feat: tuning style.
  * fix: style for dapp address bar

v0.1.6 / 2022-11-02
===================

  * Release v0.1.6
  * feat: style fix.
  * fix: allow cut hotkey on darwin.
  * feat: better dapp safe view, replace webview tag with BrowserView.
  * feat: normalize management for dappAlert.
  * fix: on win32, fix invisible security notification, and never pull it top if main window minimized

v0.1.5 / 2022-11-01
===================

  * Release v0.1.5
  * feat: support debug menu for reg build.
  * fix: robust change about window.__rD.detectConnect
  * feat: upgrade embeded rabby extension to 0.54.0
  * feat: only popup security-addressbar-popup on security-check closed.
  * chore: add util
  * feat: tuning style of security addressbar popup.
  * feat: upgrade embeded rabby extension to 0.53.0
  * fix: behavior on click non-mainwindow's close button

v0.1.4 / 2022-10-28
===================

  * Release v0.1.4
  * feat: memory last position of main window.
  * chore: style tuning.
  * fix: don't move hidden main window top on coping sensitive information.
  * feat: tuning security check view, add close button for danger status.
  * feat: eslint fix.
  * feat: add security tips on dapps home.
  * fix: only hide window on clicking traffic close button on darwin.

v0.1.3 / 2022-10-25
===================

  * Release v0.1.3
  * fix: recover common shortcuts on macos.
  * chore: tuning for security addressbar popup
  * chore: robust change for sub windows
  * feat: allow ipcMain use infinite listeners.
  * feat: tuning.

v0.1.2 / 2022-10-25
===================

  * Release v0.1.2
  * chore: code clean.
  * feat: display timeout message on security check.
  * fix: no trigger check if start checking dapp last open.
  * fix: set dapp check results ttl as 1 day.
  * chore: code robust change.
  * feat: integrate `dappSecurityCheckResult` to response of `webui-ext-navinfo`
  * feat: never reload dapp's page on clicking from dapps home.
  * feat: tuning dapps home page.
  * feat: support security check/notification/addressbarPopup (#9)
  * chore: code clean.
  * chore: code clean.
  * fix: `chrome.tabs.query` behavior on getting current window
  * feat: robust change about dapp detection.
  * chore: upgrade electron-chrome-extensions
  * fix: dapp favicon first load (#8)

v0.1.1 / 2022-09-30
===================

  * Release v0.1.1
  * feat: restrain exposed apis for different webviews. (#7)
  * feat: add rabby connect ts (#6)
  * fix: use Template image for macos's menubar icon
  * vendor: upgrade rabby wallet extension
  * chore: typo

v0.1.0 / 2022-09-27
===================

  * feat: connected status
  * feat: package for <PLATFORM>-reg by default
  * feat: finish install downloaded release
  * feat: release note
  * fix: send did-finish-load event
  * Merge branch 'dev' of github.com:RabbyHub/RabbyDesktop into dev
  * feat: auto update
  * feat: vary tray icon by theme on macos
  * fix: use platform-specific auto updater.
  * fix: don't open another for opened same origin tab.
  * feat: basic support for limited open handler from dapp.
  * fix: judgement for current url on open url.
  * feat: refactor, use reactivex style bootstrap.
  * chore: rename.
  * feat: basic support for updator capability (#3)
  * chore: fix style
  * Merge branch 'dev' of github.com:RabbyHub/RabbyDesktop into dev
  * feat: add loading view
  * chore: menu template.
  * feat: update production name.
  * feat: set tray icon on win32.
  * feat: upgrade rabby ext version.
  * fix: home tab couldn't close.
  * build: update release windows script
  * fix: browser window minimal size.
  * feat: data corce.
  * feat: forbid resize on welcome page.
  * fix: allow click to redirect main window.
  * fix: build error due to parse-favicon
  * feat: specify nsis artifact name
  * fix: build of main due to lack of `canvas` quried by jsdom
  * chore: rename.
  * feat: add timeout mechanism on detecting dapp
  * fix: return on url check failed.
  * fix: join faviconUrl
  * feat: replace to internal version `@debank/parse-favicon`
  * chore: use rxjs on app initialization.
  * Merge branch 'dev' of github.com:RabbyHub/RabbyDesktop into dev
  * feat: detect dapp url
  * chore: normalize all calls to `ipcMain.on`
  * feat: dx improvement.
  * feat: robust change about parse favicon.
  * tuning.
  * fix: delete-dapp process
  * fix: show error message from checkUrl
  * fix: fixup faviconUrl build.
  * merge remote and resolve conflict.
  * feat(dapps): basic capability to detect dapps.
  * chore: change welcome page
  * feat: add AutoUpdate component
  * chore: change backgroud
  * feat: change dapp page style
  * chore: rename hooks about dapps manager
  * Merge branch 'dev' of github.com:RabbyHub/RabbyDesktop into dev
  * chore: entry rename
  * feat: typed `ipcMain.on`
  * feat: add get start page
  * feat: make dapp always keep in its own tab. (#2)
  * Merge branch 'dev' of github.com:RabbyHub/RabbyDesktop into dev
  * feat: basic layout for getting-started page.
  * feat: add splash screen on production
  * chore: change dapps style
  * feat: support release macos
  * fix: style fix on homepage.
  * feat: update deps to enable fullscreen capability.
  * feat: update home page's style.
  * feat: update menu icon on darwin.
  * feat: disable edit url in address bar.
  * fix: disable devTools on production.
  * chore: robust change about tabs
  * feat: disable close on homepage
  * feat: replace icons on darwin.
  * build: disable type check when development on darwin, fix other webpack error.
  * fix: renderer.dev.dll build
  * feat: support release windows package.
  * feat: allow resize.
  * feat: disable devtools and its entry on production
  * fix: fuck less.
  * fix: lack of @svgr/webpack for renderer prod build.
  * feat: always use static path to rabby wallet to keep extension's data.
  * fix: upgrade `@rabby-wallet/electron-chrome-extensions` to support open relative url from extension.
  * chore: do lint fix
  * feat: support rename/delete dapps.
  * fix: build config.
  * feat: basic capbility to add dapp.
  * chore: use rabby 0.46.0, update README
  * feat: basic scaffold for desktop. (#1)
  * Initial commit
