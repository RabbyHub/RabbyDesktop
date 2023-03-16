import { useLocation, useSearchParams } from 'react-router-dom';

export function useRbiSource() {
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  return state?.rbisource || searchParams.get('rbisource');
}
