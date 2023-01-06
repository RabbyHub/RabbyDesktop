/// <reference path="../preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '../css/style.less';

import { Progress } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './loading.less';
import { DappFavicon } from '../components/DappFavicon';
import { useInterval } from '../hooks/useTimer';

function LoadingText() {
  const [dotCount, setDotCount] = useState(0);

  useInterval(() => {
    setDotCount((prev) => (prev + 1) % 4);
  }, 250);

  return (
    <div className="text">
      Loading
      <span className="loading-dots">{'.'.repeat(dotCount)}</span>
    </div>
  );
}

export default function App() {
  const [loadingInfo, setLoadingInfo] = React.useState<{
    dapp?: IDapp | null;
    percent: number;
  }>({
    dapp: null,
    percent: 0,
  });

  const timerRef = useRef<any>(null);
  const loadingRef = useRef<boolean>(false);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (!loadingRef.current) {
        setLoadingInfo((prev) => {
          if (prev.percent === 0) return prev;

          return { ...prev, percent: 0 };
        });
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-shadow
      setLoadingInfo((prev) => {
        if (prev.percent > 98) {
          clearInterval(timerRef.current);
          prev.percent = 98;
        } else if (prev.percent > 80) {
          prev.percent += 0.5;
        } else {
          prev.percent += Math.random() * 10;
        }

        return {
          ...prev,
        };
      });
    }, 500);
  }, []);

  useEffect(() => {
    resetTimer();
  }, [resetTimer]);

  const { percent, dapp } = loadingInfo;

  useEffect(() => {
    window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:loading-view:toggle',
      (payload) => {
        if (payload.type === 'show') {
          setLoadingInfo((prev) => {
            return { dapp: payload.dapp, percent: Math.max(prev.percent, 5) };
          });
          loadingRef.current = true;
        } else {
          setLoadingInfo({ dapp: null, percent: 0 });
          loadingRef.current = false;
        }
      }
    );
  }, [dapp?.origin]);

  return (
    <div className={`page-loading ${percent >= 100 ? 'hide' : ''}`}>
      <Progress
        percent={loadingRef.current ? percent : 0}
        status="active"
        showInfo={false}
        size="small"
        strokeLinecap="butt"
        strokeColor="#8697FF"
        strokeWidth={4}
      />
      <div className="container">
        <div className="content">
          {dapp ? (
            <DappFavicon
              src={dapp.faviconBase64 || dapp.faviconUrl}
              origin={dapp.origin}
              className="logo"
              alt=""
            />
          ) : null}
          <LoadingText />
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);
