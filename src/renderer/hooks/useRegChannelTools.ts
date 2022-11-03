import { useCallback, useRef, useState } from 'react';

const IS_REG_CHANNEL = process.env.BUILD_CHANNEL === 'reg';

export function useClickToPopupDebugMenu() {
  const clickCountRef = useRef(0);
  const timerRef = useRef<any>(null);
  const [showDebugMenu, setShowDebugMenu] = useState(false);

  const onClick5TimesFooterVersion = useCallback(() => {
    if (!IS_REG_CHANNEL) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    clickCountRef.current++;
    if (clickCountRef.current === 5) {
      setShowDebugMenu(true);
      clickCountRef.current = 0;
    }

    timerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 3000);
  }, []);

  const closeDebugMenu = useCallback(() => {
    setShowDebugMenu(false);
  }, []);

  return {
    showDebugMenu: IS_REG_CHANNEL && showDebugMenu,
    closeDebugMenu,
    onClick5TimesFooterVersion,
  };
}
