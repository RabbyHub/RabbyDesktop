import { useEffect, useCallback } from 'react';
import {
  Navigate,
  useLocation,
  useMatches,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { ensurePrefix } from '@/isomorphic/string';
import { parseQueryString } from '@/isomorphic/url';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';

const { view: viewName } = parseQueryString();
function useCloseOnCrash() {
  const matches = useMatches();
  useEffect(() => {
    if (matches.length) hideMainwinPopupview(viewName as any);
  }, [matches]);
}

export function useResetToCurrentPage() {
  const location = useLocation();
  const nav = useNavigate();

  const doReset = useCallback(() => {
    nav(`/popupview-reset-to/${encodeURIComponent(location.pathname)}`);
  }, [nav, location.pathname]);

  return doReset;
}

export function PopupViewClose() {
  useCloseOnCrash();

  return null;
}

export function ResetTo() {
  const { resetTo } = useParams();

  if (!resetTo) {
    return <Navigate to="/" />;
  }

  return <Navigate to={ensurePrefix(decodeURIComponent(resetTo), '/')} />;
}
