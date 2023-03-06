/* eslint-disable import/no-cycle */
import React from 'react';
import { wrapUrlInImgOrDefault } from '@/renderer/utils/token';
import styled from 'styled-components';

const TokenIconsWrapper = styled.div`
  flex: none;
  align-items: center;
  position: relative;
  align-self: center;
  max-width: 100%;

  & > div {
    display: inline;
    vertical-align: middle;
  }

  img {
    border-radius: 50%;
  }
`;

// 堆叠小图标
const TokensIcons = React.memo(
  (props: {
    icons: (string | undefined)[] | (string | undefined);
    width?: number;
    margin?: number;
    tokens?: string;
  }) => {
    const { icons: _icons, width: defaultWidth = 18, tokens } = props;
    const margin = props.margin ?? 6;
    const icons = Array.isArray(_icons) ? _icons : [_icons];
    const width = (defaultWidth ? defaultWidth / 2 : 10) + margin / 2;
    const imgs = icons.map((v) => wrapUrlInImgOrDefault(v, defaultWidth));
    const containerWidth = 2 * width + (imgs.length - 1) * width;
    return (
      <TokenIconsWrapper className="tokenIcons">
        {imgs.map((v, i) => (
          <div style={{ marginLeft: i === 0 ? undefined : `-${2 * i}px` }}>
            {v}
          </div>
        ))}
        <div
          style={{
            marginLeft: '5px',
          }}
        >
          {tokens}
        </div>
      </TokenIconsWrapper>
    );
  }
);

export default TokensIcons;
