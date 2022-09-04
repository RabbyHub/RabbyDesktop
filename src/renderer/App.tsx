import classnames from "classnames";
import { useMemo } from "react";
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import TabGroup from './components/electron-tabs';

function useTabs () {
  return useMemo(() => {
    return [
      {
        title: 'Start Screen',
        render: () => {
          return (
            <div>
              <div className="Hello">
                <img width="200" alt="icon" src={icon} />
              </div>
              <h1>Rabby Wallet Desktop</h1>
              <div className="Hello">
                <a
                  href="https://rabby.io/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <button type="button">
                    <span role="img" aria-label="books">
                      📚
                    </span>
                    Homesite
                  </button>
                </a>
              </div>
            </div>
          )
        }
      },
      {
        title: 'Home',
        render: () => {
          return <>Home Dashboard</>
        }
      },
      {
        title: 'Debank DApp',
        render: () => {
          return <webview className={classnames('rabby-tab-webview')} src='https://debank.com' />
        },
        prerender: true
      },
      {
        title: 'UniSwap',
        render: () => {
          return <webview className={classnames('rabby-tab-webview')} src='https://uniswap.org/' />
        },
        prerender: true
      },
      {
        title: 'NPM Package',
        render: () => {
          return <webview className={classnames('rabby-tab-webview')} src='https://www.npmjs.com/package/electron-tabs' />
        },
        prerender: true
      }
    ];
  }, [])
}

const DApps = () => {
  const tabs = useTabs();

  return (
    <TabGroup
      activeIndex={1}
      tabs={tabs}
    />
  );
};

export default function App() {

  return (
    <Router initialEntries={['/dapps']}>
      <Routes>
        {/* <Route path="/" element={<DApps />} /> */}
        <Route path="/dapps" element={<DApps />} />
      </Routes>
    </Router>
  );
}
