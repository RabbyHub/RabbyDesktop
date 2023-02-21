import React from 'react';

import { Input, InputProps } from 'antd';
import { InputRef, TextAreaProps } from 'antd/lib/input';
import { TextAreaRef } from 'antd/lib/input/TextArea';

const NewInput = React.forwardRef<InputRef, InputProps>((props, ref) => {
  return <Input spellCheck={false} {...props} ref={ref} />;
});

const TextArea = React.forwardRef<TextAreaRef, TextAreaProps>(function (
  props,
  ref
) {
  return <Input.TextArea spellCheck={false} {...props} ref={ref} />;
});

const RabbyInput = Object.assign(NewInput, { TextArea });

export default RabbyInput;
