import { Input } from 'antd';
import React from 'react';
import clsx from 'clsx';
import { useDebounce } from 'react-use';
import styled from 'styled-components';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';

export interface Props {
  onSearch?: (value: string) => void;
}

const InputStyled = styled(Input)`
  &.ant-input-affix-wrapper-focused {
    border-color: #7084ff !important;
  }
  &:hover {
    border-color: #7084ff !important;
  }
`;

export const TokenSearchInput = React.forwardRef<any, Props>(
  ({ onSearch }, ref) => {
    const [input, setInput] = React.useState<string>('');
    const [isFocus, setIsFocus] = React.useState<boolean>(false);
    const { currentAccount } = useCurrentAccount();

    useDebounce(
      () => {
        onSearch?.(input);
      },
      300,
      [input]
    );

    React.useEffect(() => {
      setInput('');
    }, [currentAccount?.address]);

    return (
      <InputStyled
        ref={ref}
        onChange={(e) => setInput(e.target.value)}
        value={input}
        placeholder="Search name"
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        className={clsx(
          'text-12 text-[#F7F8F9] py-0 px-[9px] h-[32px]',
          'border border-[#FFFFFF1A] rounded-[6px]',
          'transform-none w-[240px]',
          'bg-[#FFFFFF0F]',
          {
            'w-[420px]': isFocus || input,
          }
        )}
        prefix={
          <img
            src="rabby-internal://assets/icons/common/search.svg"
            className="w-[14px] h-[14px]"
          />
        }
      />
    );
  }
);
