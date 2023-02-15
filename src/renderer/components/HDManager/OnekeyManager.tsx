import React from 'react';
import { TrezorManager, Props } from './TrezorManager';

export const OneKeyManager: React.FC<Props> = (props) => {
  return <TrezorManager {...props} HDName="OneKey" />;
};
