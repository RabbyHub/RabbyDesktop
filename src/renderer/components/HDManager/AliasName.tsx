/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import RabbyInput from '../AntdOverwrite/Input';

interface Props {
  address: string;
  aliasName?: string;
  onChange: (value: string) => void;
}

const cachedName = new Map<string, string>();

export const AliasName: React.FC<Props> = ({
  address,
  aliasName,
  onChange,
}) => {
  const [hover, setHover] = React.useState(false);
  const [value, setValue] = React.useState(aliasName);
  const [focus, setFocus] = React.useState(false);
  const inputRef = React.useRef<HTMLDivElement>(null);

  const onChangeAliasName = React.useCallback((e: any) => {
    const { value: inputValue } = e.target as { value: string };
    if (!inputValue) {
      setFocus(false);
      setHover(false);
      return;
    }
    if (inputValue && inputValue !== aliasName) {
      if (address) {
        cachedName.set(address, inputValue);
      }

      onChange(inputValue);
    }

    setValue(inputValue);
  }, []);

  const onClickCheck = React.useCallback(() => {
    setTimeout(() => {
      setFocus(false);
      setHover(false);
    }, 200);
  }, []);

  // const cachedValue = cachedName.get(address);

  React.useEffect(() => {
    setValue(aliasName);

    // if (aliasName && cachedValue && cachedValue !== aliasName) {
    //   setValue(cachedValue);
    //   onChange(cachedValue);
    // } else if (aliasName) {
    //   cachedName.set(address, aliasName);
    // }
  }, [aliasName]);

  if (!value) {
    // if (cachedValue) {
    //   return (
    //     <div className="AliasName AliasName--disabled">
    //       <div className="label">
    //         <span className="text">{cachedValue}</span>
    //       </div>
    //     </div>
    //   );
    // }

    return null;
  }

  return (
    <div className="AliasName">
      {hover || focus ? (
        <div className="input-group" onBlur={onClickCheck}>
          <RabbyInput
            className="alias-input"
            defaultValue={value}
            onBlur={onChangeAliasName}
            onFocus={() => setFocus(true)}
            onPressEnter={onChangeAliasName}
            autoFocus
          />
          <img
            className="icon"
            src="rabby-internal://assets/icons/hd-manager/check-green.svg"
          />
        </div>
      ) : (
        <div className="label" onClick={() => setHover(true)}>
          <span className="text">{value}</span>
          <img
            className="icon"
            src="rabby-internal://assets/icons/hd-manager/pen.svg"
          />
        </div>
      )}
    </div>
  );
};
