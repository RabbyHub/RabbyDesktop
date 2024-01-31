
v0.36.5 / 2024-01-31
====================

  * fix: restrain permissions of dapp's preview webContents (#614)
  * style: color & shape of checkbox on EditWhitelist Modal. (#613)
  * chore: update currentVersion
  * security: avoid crash. (#611)

v0.36.4-prod / 2024-01-09
=========================

  * Release v0.36.4-prod
  * chore: use new rabbyx. (#609)
  * feat: use electron 26 still.
  * chore: update currentVersion.
  * chore: upgrade deps.
  * feat: use electron v27. (#608)
  * feat: swap prefer mev guarded (#607)

v0.36.3-prod / 2023-12-19
=========================

  * Release v0.36.3-prod
  * style tuning (#605)
  * feat: upgrade deps. (#602)
  * fix: swap setting modal (#603)
  * fix: avoid draggble area cover macos controls. (#604)
  * chore: update currentVersion.
  * fix: binance api update (#597)
  * feat:sort with gasfee (#601)
  * fix: style of approvals manage page. (#596)
  * fix: merge the token list by chain and token id  (#599)

v0.36.2-prod / 2023-12-06
=========================

  * Release v0.36.2-prod
  * build: only record changelog from special tag.
  * chore: update currentVersion.
  * fix: coboargus logo. (#595)
  * feat: upgrade deps. (#594)
  * buid: add release binary script. (#588)

v0.36.1-prod / 2023-11-23
=========================

  * Release v0.36.1-prod
  * fix: compuation for floating current account comp's width. (#593)
  * chore: update currentVersion.
  * feat: upgrade electron to v25. (#592)
  * fix: token value (#591)
  * fix: token price needs 8 decimal (#589)

v0.36.0-prod / 2023-11-09
=========================

  * Release v0.36.0-prod
  * chore: update currentVersion.
  * feat: webview based mainWindow tab (#543)
  * fix: no effect on clicking retry update (#587)
  * feat: filter scam (#585)
  * feat: upgrade chains. (#584)

v0.35.3-prod / 2023-10-26
=========================

  * Release v0.35.3-prod
  * fix: cannot open ens type dapp. (#583)
  * feat: add broadcast mode (#581)
  * style: tuning.
  * fix: connect status style
  * feat: update currentVersion.
  * fix: make sure special hardware window having white background. (#582)
  * feat: support more chains. (#579)
  * feat: support gridplus (#578)
  * feat: walletconnect v2 (#577)

v0.35.2-prod / 2023-10-12
=========================

  * Release v0.35.2-prod
  * fix: avoid some data loading issue due to `ReactDOM.render` (#573)
  * feat: only alert upgrade on lock/home for specific versions (#572)

v0.35.2-reg / 2023-10-12
========================

  * Release v0.35.2-reg
  * fix: support dapp which calls `window.etherum.request` before dom content loaded. (#571)
  * feat: try to improve perf usage on home/swap. (#555)
  * bundle nickname (#568)
  * feat: migrate twitter's logo. (#570)
  * fix: pub changelog to production. (#569)

v0.35.1-prod / 2023-09-29
=========================

  * Release v0.35.1-prod
  * feat: update currentVersion.
  * feat: remove useless popup to improve perf & memory usage. (#567)
  * feat: downgrade electron to v22 to avoid window manager issues on higher version. (#566)
  * feat: upgrade rabbyx and support more testnets. (#564)
  * fix: upgrade node-abi aversion for electron
  * fix: avoid occasional failure on disconnecting localfs type dapp. (#563)
  * feat: drop uniswap for now (#562)
  * feat: upgrade electron to >= v24.8.3 to avoid libwebp issues (#561)
  * build: update changelog on release reg/prod (#560)

v0.35.0-prod / 2023-09-27
=========================

  * Release v0.35.0-prod
  * style: tuning. (#559)
  * fix: mock switches.
  * feat: support mock download updates exceptions. (#558)
  * feat: style tuning, full state views for download updates on lock screen. (#557)
  * chore: update currentVersion.
  * style: add new color css var neutral-card-3. (#556)
  * fix: allowed protocols. (#553)
  * fix: alert cannot-use-trezor-like-if-ipfs-enabled on sign from rabbyx. (#554)
  * feat: support swap on chain base. (#552)
  * feat: upgrade rabbyx. (#551)
  * feat: robust change about security (#549)
  * feat: + audit report (#550)
  * build: fix patch package file.
  * feat: support download on lock screen. (#544)
  * fix: open external url for approved asset. (#542)
  * ci: update group. (#545)

v0.34.0-prod / 2023-09-12
=========================

  * Release v0.34.0-prod
  * chore: update currentVersion.
  * fix: style of "More" entry.
  * feat: support more chains, some ux adjust (#541)
  * fix: swap multi click (#540)
  * feat: style fix & tuning. (#539)
  * feat: move developer kits to standalone route. (#538)
  * feat: adapt to new version onekey sdk. (#537)
  * fix: refresh current account when changing the alianname in the hd manager (#536)
  * fix: rabbyx version.
  * feat: support manage password and lock app. (#535)
  * feat: add signature record (#534)

v0.33.0-prod / 2023-09-01
=========================

  * Release v0.33.0-prod
  * chore: update currentVersion.
  * feat: switch to corresponding tab on open tx modal. (#533)
  * fix: margin bottom
  * feat: support testnet (#522)
  * fix: sort quote (#532)
  * feat: update layout about settings page, add entry 'supported chains' (#527)
  * feat: some adjust. (#529)
  * feat: Bundle => My Portfolio (#526)
  * fix: force close trezor connection when close import address page (#520)
  * fix: swap typo (#519)
  * style: support Tailwind IntelliSense. (#521)

v0.32.0-prod / 2023-08-18
=========================

  * Release v0.32.0-prod
  * fix: low assets (#518)
  * fix: search (#517)
  * feat: improve ux of tokenSelector and chainSelector. (#513)
  * fix: update totalBalance cache when home page init (#516)
  * feat: add kyberswap (#514)
  * fix: token bugs (#515)
  * feat: support opbnb (#512)
  * feat: manage address、account search input (#509)
  * feat: assets (#510)
  * chore: update currentVersion.
  * chore: update patch.
  * feat: upgrade rabbyx.
  * feat: update chains (#511)
  * ci: use legacy for prerelease.
  * feat: use standalone entry of `@debank/common`. (#507)
  * feat: some fixes. (#506)
  * ci: use isolated runner for feature test. (#508)

v0.31.0-prod / 2023-07-25
=========================

  * Release v0.31.0-prod
  * feat: support approvals. (#505)
  * feat: change sync gnosis networks (#504)
  * feat: upgrade deps, update currentVersion.
  * feat: optimize curve changes (#503)

v0.30.0-prod / 2023-07-18
=========================

  * Release v0.30.0-prod
  * chore: update currentVersion.
  * chore:  swap fee intro  (#502)
  * fix: keystone qrcode modal (#500)
  * feat: support uniswap、0x; 0 fee (#501)

v0.29.1-prod / 2023-07-13
=========================

  * Release v0.29.1-prod
  * feat: update currentVersion.md
  * fix: ledger error (#499)

v0.29.0-prod / 2023-07-12
=========================

  * Release v0.29.0-prod
  * feat: make sure tip user grant permission. (#498)
  * feat: keystone (#496)
  * feat: update currentVersion.
  * chore: remove useless code about old add-address-dropdown. (#495)
  * feat: adjust some sentry logs' frequency. (#494)
  * feat: update gnosis safe (#491)
  * feat: support chain zora (#493)
  * feat: swap support 1inch (#497)
  * Fix current account checking condition (#492)

v0.28.0-prod / 2023-06-29
=========================

  * Release v0.28.0-prod
  * fix: redirect nft when switch account sendNFT (#490)
  * fix: okx icon
  * feat: gnosis safe support multiple chain (#489)
  * feat: update currentVersion.
  * feat: bundle support future for cex (#488)
  * feat: nft (#487)

v0.27.1-prod / 2023-06-21
=========================

  * Release v0.27.1-prod
  * feat: update currentVersion.md
  * fix: missing shortcuts about Edit. (#486)

v0.27.0-prod / 2023-06-20
=========================

  * Release v0.27.0-prod
  * fix: remove used patches.
  * feat: update currentVersion.md
  * feat: more shortcuts support. (#485)
  * feat: swap setting (#481)
  * feat: upgrade `@debank/common`, depreacte SWM chain. (#483)
  * fix: use display_symbol first (#484)
  * fix: paraswap preexec issue (#482)

v0.26.0-prod / 2023-06-14
=========================

  * Release v0.26.0-prod
  * fix: missing oasys on rabbyx.
  * feat: upgrade rabbyx for style.
  * fix: judgement about system version. (#480)
  * feat: upgrade rabbyx, update currentVersion.md
  * feat: upgrade sign security page.
  * style: tuning.
  * feat: support tip unsupported system on bootstrap. (#477)
  * fix: package-lock on macOS.
  * feat: support oas chain. (#479)
  * chore: text update (#478)
  * feat: okx (#475)
  * feat: Split the CEX quotes into a view. (#476)

v0.25.0-prod / 2023-06-07
=========================

  * Release v0.25.0-prod
  * fix: algorithm of extracting css from html, use top-level toast on updated dapp. (#474)
  * feat: upgrade currentVersion
  * feat: support new chain ROSE, tuning sign security.
  * chore: tuning, update currentVersion
  * fix: slippage disable (#473)
  * feat: upgrade rabbyx to enhance security on sign. (#472)
  * fix: Refactor token info fetching logic and use custom hook (#470)
  * feat: support double click to maxmize/restore window on darwin. (#471)
  * feat: check if http target url could redirect its https version. (#469)
  * feat: recover support to detect dapp's version. (#468)
  * feat: robust change for load 'usb' module, avoid potential crahs on windows 7. (#467)

v0.24.0-prod / 2023-06-01
=========================

  * Release v0.24.0-prod
  * fix: gnosis safe nonce. (#466)
  * chore: update currentVersion.md
  * fix: hid devices status fetch for ledger. (#465)
  * fix: order of safe accounts
  * fix: new version tooltip don't disappear on windows. (#464)
  * fix: avoid new version tooltip flicker. (#463)
  * fix: address modal ui (#462)
  * feat: only show dapp's new version if it differs with the version LAST opened. (#461)
  * fix: update rabbyx to fix wallectconnect on rabbyx's ui.
  * fix: select type ui (#460)
  * feat: disable zoom ratio setting item. (#459)
  * fix: use onMessage to listen message from background (#458)
  * fix: wc style (#457)
  * chore: code cleanup.
  * feat: always show tips if new version not confirmed. (#456)
  * fix: input style (#454)
  * fix: whitelist tips width (#455)
  * fix: addressItem key (#453)
  * fix: walletconnect ui (#452)
  * Add support for OpenOcean DEX (#450)
  * feat: support pulse chain, update currentVersion.md
  * feat: support detect dapp version. (#448)
  * fix: correct rabbyx version for Connect sign.
  * feat: walletconnect and new signature process (#443)
  * Refactor token amount formatting (#449)
  * feat: use new rabby sign Connect window. (#445)
  * feat: let active tab auto scroll into view. (#446)
  * feat: always show .dmg download file for macOS. (#447)
  * feat: zoom dapp view to 0.9 by default. (#444)
  * feat: display version as prod first. (#441)
  * feat: update minted badge image (#442)

v0.23.0-prod / 2023-05-23
=========================

  * Release v0.23.0-prod
  * feat: upgrade rabbyx to 0.86.1 (#440)
  * feat: update currentVersion.md
  * feat: NFT P2P Lender 、Borrower (#433)
  * feat: disable loadingView. (#436)
  * feat: use local releaseNote first. (#435)
  * feat: remove invited code (#439)
  * Add collapsible NFTPanel with badge icon (#438)
  * feat:ellipsis swap's approve button (#434)
  * typo: Explorer (#437)

v0.22.0-prod / 2023-05-16
=========================

  * Release v0.22.0-prod
  * chore: adjust.
  * fix: style fix.
  * chore: tuning. (#432)
  * feat: style tuning. (#431)
  * feat: tuning styles of settings page. (#430)
  * fix: custom rpc bugs (#428)
  * fix:comment out unused formatted fields (#429)
  * feat: better release information views on settings page. (#425)
  * Feat: summary (#426)
