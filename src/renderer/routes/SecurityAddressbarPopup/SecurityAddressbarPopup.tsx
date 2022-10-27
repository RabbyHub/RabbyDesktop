import { useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';
import dayjs from 'dayjs';

import { hideDappAddressbarSecurityPopupView } from 'renderer/ipcRequest/security-addressbarpopup';
import { Divider } from 'antd';
import styles from './SecurityAddressbarPopup.module.less';

import {
  RcIconAddrbarPopupCheckItemHttps,
  RcIconAddrbarPopupCheckItemLastUpdate,
  RcIconAddrbarPopupChevronLeft,
  RcIconAddrbarPopupChevronRight,
  RcIconAddrbarPopupClose,
  RcIconAddrbarPopupCloseDark,
  RcIconAddrbarPopupShieldDanger,
  RcIconAddrbarPopupShieldOk,
  RcIconAddrbarPopupShieldWarning,
} from '../../../../assets/icons/security-addressbarpopup';

const MOCK_CHECKRESULT: ISecurityCheckResult = {
  origin: 'https://debank.com',
  countWarnings: 0,
  countDangerIssues: 0,
  countIssues: 0,
  resultLevel: 'ok',
  timeout: false,
  checkHttps: {
    level: 'ok',
    httpsError: false,
    timeout: false,
  },
  checkLatestUpdate: {
    timeout: false,
    latestItem: {
      dapp_id: '73ee0ad41f00b18e0a91c1a08aa3cc1c',
      version: 'f9d9950f670e5e3a6cf84bd3082aaf2c',
      is_changed: true,
      new_detected_address_list: [],
      create_at: 1666271410.3656614,
    },
    latestChangedItemIn24Hr: null,
    // "latestChangedItemIn24Hr": {
    //   "dapp_id":"73ee0ad41f00b18e0a91c1a08aa3cc1c",
    //   "version":"f9d9950f670e5e3a6cf84bd3082aaf2c",
    //   "is_changed": true,
    //   "new_detected_address_list":[],
    //   "create_at": (Date.now() - 30 * 60 * 1000) / 1e3
    // },
    level: 'ok',
  },
};

function formatLastUpdateTime(sec?: number) {
  let second = parseFloat(sec as any);
  if (Number.isNaN(second)) second = 0;

  if (!second) return '-';

  return dayjs(second * 1e3).format('YYYY/MM/DD HH:mm');
}

function usePageState() {
  const [pageState, setPageState] = useState<ISecurityAddrbarPopupState>({
    page: 'entry',
  });
  const [checkResult, setCheckResult] = useState<ISecurityCheckResult | null>(
    null
  );

  // const [ pageState, setPageState ] = useState<ISecurityAddrbarPopupState>({ page: 'detail-item', 'focusingItem': 'checkLatestUpdate' });
  // const [ checkResult, setCheckResult ] = useState<ISecurityCheckResult | null>(MOCK_CHECKRESULT);

  useEffect(() => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      '__internal_rpc:security-addressbarpopup:on-show',
      (evt) => {
        setCheckResult(evt.checkResult);
        setPageState({ page: 'entry' });
      }
    );

    document.body.classList.add('security-addressbarpopup');

    return () => {
      dispose?.();
      document.body.classList.remove('security-addressbarpopup');
    };
  }, []);

  const switchPageTo = useCallback(
    async (state: ISecurityAddrbarPopupState) => {
      switch (state.page) {
        case 'entry': {
          window.rabbyDesktop.ipcRenderer.sendMessage(
            '__internal_rpc:security-addressbarpopup:switch-pageview',
            state
          );
          break;
        }
        case 'detail-item': {
          window.rabbyDesktop.ipcRenderer.sendMessage(
            '__internal_rpc:security-addressbarpopup:switch-pageview',
            state
          );
          break;
        }
        default:
          break;
      }
    },
    []
  );

  useEffect(() => {
    window.rabbyDesktop.ipcRenderer.on(
      '__internal_rpc:security-addressbarpopup:switch-pageview',
      ({ state }) => {
        setPageState((prev) => ({ ...prev, ...state }));
      }
    );
  }, []);

  return {
    checkResult,
    ...(pageState.page === 'detail-item' && {
      page: pageState.page,
      focusingDetailed:
        pageState.page === 'detail-item' ? pageState.focusingItem : null,
    }),
    switchPageTo,
  };
}

function CheckItemDetailedExplanation({
  type,
  checkResult,
  onBack,
}: {
  type: IFocusedDetailedType;
  checkResult: ISecurityCheckResult;
  onBack: () => void;
}) {
  return (
    <div
      className={classNames(
        styles.detailWrapper,
        `J_check_level-${checkResult.resultLevel}`
      )}
    >
      <header>
        <div className={styles.left}>
          <RcIconAddrbarPopupChevronLeft
            className={styles.backIconSvg}
            onClick={onBack}
          />
          {type === 'checkHttps' && (
            <h4 className={styles.title}>HTTPS certificate validation</h4>
          )}
          {type === 'checkLatestUpdate' && (
            <h4 className={styles.title}>Web page last updated time</h4>
          )}
        </div>
        <div className={styles.right}>
          <RcIconAddrbarPopupCloseDark
            className={styles.closeIconSvg}
            onClick={() => hideDappAddressbarSecurityPopupView()}
          />
        </div>
      </header>

      {type === 'checkHttps' && (
        <main>
          <div className={styles.markedInfo}>
            <div className={styles.centerIcon}>
              <RcIconAddrbarPopupCheckItemHttps className={styles.iconSvg} />
              <RcIconAddrbarPopupShieldOk className={styles.levelIconSvg} />
            </div>
            <div
              className={classNames(
                styles.summaryText,
                `j-summary-${checkResult.checkHttps.level}`
              )}
            >
              <p className={styles.text}>Valid and Verified</p>
            </div>
          </div>

          <Divider className={styles.divider} />

          <div className={classNames(styles.details, `details-${type}`)}>
            <h4 className={styles.title}>What is an HTTPs certificate? </h4>
            <p className={styles.paragraph}>
              HTTPS certificate encrypts your information shared with the dapp,
              and provides secure communication with the official server. An
              expired or invalid certificate may lead to a leak of private
              information.
            </p>
          </div>
        </main>
      )}

      {type === 'checkLatestUpdate' && (
        <main>
          <div className={styles.markedInfo}>
            <div className={styles.centerIcon}>
              <RcIconAddrbarPopupCheckItemLastUpdate
                className={styles.iconSvg}
              />
              <RcIconAddrbarPopupShieldOk className={styles.levelIconSvg} />
            </div>
            <div
              className={classNames(
                styles.summaryText,
                `j-summary-${checkResult.checkLatestUpdate.level}`
              )}
            >
              <p className={styles.text}>
                {!checkResult.checkLatestUpdate.latestChangedItemIn24Hr
                  ? 'Updated more than 24 hours'
                  : 'Updated less than 24 hours'}
              </p>
              <div className={styles.lastUpdate}>
                Last updated:{' '}
                <time>
                  {formatLastUpdateTime(
                    checkResult.checkLatestUpdate.latestItem?.create_at
                  )}
                </time>
              </div>
              {/* Updated more than 24 hours */}
            </div>
          </div>

          <Divider className={styles.divider} />

          <div className={classNames(styles.details, `details-${type}`)}>
            <h4 className={styles.title}>
              What is the Web page last updated time?{' '}
            </h4>
            <p className={styles.paragraph}>
              It's recommended to use a dapp 24 hours after the updates to
              prevent the following risks:
              <ul>
                <li> An unauthorized code update by a hacker attack.</li>
                <li> An unfixed bug caused by the updates.</li>
              </ul>
            </p>
          </div>
        </main>
      )}
    </div>
  );
}

export default function SecurityAddressbarPopup() {
  const { checkResult, page, focusingDetailed, switchPageTo } = usePageState();

  if (!checkResult) return null;

  if (page === 'detail-item') {
    return (
      <CheckItemDetailedExplanation
        checkResult={checkResult}
        type={focusingDetailed!}
        onBack={() => {
          switchPageTo({ page: 'entry' });
        }}
      />
    );
  }

  return (
    <div
      className={classNames(
        styles.entryWrapper,
        `J_check_level-${checkResult.resultLevel}`
      )}
    >
      <header>
        <div className={styles.title}>
          {checkResult.resultLevel === 'ok' && (
            <>
              Dapp Security Engine found no risks and will continue to scan as
              you use the dapp
            </>
          )}
          {checkResult.resultLevel === 'warning' && (
            <>
              Dapp Security Engine found {checkResult.countWarnings} Warning(s)
            </>
          )}
        </div>
        <div
          className={styles.closeIcon}
          onClick={() => {
            hideDappAddressbarSecurityPopupView();
          }}
        >
          <RcIconAddrbarPopupClose className={styles.iconSvg} />
        </div>
      </header>
      <main>
        {/* check-item: last update time */}
        <div
          className={classNames(
            styles.checkItemRow,
            !checkResult.checkLatestUpdate.timeout && styles.clickable,
            checkResult.checkLatestUpdate.level === 'danger' &&
              styles.JCheckItemLevelDanger,
            checkResult.checkLatestUpdate.level === 'warning' &&
              styles.JCheckItemLevelWarning
          )}
          onClick={() => {
            if (checkResult.checkLatestUpdate.timeout) return;
            switchPageTo({
              page: 'detail-item',
              focusingItem: 'checkLatestUpdate',
            });
          }}
        >
          <div className={styles.left}>
            <div className={styles.JLevelIcon}>
              {checkResult.checkLatestUpdate.level === 'danger' && (
                <RcIconAddrbarPopupShieldDanger className={styles.iconSvg} />
              )}
              {checkResult.checkLatestUpdate.level === 'warning' && (
                <RcIconAddrbarPopupShieldWarning className={styles.iconSvg} />
              )}
              {checkResult.checkLatestUpdate.level === 'ok' && (
                <RcIconAddrbarPopupShieldOk className={styles.iconSvg} />
              )}
            </div>
            <div className={styles.text}>
              <div className={styles.title}>Web page last updated time</div>
              <div className={styles.desc}>
                {checkResult.checkLatestUpdate.timeout
                  ? 'Check Timeout'
                  : checkResult.checkLatestUpdate.latestChangedItemIn24Hr
                  ? 'Updated less than 24 hours'
                  : 'Updated more than 24 hours'}
              </div>
            </div>
          </div>

          <div className={styles.right}>
            {!checkResult.checkLatestUpdate.timeout && (
              <RcIconAddrbarPopupChevronRight className={styles.iconSvg} />
            )}
          </div>
        </div>

        {/* check-item: https verifications */}
        <div
          className={classNames(
            styles.checkItemRow,
            !checkResult.checkHttps.timeout && styles.clickable,
            checkResult.checkHttps.level === 'danger' &&
              styles.JCheckItemLevelDanger,
            checkResult.checkHttps.level === 'warning' &&
              styles.JCheckItemLevelWarning
          )}
          onClick={() => {
            if (checkResult.checkHttps.timeout) return;
            switchPageTo({ page: 'detail-item', focusingItem: 'checkHttps' });
          }}
        >
          <div className={styles.left}>
            <div className={styles.JLevelIcon}>
              {checkResult.checkHttps.level === 'danger' && (
                <RcIconAddrbarPopupShieldDanger className={styles.iconSvg} />
              )}
              {checkResult.checkHttps.level === 'warning' && (
                <RcIconAddrbarPopupShieldWarning className={styles.iconSvg} />
              )}
              {checkResult.checkHttps.level === 'ok' && (
                <RcIconAddrbarPopupShieldOk className={styles.iconSvg} />
              )}
            </div>
            <div className={styles.text}>
              <div className={styles.title}>HTTPS certificate validation</div>
              <div className={styles.desc}>
                {checkResult.checkHttps.timeout
                  ? 'Check Timeout'
                  : checkResult.checkHttps.httpsError
                  ? 'Invalid Https Certifactions'
                  : 'Valid and Verified'}
              </div>
            </div>
          </div>

          <div className={styles.right}>
            {!checkResult.checkHttps.timeout && (
              <RcIconAddrbarPopupChevronRight className={styles.iconSvg} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
