/// <reference path="../preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '../css/style.less';

import './getting-started.less';
import { useDesktopAppState } from '../hooks/useDesktopAppState';
import React from 'react';
import { Button } from 'antd';

export default function GettingStarted() {
  const { redirectToMainWindow } = useDesktopAppState();

  return (
    <div className="page-welcome">
      <div className="page-content">
        <div className="slogan">Specialized client for Dapp security</div>
        <div className="slogan">Rabby Wallet Desktop</div>
      </div>
      <Button
        onClick={() => {
          // putHasStarted();
          redirectToMainWindow();
        }}
      >
        Getting Started
      </Button>
    </div>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<GettingStarted />);
