
v0.4.7 / 2023-02-17
===================

  * feat: add new address (#117)
  * Fix: swap、 send style (#132)
  * feat: transaction (#130)
  * fix: push changes of dapp to all built-in views. (#131)
  * fix: unexpected closing window on sendToken
  * Feat/send token (#128)
  * feat: receive (#127)
  * fix: edit alias name (#124)
  * feat: add onCancelCb on switchChain (#126)
  * fix: only display bind button when hovered (#125)

v0.4.6 / 2023-02-16
===================

  * Release v0.4.6
  * style: tuning.
  * feat: greater draggable area on darwin.
  * feat: true realtime preview on add dapp. (#122)
  * feat: only allow BrowserView on tabs connect wallet by default. (#119)
  * feat: disable clipboard service, use lighter copy tips. (#120)
  * feat: improve show/hide of loading view. (#121)
  * fix: not always apply user defined proxy.
  * Feat/swap (#118)

v0.4.5 / 2023-02-15
===================

  * Release v0.4.5
  * chore: code cleanup.
  * chore: update rename_dist.sh
  * feat: use window inner copied-web-addr-tip.
  * feat: better zview state management.
  * fix: type.
  * feat: migrate z-popup as shell popup-view.
  * feat: allow update subview's state via `useZPopupViewState`
  * feat: fill missing favicon if tab got it.
  * feat: improve effect on detect-dapp and capturing page.
  * feat: recover switch-chain window temporarily. (#116)
  * feat: support callback on `zActions.showZSubview`.
  * fix: tuning style of dappViewGasket & DappReadonlyModal (#115)
  * fix: sidebar style (#113)
  * fix: add url (#114)
  * feat: normalize.
  * fix: add dapp (#111)
  * feat: support z-popup. (#110)
  * chore: cleanup workflow of proxy.
  * feat: always apply user defined proxy settings.
  * feat: upgrade rabbyx for new sign window style.
  * fix: update account list (#109)

v0.4.4 / 2023-02-10
===================

  * Release v0.4.4
  * feat: vary persisted/runtime proxy config, improve proxy stablity.
  * fix: avoid repeat opening dapp tab.
  * feat: update add dapp  (#106)
  * feat: + refresh portfolio button (#108)
  * feat: support open dapp in other views.
  * feat: init trezor & onekey (#107)
  * chore: code cleanup.

v0.4.3 / 2023-02-08
===================

  * Release v0.4.3
  * feat: allow reject sign on click gasket.
  * feat: tuning sidebar and style of toast.
  * fix: white background of modal window on macOS 13. (#103)
  * feat: history transaction display (#105)
  * feat: portfolio number display logic (#104)

v0.4.2 / 2023-02-03
===================

  * Release v0.4.2
  * build: add prerelease version update script.
  * feat: 'system' as default proxy type.
  * feat: update balance cache when portfolio balance changed (#102)
  * feat: upgrade rabbyx core version.
  * feat: gather sidebar's tabs by secondary domain. (#101)
  * feat: make select devices as modal window. (#100)
  * fix: history token not set when taskQueue is empty (#98)
  * fix: refetch data after changing addr (#99)

v0.4.1 / 2023-02-01
===================

  * Release v0.4.1
  * feat: support readonly tips modal. (#97)
  * feat: tx history time (#96)
  * feat: detect ledger (#95)
  * feat: disable all pointer-events on <img /> for built-in views. (#94)
  * chore: tuning.
  * feat: basic support to select hid devices by UI. (#93)
  * feat: optimize home page (#92)
  * fix: dapp bind (#88)
  * fix: ledger bugs && add walletconnect (#91)
  * types: normalize types module. (#90)
  * fix: disable windi-base.css to avoid its reset.
  * fix: main session's permission check handler.
  * style: little fix.
  * feat: support `useMessageForwarded`/`useForwardTo` (#89)
  * fix: quick swap style (#87)
  * build: support windicss (tailwindcss v2 compatible) (#79)
  * feat: support apis about hid devices. (#73)
  * feat: + portfolio loading (#86)

v0.4.0 / 2023-01-19
===================

  * Release v0.4.0
  * style: tuning.
  * chore: code clean.
  * fix: only display bind dapp info when hover (#84)
  * Feat/update dapps bindings (#85)
  * fix: ensure patch `window.close` in rabbyx's notification win. (#82)
  * fix: zero balance account
  * Merge remote-tracking branch 'origin/dev' into dev
  * fix: sync rabbyx's session message to popupView on mainWin.
  * Merge pull request #83 from RabbyHub/fix/overflow-scroll
  * fix: overflow
  * fix: account detail (#77)
  * feat: add home page transactions (#74)
  * Merge remote-tracking branch 'origin/dev' into dev
  * fix: robust change on migrate dapps' data
  * Feat/home page quick swap (#70)
  * fix: cannot fetch newly added dapp. (#81)
  * fix: allow ledger sign connectoin.
  * chore: update rabbyx to use new rabby-api in background.
  * fix: dapp favicon (#80)
  * fix: unbind protocol on dapp removed.
  * feat: adjust logic about protocolDappsBinding.
  * fix: error on rename dapp. (#78)
  * fix: modal (#76)
  * fix: dapps store migration.
  * fix: style.
  * feat: improve stablility on parse favicon. (#75)
  * wip: add dapp (#60)
  * feat: init hd manager (#72)
  * fix: husky (#71)
  * build: add fastlane script. (#69)
  * fix: get-app-version.
  * fix: update accounts (#68)
  * chore: avoid frequent react-refresh overlay.
  * feat: normalize dapps about invoking.
  * feat: integrate autoUpdate into settings page.
  * security: disable open linkURL/srcURL from context menu popup.
  * feat: apply styles rules on mainWindow. (#67)

v0.3.0 / 2023-01-13
===================

  * Release v0.3.0
  * style: tuning settings page.
  * feat: support set proxy server for whole app. (#66)
  * chore: add build helper script.
  * fix: small assets hidden logic (#65)
  * fix: upgrade rabbyx to avoid set headers null error on background from `@debank/rabby-api`.
  * feat: fix dapp style (#64)
  * chore: style tuning.
  * fix: home page style
  * feat: portfolio page (#57)
  * feat: init: address management (#59)
  * feat: import by private key (#63)
  * feat: support custom forwarding message from other views.
  * fix: add account (#62)
  * feat: upgrade rabbyx version with new rabby-api support
  * build: support hmr on custom protocol (#61)
  * feat: change macos-controls style (#55)
  * feat: add contacts (#58)
  * chore: prepare for more popup window.
  * feat: support exit from appTray. (#56)
  * chore: code cleanup.

v0.2.8 / 2023-01-10
===================

  * Release v0.2.8
  * chore: update tip message on reset app.
  * feat: make sure importing at least one account. (#54)
  * feat: better animation on toggle sidebar collapsed. (#52)
  * fix: avoid flashing Unlock page on launch (#53)
  * fix: pre check webpack build, and version of `@debank/common` depedent by rabby-api.
  * feat: add walletOpenapi.
  * feat: add openapi capability.
  * fix: `onMinimizeButton`.
  * feat: simplify workflow of show/hide loadingView. (#50)
  * dev 0.2.8

v0.2.7 / 2023-01-06
===================

  * Release v0.2.7
  * feat: keep sign window dock on right of main window.
  * feat: disallow resize on wallet sign
  * chore: tuning style.
  * fix: specify `rabby-internal` as standard schema to enable its storage access.

v0.2.6 / 2023-01-06
===================

  * Release v0.2.6
  * fix: redraw loadingView on sidebar collapsed.
  * feat: add animation (#48)
  * feat: better drag interaction on macos dapp topNavbar (#49)
  * chore: tuning settings page. (#47)
  * feat: change sidebar width (#45)
  * fix: allow 301 redirect from dapp.
  * feat: provide reactive winState by pushing event. (#44)
  * feat: support cssinjs. (#43)
  * chore: style tuning.
  * fix: only auto unlock after verified password.
  * fix: content's width of loadingView & safeView.
  * fix: loadingView still open on stop one loading dapp.
  * fix: always get null icon on first add dapp after launch app.
  * feat: use built-in password.
  * feat: support `chrome.notification.create` on rabby ext, toast on tx status changed. (#42)
  * feat: adjust sidebar's width on mainWindow. (#39)
  * feat: only expand search input when scroll down (#40)
  * feat: only show loading view on open/reload tab, ignore in-page loading. (#41)
  * feat: adjust hooks-shell. (#38)
  * feat: improve BrowserView resources allocation/recycle. (#37)

v0.2.5 / 2023-01-03
===================

  * Release v0.2.5
  * style: tuning switchAccount popup's width
  * feat: support setting `enableContentProtected`.
  * fix: default route on mainWindow.
  * feat: support reset-app.
  * security: enable content protection on production.
  * fix: wait rabbyx initialized.
  * feat: control header of mainWindow's page in route's loader. (#36)
  * chore: fix mainwin-mainarea-topoffset (#35)
  * feat: adjust style of Settings Page.
  * fix: sidebar nav opacity (#34)
  * fix: TopNavBar close button position (#33)
  * feat: introduce ipc invoke mechanism, apply in Settings of MainWindow.
  * feat: on win32, make rabbyx notification window locked to main window. (#32)
  * fix: style for RabbyNotificationWindow on darwin.
  * perf: optimize fps of mainWindow rendering on windows. (#31)
  * perf: hide Dapp's views on mainWindow moving.
  * chore: code robust

v0.2.4 / 2022-12-31
===================

  * Release v0.2.4
  * feat: styled rabbyx's notification window. (#30)
  * fix: only check url on redirect in spa.

v0.2.3 / 2022-12-31
===================

  * Release v0.2.3
  * fix: store the position when maxmizing mainWindow on darwin.
  * feat: for macos, set larger draggble are on top.
  * fix: little fix.
  * fix: nav to corresponding route on clicking dapp to removed.
  * fix: mismatch rabbyx version.
  * feat: allow copy dapp's url on navbar.
  * fix: nav to corresponding route on clicking duplicated dapp.
  * fix: main area top offset on dapps' page. (#29)
  * feat: auto connect dapp to wallet on add.
  * fix: make sure object refresh on `fetchConnectedSite`.
  * fix: dapps pages scroll (#28)
  * feat: better loading interaction for active tab.
  * chore: code robust.
  * chore: code cleanup.
  * fix: disable rabby wallet injection for dappSafeView.
  * chore: tuning style, and add helper types.
  * fix: avoid left loadingView for pages loading too quick.
  * fix: add timeout mechanism on `parseWebsiteFavicon`.
  * fix: fix redirect non-SPA behavior on same origin.
  * feat: fix/tuning/adjust for opening dapp. (#27)

v0.2.2 / 2022-12-27
===================

  * Release v0.2.2
  * chore: tuning size of rabbyx's notification window.
  * fix: should switch to last tab on close one tab, or switch to /my-dapps on all tabs closed.
  * chore: tuning for next release.
  * fix: make sure dapp view opened on route matched.
  * feat: for mainWindow, use ComingSoon as unimplement routes.
  * chore: improve close behavior for popup windows
  * feat: make settings area in sidebar sticky. (#26)
  * fix: accept agreenment tip (#24)
  * fix: sidebar context menu style (#23)
  * fix: TopNavBat style (#25)
  * feat: use embeded font file. (#22)
  * fix: assign details.url for loading tab webContents.

v0.2.1 / 2022-12-26
===================

  * Release v0.2.1
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
