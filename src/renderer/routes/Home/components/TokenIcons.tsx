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
    nftIcons?: (string | undefined)[];
    width?: number;
    margin?: number;
  }) => {
    const { icons: _icons, width: defaultWidth = 18 } = props;
    const margin = props.margin ?? 6;
    const icons = Array.isArray(_icons) ? _icons : [_icons];
    const { nftIcons } = props;
    const imgs = [
      ...(nftIcons ?? []).map((n) =>
        wrapUrlInImgOrDefault(n, defaultWidth, { borderRadius: 4 })
      ),
      ...icons.map((v) => wrapUrlInImgOrDefault(v, defaultWidth)),
    ];
    return (
      <TokenIconsWrapper className="tokenIcons">
        {imgs.map((v, i) => (
          <div style={{ marginLeft: i === 0 ? undefined : `-${2 * i}px` }}>
            {v}
          </div>
        ))}
      </TokenIconsWrapper>
    );
  }
);

export default TokensIcons;
