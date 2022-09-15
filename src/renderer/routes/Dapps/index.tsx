import React from 'react';
import { useAppVersion } from '../../hooks/useMainBridge';

import './index.less';

export default function DApps() {
  const appVersion = useAppVersion();
  return (
    <div id="homepage">
      <header>
        <h2 className="title">My Dapps</h2>
      </header>
      <main>
        <div className="dapps">
          <div className="dapp-matrix">
            <div className="dapp-block-wrapper">
              <div className="dapp-block" />
            </div>
            <div className="dapp-block-wrapper">
              <div className="dapp-block" />
            </div>
            <div className="dapp-block-wrapper">
              <div className="dapp-block" />
            </div>
            <div className="dapp-block-wrapper J_add">
              <div className="dapp-block">
                <img
                  className="icon"
                  src="rabby-internal://assets/icons/internal-homepage/icon-dapps-add.svg"
                  alt="add"
                />
                <div className="text">Add a Dapp</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer>
        <img
          className="logo"
          src="rabby-internal://assets/icons/internal-homepage/logo.svg"
          alt="logo"
        />
        <div className="version-text">Version: {appVersion}</div>
      </footer>
    </div>
  );
}
