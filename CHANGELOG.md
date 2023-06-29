
v0.28.0 / 2023-06-29
====================

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

v0.21.0-reg / 2023-05-12
========================

  * Release v0.21.0-prod
  * chore: sync data.
  * feat: support meter chain and etc chain (#422)
  * feat: upgrade rabbyx to 0.85.0
  * fix: paraswap quote (#421)
  * feat: allow send 0 token (#423)
  * fix: dapps sort splash (#424)
  * fix: make sure create mainWindow AFTER rabby background ready. (#420)
  * feat: avoid repeative app instances. (#419)

v0.20.1-prod / 2023-05-09
=========================

  * Release v0.20.1-prod
  * Revert "feat: improve redirect between `welcome/getting-started` and `mainwin/*` (#414)"

v0.20.0-prod / 2023-05-09
=========================

  * Release v0.20.0-prod
  * fix: allow customize reload-behavior on switching to active tab. (#418)
  * fix: dont redirect back to home if only switch account. (#417)
  * feat: reset amount after submitting tx (#416)
  * feat: improve redirect between `welcome/getting-started` and `mainwin/*` (#414)
  * fix: scrollbar color (#412)
  * fix: font-face 'SF Pro' on prod. (#415)
  * feat: home page history list add  scam tx tag (#413)

v0.19.0-prod / 2023-05-06
=========================

  * Release v0.19.0-prod
  * feat(TxToast): adjust progress bar height and assets update interval (#411)
  * feat(TxToast): adjust timeout;updaet origin state (#410)
  * feat: tx toast (#406)
  * feat: support safe on op, arb, aurora (#401)
  * fix: scrollbar (#408)
  * feat: update balance after transaction success (#409)
  * feat: hide mainWindow on click its close button, rather than quit app. (#403)
  * feat: forward unsupported protocol to system. (#399)
  * feat: support wemix chain (#400)
  * feat: mock installation progress when updating on macOS. (#402)
  * fix: refresh balance loading icon (#407)
  * Revert "feat: tx toast (#404)" (#405)
  * feat: tx toast (#404)
  * fix: keep mainWindow refed by electronChromeExtension as all tabs closed. (#396)

v0.18.0-prod / 2023-04-28
=========================

  * Release v0.18.0-prod
  * swap fix (#398)
  * feat: dapp search & refresh all balance & scam & go home (#392)
  * feat: swap change (#394)
  * feat: report mainWindow's event listeners count. (#395)
  * feat: support simulate browser by UA for some specific dapps. (#393)
  * chore: cleanup deps.
  * feat: upgrade rabbyx to 0.81.0 (#391)
  * feat: support flare chain (#390)
  * fix: home page assets refresh (#389)

v0.17.2-prod / 2023-04-26
=========================

  * Release v0.17.2-prod
  * feat: report on dapp's faviconURL will be updated, cleanup `faviconBase64` if faviconURL updated.
  * feat: rm on in chainlist (#388)
  * fix: we should't let  mousevents forward on windows. (#387)

v0.17.1-prod / 2023-04-25
=========================

  * Release v0.17.1-prod
  * style: tuning.
  * fix: resume modal transition (#386)
  * fix (#385)
  * fix: if local type dapp existed, pinnedList/unpinnedList can not be resorted. (#384)
  * feat: control modal's open (#381)
  * feat: report its memory info on mainWindow's webview crashed. (#383)
  * feat: support tooltip on ghost window, which could be over Dapp View. (#382)

v0.17.0-prod / 2023-04-22
=========================

  * Release v0.17.0-prod
  * chore: literals change.
  * chore: update data.
  * feat: copy tips (#370)
  * feat: support core chain (#378)
  * feat: upgrade rabbyx to 0.80.0 (#380)
  * feat: adjust UI/literals about dapp support. (#379)
  * feat: ens (#374)
  * feat: Protocol support token modal (#377)
  * feat: support eos evm (#373)
  * feat: increase the max listeners of ipcRenderer to avoid the memory leak in renderer process. (#376)

v0.16.0-prod / 2023-04-18
=========================

  * Release v0.16.0-prod
  * Revert "feat: support eos evm (#371)" (#372)
  * chore: upgrade rabbyx core to v0.79.1
  * feat: add TokenActionModal (#369)
  * feat: support eos evm (#371)
  * fix: improve memory & perf. (#367)
  * fix: update eth alias (#366)
  * fix: eth balance (#368)

v0.15.0-prod / 2023-04-15
=========================

  * Release v0.15.0-prod
  * fix: bundle balance (#364)
  * fix: bignumber (#363)
  * feat: use overlay for assets/protocol view. (#365)
  * fix: copy addr font size (#362)
  * chore: code cleanup.
  * feat: theme color (#349)
  * feat: bundle (#340)
  * fix: fix app name in ua, keep `Electron` flag in webContents's frame. (#360)
  * fix: sort chain (#359)
  * fix: tips about conflict between trezor/onekey (#358)
  * fix: dapp display not update after IPFS dapp deleted (#357)

v0.14.0-prod / 2023-04-12
=========================

  * Release v0.14.0-prod
  * feat: revert revert ipfs (#352)
  * feat: add crash reporter in main process. (#356)
  * fix: dapp binding status will reset (#355)
  * fix(swap): disable submit (#354)
  * chore: RabbyX-v0.78.1-839d419 (#353)
  * feat: swap (#351)
  * feat: disconnect (#350)

v0.13.1-prod / 2023-04-08
=========================

  * Release v0.13.1-prod
  * feat: revert ipfs (#348)
  * Merge remote-tracking branch 'origin/publish/prod' into dev
  * fix: not display change for unsupport chain (#341)
  * Merge remote-tracking branch 'origin/publish/prod' into dev
  * fix: transaction top margin

v0.13.0-prod / 2023-04-08
=========================

  * Release v0.13.0-prod
  * chore: little fix.
  * fix: modal
  * fix: swap route (#346)
  * fix: kw search (#345)
  * fix: hide sidebar-dapp context-menu scroller. (#344)
  * feat: new sidebar (#342)
  * feat: use rabbyx 0.78.x (#343)
  * feat: ipfs (#322)
  * feat: swap base (#339)

v0.12.0-prod / 2023-04-04
=========================

  * Release v0.12.0-prod
  * Merge remote-tracking branch 'origin/dev' into publish/prod
  * feat: slice git commit hash on prod.
  * feat: show revision info in settings page on non-prod channel.
  * feat: change transactions modal style (#335)
  * feat: slice git commit hash on prod.
  * feat: show revision info in settings page on non-prod channel.
  * fix: transaction height (#338)
  * fix: default token symbol ellipsis
  * feat: change transactions modal style (#335)
  * fix: default token symbol ellipsis
  * feat: support zksync erc (#333)
  * fix: allow server side 302 redirect to matched dapp tab. (#331)
  * fix: increase concurrency (#332)
  * Merge remote-tracking branch 'origin/dev' into publish/prod
  * ci: auto determine  which channel to be released when tagged ref triggered.
  * Revert "feat: new swap (#325)" (#326)
  * feat: new swap (#325)

v0.11.0 / 2023-03-31
====================

  * Release v0.11.0
  * feat: revert support for coexist of main-domain dapp and its sub-domain dapp. (#328)
  * chore: upgrade rabbyx core to 0.76.0

v0.11.1-reg / 2023-04-01
========================

  * Release v0.11.1-reg
  * ci: auto determine  which channel to be released when tagged ref triggered.
  * Release v0.11.0
  * feat: revert support for coexist of main-domain dapp and its sub-domain dapp. (#328)
  * chore: upgrade rabbyx core to 0.76.0
  * feat: integrate swap to reg version. (#329)
  * Revert "feat: new swap (#325)" (#326)
  * feat: new swap (#325)
  * feat: support polygon zkevm
  * fix: wrap special logic in closure to avoid conflict.
  * feat: update dapp's faviconURL on open its tab. (#324)
  * fix: mistake changes on commit f339d88.
  * feat: tuning behavior of window controls(traffic). (#323)

v0.10.2 / 2023-03-29
====================

  * Release v0.10.2
  * feat: upgrade rabbyx for security on send message to desktop.
  * fix: userData path on dev. (#321)
  * feat: remove relaction modal (#316)
  * reimpl in-dapp-find with BrowserView (#320)

v0.10.1 / 2023-03-29
====================

  * Release v0.10.1
  * feat: robust change on `useAccounts`.
  * fix(swap): useVerifySdk dexId (#319)

v0.10.0 / 2023-03-28
====================

  * Release v0.10.0
  * feat: support Enter/Return as findForward. (#318)
  * chore: fix typo (#317)
  * feat: add clearPendingTransactions event (#311)
  * chore: disable devTools of inDappFind.
  * feat: basic support for find content in dapp (#314)
  * fix: swap wraptoken (#315)
  * fix: avoid flashing or leave-in getting-started screen as account existed after mainWindow show. (#313)
  * build: show triggers on notifying. (#312)

v0.9.0 / 2023-03-25
===================

  * Release v0.9.0
  * feat: integrate safe (#305)
  * fix: update at
  * fix: style
  * fix: token list th padding
  * feat: allow greater double-click-maximize area on macOS. (#310)
  * feat: update home page style (#307)
  * feat: update transactions and support clear pending txs (#306)
  * feat: enable verify update code sign on windows. (#308)
  * feat: swap pre exec tx (#303)
  * feat: support `window.prompt`. (#301)
  * feat: hide small assets 0.1% (#302)
  * feat: remove fetch faviconBase64 (#300)
  * feat: make sure `Electron` string trimed on request from webContents. (#299)

v0.8.0 / 2023-03-21
===================

  * Release v0.8.0
  * chore: change add dapp ui (#298)
  * fix: number
  * feat: disable repair favicons on bootstrap.
  * fix: tweet (#297)
  * feat: mark mainWindow's tab with dapp id. (#294)
  * feat: mint rabby (#282)
  * feat: add tabs to add dapp modal (#296)
  * fix: include shortcut icon into favicons (#293)

v0.7.0 / 2023-03-17
===================

  * Release v0.7.0
  * feat: filter invalid base64.
  * feat: revert relaction domain (#292)
  * fix: some bad behaviors on open/select dapp (#291)
  * chore: change release note button text (#290)
  * feat: release note (#288)
  * feat: upgrade rabbyx's core to 0.72.0
  * feat: change swap fee to 0.01% (#289)
  * feat: add event log (#284)
  * Feat/report tracing (#287)
  * feat: selected by default when there is only one ledger (#281)
  * feat: optmize dapp load (#286)
  * feat: support nft portfolio (#285)
  * feat: always open tx's explorer url externally. (#283)
  * fix: use the largest favicon (#280)

v0.6.1 / 2023-03-15
===================

  * Release v0.6.1
  * feat: re-open last opened url of dapp. (#279)
  * feat: update top navbar style. (#276)
  * fix: DappReadonlyModal (#277)
  * feat: use proxy for app updator. (#270)
  * chore: change welcome slogan (#278)
  * feat: disable dialogs for invisible browserView. (#275)

v0.6.0 / 2023-03-14
===================

  * Release v0.6.0
  * feat: update chain when chain changed by dapp (#274)
  * feat: update sentry configuration. (#273)
  * fix: favicon placeholder (#272)
  * feat: repair missing favicon base64 on bootstrap. (#271)
  * feat: tuning logic about reposing mainWindow. (#269)
  * fix: favicon (#267)
  * fix: add dapp modal button (#263)
  * feat: simplify state/workflow of dapp loading view. (#266)
  * fix: transaction page overflow style (#268)
  * feat: update currentSite after session created (#265)
  * feat: always open scanLink externally. (#261)
  * feat: support special subdomain & remove relaction dialog (#262)
  * feat: update rabbyX (#264)
  * fix: home view height (#260)

v0.5.8 / 2023-03-11
===================

  * Release v0.5.8
  * chore: update trezror (#259)
  * ci: accept env `buildchannel` from github actions vars.
  * fix: prerelease script.
  * fix: hd styles (#256)
  * ci: support windows on actions. (#255)
  * build: support build on github actions. (#254)
  * fix: skeleton style (#251)
  * feat: remove address management view (#252)
  * fix: debt calc (#253)

v0.5.7 / 2023-03-08
===================

  * Release v0.5.7
  * fix: cannot open its App on uniswap.org & www.paraswap.io (#250)
  * feat: support force update. (#249)
  * type: some type fix.
  * fix: extra action back to seondaryDomain on its sub domain tab open. (#248)
  * chore: don't report to sentry in mainprocess on dev.
  * feat: support sign windows with production certificate. (#247)

v0.5.6 / 2023-03-07
===================

  * Release v0.5.6
  * fix:chain select (#246)

v0.5.5 / 2023-03-07
===================

  * Release v0.5.5
  * fix: rightBar margin (#245)
  * feat: update splash.
  * fix: download (#244)
  * fix: fix ref to `@sentry/electron` on build. (#243)
  * feat: introduce sentry on main process & renderer process (#242)
  * fix: protocol header padding (#241)
  * fix: size 15px (#240)
  * fix: text (#239)
  * feat: pos ETHSign type window center.
  * feat: allow invokation from extension's background. (#237)
  * fix: zero fee tip (#238)
  * chore: fix some text (#236)
  * feat: upgrade IDapp. (#223)
  * build: simplify deps about usb/hid, upgrade chain-data. (#234)
  * fix: url ellipsis (#233)
  * feat: detailed info for https cert error. (#231)
  * fix: tooltip (#230)
  * fix: url ellipsis (#229)
  * Merge branch 'dev' of github.com:RabbyHub/RabbyDesktop into dev
  * chore: rm console
  * feat: basic support for windows code signing. (#226)
  * fix: portfolio wrapper pt
  * fix: dapp bind (#225)
  * fix: add dapp bugs (#228)
  * fix: open behavior on site redirect.
  * feat: open scanLinks externally. (#227)
  * feat: rename app's brandName.
  * fix: curve (#224)
  * fix: ui (#222)
  * feat: support always open external url matching `blockchain_explorers` (#221)
  * fix: behavior of safe open. (#220)
  * feat: on add dapp, only prevent redirected url without same main domain.
  * feat: dapp bind (#219)
  * feat: adjust dapp-add process. (#218)
  * fix: add dapp subdomain message (#216)
  * fix: creation of rabbyx's sign window. (#217)
  * fix: react to protocol bindings changed. (#213)
  * feat: new add dapp (#214)
  * feat: upgrade rabbyx. (#215)
  * fix: safe open dapp. (#212)
  * fix: behavior of `tab.hide()` on win32.

v0.5.3 / 2023-03-03
===================

  * Release v0.5.3
  * fix: repeative request connect on debank.com (mobile version actually) (#211)
  * feat: swap styles (#210)
  * fix: modal styles (#209)
  * feat: adjust link/redirect behaviors.
  * fix: open new tab when secondaryDomain tab existed.
  * feat: try to improve viewManager for tabs. (#208)
  * fix: open url from rabbyx's approval page.
  * feat: remove maxmize restrain
  * fix: home height (#207)
  * feat: recover data storage under userData on macOS. (#206)
  * feat: use site's og/twitter info. (#205)
  * feat: swap with no fee (#203)
  * Feat/token search (#204)
  * fix: curve update (#201)
  * fix: modal styles (#200)
  * chore: url truncate style (#202)

v0.5.2 / 2023-03-01
===================

  * Release v0.5.2
  * feat: set local data path on windows.
  * security: remove codes about clipboard changed.
  * fix: portfolio page styles (#196)
  * fix: toast styles (#198)
  * chore: change some style (#194)
  * feat: vary localDataPath with userData on production. (#195)
  * fix: copy styles (#193)
  * feat: allow user to check url they want. (#192)
  * fix: dropdown styles (#191)
  * feat: support manual check new version. (#190)
  * chore: chian margin of icon and name (#189)
  * fix: dapp matching rules (#188)
  * feat: welcome page (#186)
  * chore: change some style (#183)
  * feat: tuning style of rabbyx connect window. (#187)
  * fix: time span (#184)
  * fix: address-management styles (#185)
  * fix: inviteCodeModal style (#182)

v0.5.1 / 2023-02-27
===================

  * Release v0.5.1
  * fix: hd connect modal (#181)
  * fix: add dapp (#180)
  * feat: global scrollbar style (#179)
  * chore: fix some style (#177)
  * fix: allow open dapp with existed main domain. (#178)
  * fix: address-management styles (#176)
  * feat: bypass all websocket like connections to avoid wallet connect issue.
  * fix: styles (#175)
  * feat: home keep-alive (#171)
  * chore: fix some ui bugs (#173)
  * fix: close address management (#172)
  * feat: support `useZViewsVisibleChanged`.
  * fix: rabbyx sign window style on darwin. (#170)
  * chore: upgrade rabbyx.
  * fix: on darwin, quit app on click mainWindow's close button.
  * feat: back to getting-started on no accounts rest. (#169)
  * Merge branch 'dev' of github.com:RabbyHub/RabbyDesktop into dev
  * fix: portfolio page styles
  * fix: upgrade axios to avoid exports mistake on renderer.
  * feat: invite code modal (#165)
  * feat: update sidebar context menu (#162)
  * chore: fix some bugs (#166)
  * feat: tuning navbar style. (#164)
  * fix: close connect modal (#167)
  * feat: adjust position of rabbyx's sign windows. (#168)
  * Feat/refresh (#163)
  * fix: judgement of `isInputExistedDapp`.
  * fix: type.
  * fix: potential infinite call in `useCurrentConnection`.
  * fix: goback on swap (#161)

v0.5.0 / 2023-02-23
===================

  * Release v0.5.0
  * fix: tuning style. (#160)
  * fix: home bottom margin
  * fix: duration of toast copied web3 addr in mainWindow.
  * fix/dapp manage (#155)
  * feat: adjust settings & upgrade (#159)
  * fix: variable ref.
  * fix: rabby is not a dapp
  * fix: find localTx from tx history (#158)
  * feat: support dynamic config pull. (#156)
  * Fix/slippage input (#152)
  * fix: portfolio issues (#157)
  * fix: history txs complete status (#154)
  * fix: edit name (#153)

v0.4.8 / 2023-02-22
===================

  * Release v0.4.8
  * fix: webview tag loading in mainWindow webContents.
  * chore: upgrade rabbyx to update matomo idSite.
  * fix: home width (#150)
  * fix: display of sign window on scaled win32. (#149)
  * fix: _TrezorConnect.close (#148)
  * fix: receive (#146)
  * fix: update alias when change (#147)
  * feat: new portfolio page (#144)
  * feat: disable spellcheck by default. (#142)
  * fix: handle react-hooks/exhaustive-deps (#143)
  * fix: style of sign button on watch address.
  * feat: reject all approvals on switching dapp.
  * feat: add loaing status for <PreviewWebview />
  * style: add gasket mask for hid select modal.
  * fix: empty modal on select devices modal window blur. (#145)
  * fix: link on onekey connection page.
  * fix: scrollbar in address list modal (#141)
  * feat: adjust trezor like connection window. (#140)
  * feat: update trezor (#138)
  * fix: declaration files. (#139)
  * fix: the spacing between the button and swap box (#137)
  * feat: add send link on homepage (#134)
  * fix: behavior of open handler. (#135)
  * fix: address bugs (#136)

v0.4.7 / 2023-02-17
===================

  * Release v0.4.7
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
