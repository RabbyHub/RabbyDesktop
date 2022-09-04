import React, { memo, useEffect, useMemo } from "react";
import Sortable from "sortablejs";
import classnames from "classnames";

import "./style.css";

interface TabGroupProps {
  activeIndex?: number;
  onActiveTabChange?: (index: number) => void;
  onCloseTab?: (tab: TabRenderContent) => void;

  tabs: TabOptions[];

  defaultTab?: string,
  visibilityThreshold?: number,
  
  closeButtonText?: string,
  /* implement it as NewTab */
  newTabButton?: boolean,
  newTabButtonText?: string,

  /* TODO: implement it */
  sortable?: boolean,
  sortableOptions?: Sortable.Options
}

interface Badge {
  text: string,
  classname: string
}

export default function TabGroup ({
  children,
  activeIndex: _activeIndex = 0,
  tabs,
  onActiveTabChange,
  onCloseTab,
  ...props
}: React.PropsWithChildren<TabGroupProps>) {
  const {
    tabChildren
  } = useMemo(() => {
    const tabChildren = [] as TabRenderContent[];
    tabs.forEach((tab, index) => {
      // const t = typeof child;
      // const rt = (child as React.ReactElement)?.type;
      // if (typeof child !== "object" || (rt as Function)?.name !== TabGroup.Tab.name) {
      //   console.warn(`TabGroup children must be Tab, but child ${index} is ${t}, with react type ${rt}`);
      //   return ;
      // }
      let ele: React.ReactNode = null;
      if (tab.prerender) {
        ele = tab.render(tab);
      }

      tabChildren.push({
        ...tab,
        index,
        title: tab.title ?? `Tab ${index}`,
        icon: tab.icon || '',
        iconURL: tab.iconURL || '',
        closable: tab.closable === false,
        ele,
      });
    });

    return {
      tabChildren
    }
  }, [ children ]);

  const [ activeTabIndex, setActiveTabIndex ] = React.useState(_activeIndex);
  useEffect(() => {
    setActiveTabIndex?.(_activeIndex);
  }, [ _activeIndex ]);

  return (
    <div className="rabby-tab-etabs">
      <nav className="rabby-tab-nav visible">
        <div className="rabby-tab-navs">
          {tabChildren.map((tab, idx) => {
            const isActive = activeTabIndex === tab.index;
            return (
              <div
                key={`rabby-tabs-nav-${idx}`}
                className={classnames('rabby-tab visible', isActive && 'active')}
                onClick={() => {
                  const tabIndex = tab.index;
                  setActiveTabIndex(tabIndex);

                  onActiveTabChange?.(tabIndex);
                }}
              >
                {/* TODO: allow tab.icon as React.ReactNode */}
                {tab.icon && <span className="rabby-tab-icon"></span>}
                <span className="rabby-tab-title" title="electron-tabs on NPM">{tab.title}</span>
                {/* <span className="rabby-tab-badge hidden"></span> */}
                {!tab.closable && (
                  <span className="rabby-tab-close" onClick={() => onCloseTab?.(tab)}>
                    <button>×</button>
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <div className="rabby-tab-buttons"></div>
      </nav>
      {tabChildren.map((tab) => {
        const key = `rabby-tab-${tab.index}`;
        const isActive = activeTabIndex === tab.index;
        
        return (
          <Tab key={key} __active={isActive} visible={!tab.prerender || isActive}>
            {!tab.ele && !tab.prerender ? tab.render(tab) : (tab.ele || null)}
          </Tab>
        )
      })}
    </div>
  )
}

interface TabProps {
  badge?: Badge;
  closable?: boolean;
  icon?: string;
  iconURL?: string;
  // ready?: ((el: HTMLDivElement) => void);
  title?: string;
}

type TabOptions = TabProps & {
  prerender?: boolean
  render: (opt: TabOptions) => React.ReactNode;
  /* inner property */
}

type TabRenderContent = TabOptions & {
  index: number
  ele: React.ReactNode | null
};

const Tab = memo(
  function  ({
    children,
    __active,
    visible = true,
    ...props
  }: React.PropsWithChildren<TabProps & {
    __active?: boolean;
    visible?: boolean;
}>) {
    return (
      <div className={classnames('rabby-tab-view', __active && visible && 'visible')}>
        {children}
        {/* <webview className="rabby-tab-view visible" src="https://www.npmjs.com/package/electron-tabs"></webview> */}
      </div>
    )
  }
)

TabGroup.Tab = Tab;