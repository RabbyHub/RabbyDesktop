import React from 'react';

export type MainWindowRouteData =
  | {
      noDefaultHeader?: boolean;

      title?: React.ReactNode;
      floatingAccountComponent?: boolean;

      routeCSSKeyword?: string;

      backable?: boolean;
    }
  | undefined;
