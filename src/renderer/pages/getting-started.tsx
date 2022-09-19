/// <reference path="../preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '../css/style.less';

import './getting-started.less';
import { useDesktopAppState } from '../hooks/useDesktopAppState';

export default function GettingStarted() {
  const { redirectToMainWindow } = useDesktopAppState();

  return (
    <div>
      global

      <button onClick={() => {
        // putHasStarted();

        redirectToMainWindow();
      }}>Getting Started</button>
    </div>
  );
}


const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<GettingStarted />);
