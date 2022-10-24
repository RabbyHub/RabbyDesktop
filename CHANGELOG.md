
v0.1.2 / 2022-10-25
==================

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
