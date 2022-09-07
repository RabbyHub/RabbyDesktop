import classnames from "classnames";
import { ensureSuffix } from "isomorphic/string";
import { useMemo } from "react";
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import IconRabby from '../../assets/icon.svg';
import IconHome from '../../assets/icons/native-tabs/icon-home.svg';
import './App.css';
import TabGroup, { TabOptions } from './components/electron-tabs';
import useRabbyLoaded from "./hooks/useRabbyLoaded";

function useTabs (rabbyExt: Electron.Extension | null): TabOptions[] {
  return useMemo(() => {
    return [
      {
        title: 'Home',
        icon: (<img src={IconHome} className="rabby-tab-icon-img" />),
        draggable: false,
        closable: false,
        render: () => {
          return (
            <>
              Home Dashboard
            </>
          )
        }
      },
      rabbyExt ? {
        title: 'Rabby Wallet',
        icon: (<img src={IconRabby} className="rabby-tab-icon-img" />),
        draggable: false,
        render: () => {
          return (
            // TODO inspect it, call webview.openDevTools() on this element
            <webview
              className={classnames('rabby-tab-webview')}
              style={{ width: '400px', height: '599px', margin: '0 auto' }}
              // src={`${ensureSuffix(rabbyExt.url, '/')}popup.html/#/no-address`}
              src={`${ensureSuffix(rabbyExt.url, '/')}popup.html#/no-address`}
            />
          )
        },
      } : null as any as TabOptions,
      {
        title: 'Start Screen',
        render: () => {
          return (
            <div>
              <div className="Hello">
                <img width="200" alt="icon" src={IconRabby} />
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
        title: 'Debank DApp',
        render: () => {
          return <webview className={classnames('rabby-tab-webview')} src='https://debank.com' />
        },
        // prerender: true
      },
      {
        title: 'UniSwap',
        render: () => {
          return <webview className={classnames('rabby-tab-webview')} src='https://uniswap.org/' />
        },
        // prerender: true
      },
      {
        title: 'NPM Package',
        render: () => {
          return <webview className={classnames('rabby-tab-webview')} src='https://www.npmjs.com/package/electron-tabs' />
        },
        // prerender: true
      }
    ].filter(Boolean);
  }, [ rabbyExt ])
}

const DApps = () => {
  const rabbyExt = useRabbyLoaded();
  const tabs = useTabs(rabbyExt);

  return (
    <TabGroup
      activeIndex={1}
      tabs={tabs}
      navClassname={'native-tab-nav'}
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
