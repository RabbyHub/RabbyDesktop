import React from 'react';
import { Input, InputProps } from 'antd';
import clsx from 'clsx';

// const SearchInput = React.forwardRef<InputProps>();
const SearchInput = function (props: InputProps) {
  const { onBlur, onFocus } = props;
  const [isFocusing, setIsFocusing] = React.useState(false);

  const handleFocus: Exclude<InputProps['onFocus'], void> = React.useCallback(
    (e) => {
      setIsFocusing(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur: Exclude<InputProps['onBlur'], void> = React.useCallback(
    (e) => {
      setIsFocusing(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  return (
    <div className={clsx('search-input-wrapper', isFocusing && 'is-focusing')}>
      <Input
        {...props}
        // ref={ref as any}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  );
};

export default SearchInput;
