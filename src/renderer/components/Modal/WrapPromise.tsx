import React from 'react';

import { createRoot } from 'react-dom/client';
import { randString } from '@/isomorphic/string';
import { ModalProps } from 'antd';

import '@/renderer/utils/i18n';

// eslint-disable-next-line @typescript-eslint/ban-types
export type WrappedComponentProps<MERGE = {}, CTX = {}> = {
  onFinished(...args: any[]): void;
  onCancel?: ModalProps['onCancel'];
} & (CTX extends void
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : {
      onFinished(ctx: CTX): void;
    }) &
  MERGE;

// eslint-disable-next-line @typescript-eslint/ban-types
type FunctionalComponent<P = {}> = ((p: P) => JSX.Element | null) | React.FC<P>;

export const wrapModalPromise = <T extends WrappedComponentProps>(
  Component: FunctionalComponent<T>
) =>
  function (props: T) {
    return new Promise<void>((resolve, reject) => {
      const div = document.createElement('div');
      div.className = `modal-root-${randString()}`;
      document.body.appendChild(div);

      const removeNode = () => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        rootNode.unmount();
        div.parentElement?.removeChild(div);
      };

      const handleCancel = () => {
        setTimeout(removeNode, 100);
        reject();
      };

      const WrappedComponent = (wprops: T) => {
        return (
          <Component
            {...wprops}
            onFinished={(...args) => {
              removeNode();
              // eslint-disable-next-line react/destructuring-assignment
              wprops.onFinished?.(...args);
            }}
          />
        );
      };

      const rootNode = createRoot(div);
      rootNode.render(
        <WrappedComponent
          {...props}
          container={div}
          onOk={resolve as () => void}
          onCancel={handleCancel}
          open
        />
      );
    });
  };
