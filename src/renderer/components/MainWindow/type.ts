import React from 'react';

export type MainWindowRouteData =
  | {
      title?: React.ReactNode;
      useAccountComponent?: boolean;
    }
  | undefined;
