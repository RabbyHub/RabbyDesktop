/// <reference path="../../preload.d.ts" />

import { Button, Modal } from 'antd';
import classNames from 'classnames';
import '../../css/style.less';

import './SecurityCheck.less';
import { useCheckDapp } from 'renderer/hooks/useSecurityCheck';

const ICON_LOADING =
  'rabby-internal://assets/icons/security-check/icon-loading.svg';

const ICON_SHILED_OK =
  'rabby-internal://assets/icons/security-check/icon-shield-ok.svg';
const ICON_SHILED_WARNING =
  'rabby-internal://assets/icons/security-check/icon-shield-warning.svg';
const ICON_SHILED_DANGER =
  'rabby-internal://assets/icons/security-check/icon-shield-danger.svg';

export default function ModalSecurityCheck() {
  const {
    dappInfo,

    checkingInfo,
    isChecking,
    checkingUrl,
    checkResult,

    checkItemViewHttps,
    checkItemViewLatestUpdateInfo,

    viewOperationData,
    hideView,

    closeNewTabAndThisView,
  } = useCheckDapp();

  if (!checkingUrl) return null;

  return (
    <Modal
      className={classNames(
        'modal-security-check',
        `J_check_level-${checkResult.resultLevel}`
      )}
      wrapClassName="modal-security-check-wrap"
      width={560}
      open={!!checkingUrl}
      maskClosable={!isChecking && !viewOperationData.reconfirmRequired}
      mask
      centered
      closable={false}
      onCancel={() => {
        hideView();
      }}
      footer={null}
    >
      <img
        className="modal-bg-logo"
        src="rabby-internal://assets/icons/security-check/modal-bg-logo.svg"
      />
      <div
        className={classNames(
          'check-header',
          `J_check_level-${checkResult.resultLevel}`
        )}
      >
        {isChecking ? (
          <img
            className="bg-placeholder"
            src="rabby-internal://assets/icons/security-check/modal-header-ok.svg"
          />
        ) : (
          <>
            {checkResult.resultLevel === 'ok' && (
              <img
                className="bg-placeholder"
                src="rabby-internal://assets/icons/security-check/modal-header-ok.svg"
              />
            )}
            {checkResult.resultLevel === 'warning' && (
              <img
                className="bg-placeholder"
                src="rabby-internal://assets/icons/security-check/modal-header-warning.svg"
              />
            )}
            {checkResult.resultLevel === 'danger' && (
              <img
                className="bg-placeholder"
                src="rabby-internal://assets/icons/security-check/modal-header-danger.svg"
              />
            )}
          </>
        )}

        <div className="header-info">
          <div className="inner">
            <div className="check-status-text">
              {isChecking ? (
                <>Dapp Security Engine is scanning ...</>
              ) : checkResult.countDangerIssues ? (
                <>
                  Dapp Security Engine found {checkResult.countDangerIssues}{' '}
                  danger(s)
                  <br />
                  Unable to proceed
                </>
              ) : checkResult.countIssues ? (
                <>
                  Dapp Security Engine found {checkResult.countIssues}{' '}
                  warning(s)
                </>
              ) : (
                // TODO: just close this modal on no issues
                <>
                  Dapp Security Engine found no risks and will continue to scan
                  as you use the dapp
                </>
              )}
            </div>
            {!dappInfo ? null : (
              <div className="checking-dapp">
                <span className="dapp-icon">
                  <img
                    src={
                      dappInfo.faviconBase64 ||
                      `https://www.google.com/s2/favicons?domain=${dappInfo.origin}`
                    }
                  />
                </span>
                <span>{dappInfo.origin}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="check-main-wrapper">
        <div className="check-item">
          <div
            className={classNames(
              'check-icon',
              checkingInfo.checkingLastUpdate && 'loading'
            )}
          >
            <img
              src={
                checkingInfo.checkingLastUpdate
                  ? ICON_LOADING
                  : checkResult.checkLatestUpdate.level === 'danger'
                  ? ICON_SHILED_DANGER
                  : checkResult.checkLatestUpdate.level === 'warning'
                  ? ICON_SHILED_WARNING
                  : ICON_SHILED_OK
              }
            />
          </div>
          <div className="desc">
            <div className="title">Web page last updated time</div>
            <div className="checking-status">
              {checkingInfo.checkingLastUpdate
                ? 'Checking...'
                : checkItemViewLatestUpdateInfo.resultText}
            </div>
          </div>
        </div>

        <div className="check-item">
          <div
            className={classNames(
              'check-icon',
              checkingInfo.checkingHttps && 'loading'
            )}
          >
            <img
              src={
                checkingInfo.checkingHttps
                  ? ICON_LOADING
                  : checkResult.checkHttps.level === 'danger'
                  ? ICON_SHILED_DANGER
                  : checkResult.checkHttps.level === 'warning'
                  ? ICON_SHILED_WARNING
                  : ICON_SHILED_OK
              }
            />
          </div>
          <div className="desc">
            <div className="title">HTTPS certificate validation</div>
            <div className="checking-status">
              {checkingInfo.checkingHttps
                ? 'Checking...'
                : checkItemViewHttps.resultText}
            </div>
          </div>
        </div>
        {checkResult.resultLevel === 'warning' && (
          <div className="operations">
            <Button
              type="default"
              className="J_op J_op_cancel"
              onClick={() => hideView()}
            >
              Continue to use
            </Button>
            <Button
              type="primary"
              className="J_op J_op_warning"
              onClick={() => closeNewTabAndThisView()}
            >
              Close Dapp
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
