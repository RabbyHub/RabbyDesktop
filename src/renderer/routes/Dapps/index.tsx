import React, { useEffect, useState } from 'react';
import { useDapps } from '../../hooks/usePersistData';
import { default as ModalAddDapp } from '../../components/ModalAddDapp';

import { useAppVersion } from '../../hooks/useMainBridge';

import './index.less';

export default function DApps() {
  const appVersion = useAppVersion();

  const { dapps } = useDapps();

  const [ isModalOpen, setIsModalOpen ] = useState(false);

  return (
    <div id="homepage">
      <ModalAddDapp
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onAddedDapp={() => {
          setIsModalOpen(false)
        }}
      />
      <header>
        <h2 className="title">My Dapps</h2>
      </header>
      <main>
        <div className="dapps">
          <div className="dapp-matrix">
            {dapps.map((dapp, idx) => {
              return (
                <div
                  key={`${dapp.url}-${dapp.alias}-${idx}`}
                  className="dapp-block-wrapper"
                >
                  <div className="dapp-block">
                    {/* TODO: robust about load image */}
                    <img
                      className="dapp-favicon"
                      src={dapp.faviconUrl}
                      alt="add"
                    />
                    <div className="infos">
                      <h4 className='dapp-alias'>{dapp.alias}</h4>
                      <span className='dapp-url'>{dapp.url}</span>
                    </div>
                    <div className='menu-entry'></div>
                  </div>
                </div>
              )
            })}
            <div
              className="dapp-block-wrapper J_add"
              onClick={() => {
                setIsModalOpen(true);
              }}
            >
              <div className="dapp-block">
                <img
                  className="dapp-favicon"
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
