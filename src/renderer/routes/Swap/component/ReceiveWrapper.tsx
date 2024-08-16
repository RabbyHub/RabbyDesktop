import styled from 'styled-components';

export const QuoteReceiveWrapper = styled.div`
  position: relative;
  margin-top: 30px;
  border: 1px solid var(--r-blue-default, #7084ff);
  border-radius: 4px;
  cursor: pointer;
  color: var(--r-neutral-title-1, #192945);
  font-size: 14px;
  height: 100px;
  padding: 16px;
  padding-top: 20px;

  &:hover {
    background: var(--r-blue-light1, #424962);
  }

  &.bestQuote {
    border-color: var(--r-green-default, #2abb7f);
  }

  &.empty-quote {
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border-color: var(--r-neutral-line);
  }

  .quote-select {
    position: absolute;
    top: -12px;
    left: 12px;
    height: 20px;
    padding: 4px 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    font-size: 13px;
    cursor: pointer;

    color: var(--r-blue-default, #d3d8e0);
    background: var(--r-blue-light1, #424962);
    border-radius: 4px;
    border: 0.5px solid var(--r-blue-default, #7084ff);
    &.best {
      border-color: var(--r-green-default, #2abb7f);
      color: var(--r-green-default, #2abb7f);
      background: #395a5a; //var(--r-green-light, #395a5a);
    }
  }
`;
