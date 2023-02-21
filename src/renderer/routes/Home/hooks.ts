import { useState } from 'react';

export enum VIEW_TYPE {
  DEFAULT = 'DEFAULT',
  CHANGE = 'CHANGE',
}

export const useSwitchView = () => {
  const [currentView, setCurrentView] = useState(VIEW_TYPE.DEFAULT);
  const switchView = (view: VIEW_TYPE) => {
    if (currentView === view) return;
    setCurrentView(view);
  };
  return {
    switchView,
    currentView,
  };
};
