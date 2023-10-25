import { useDappOriginInfo } from '@/renderer/hooks/useDappOriginInfo';
import styled from 'styled-components';

const TransactionWebsiteWrapper = styled.div`
  color: var(--r-neutral-foot, #babec5);
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  text-decoration-line: underline;
  text-decoration-skip-ink: none;
  text-underline-offset: 2px;

  cursor: pointer;

  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TransactionWebsite = ({ site }: { site: ConnectedSite }) => {
  const { url, openDapp: handleClickLink } = useDappOriginInfo(site.origin);
  if (!url) {
    return null;
    // return <TransactionWebsiteWrapper>Rabby Wallet</TransactionWebsiteWrapper>;
  }
  return (
    <TransactionWebsiteWrapper
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClickLink();
      }}
    >
      {url}
    </TransactionWebsiteWrapper>
  );
};
