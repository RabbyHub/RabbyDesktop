import React from 'react';

export type MainWindowRouteData =
  | {
      noDefaultHeader?: boolean;

      title?: React.ReactNode;
      floatingAccountComponent?: boolean;

      routeCSSKeyword?: string;

      headerBlockClassName?: string;
      pageTitleClassName?: string;

      backable?: boolean;
    }
  | undefined;
