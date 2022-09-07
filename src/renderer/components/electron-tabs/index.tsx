import React, { memo, useEffect, useMemo } from "react";
import Sortable from "sortablejs";
import classnames from "classnames";

import "./style.scss";
import useSortable from "./useSortable";

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

  navClassname?: string
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
  navClassname,
  ...props
}: React.PropsWithChildren<TabGroupProps>) {
  const {
    tabChildren
  } = useMemo(() => {
    const tabChildren = [] as TabRenderContent[];
    tabs.forEach((tab, index) => {
      let ele: React.ReactNode = null;
      if (tab.prerender) {
        ele = tab.render(tab);
      }

      tabChildren.push({
        ...tab,
        index,
        title: tab.title ?? `Tab ${index}`,
        icon: tab.icon || null,
        closable: tab.closable === false,
        draggable: tab.draggable !== false,
        ele,
      });
    });

    return {
      tabChildren
    }
  }, [ tabs ]);

  const [ activeTabIndex, setActiveTabIndex ] = React.useState(_activeIndex);
  useEffect(() => {
    setActiveTabIndex?.(_activeIndex);
  }, [ _activeIndex ]);

  const sortContainerRef = useSortable({
    draggable: '.draggable-tab'
  });

  return (
    <div className="rabby-tab-etabs">
      <nav className={classnames('rabby-tab-nav', navClassname)}>
        <div className="rabby-tab-navs" ref={sortContainerRef}>
          {tabChildren.map((tab, idx) => {
            const isActive = activeTabIndex === tab.index;
            const draggable = tab.draggable;

            return (
              <div
                key={`rabby-tabs-nav-${tab.title}-${idx}`}
                className={classnames('rabby-tab', isActive && 'active', draggable && 'draggable-tab')}
                onClick={() => {
                  const tabIndex = tab.index;
                  setActiveTabIndex(tabIndex);

                  onActiveTabChange?.(tabIndex);
                }}
              >
                <div className="rabby-tab-inner-left">
                  <span className="rabby-tab-icon">
                    {tab.icon}
                  </span>
                  <span className="rabby-tab-title" title="electron-tabs on NPM">{tab.title}</span>
                </div>
                <div className="rabby-tab-inner-right">
                  {!tab.closable && (
                    <span className="rabby-tab-close" onClick={() => onCloseTab?.(tab)}>
                      <button>×</button>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="rabby-tab-buttons"></div>
      </nav>
      {tabChildren.map((tab) => {
        const key = `rabby-tab-${tab.title}-${tab.index}`;
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
  draggable?: boolean;
  closable?: boolean;
  icon?: React.ReactNode;
  // ready?: ((el: HTMLDivElement) => void);
  title?: string;
}

export type TabOptions = TabProps & {
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
