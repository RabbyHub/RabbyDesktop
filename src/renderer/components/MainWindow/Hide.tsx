import { ReactNode } from 'react';
import { Transition } from 'react-transition-group';
import styled from 'styled-components';

const hideTransitionDuration = 200;

const hideTransitionStyles = {
  entering: {
    opacity: 1,
    transition: `opacity ${hideTransitionDuration}ms`,
  },
  entered: {
    opacity: 1,
  },
  exiting: {
    opacity: 0,
    transition: `opacity ${hideTransitionDuration}ms`,
  },
  exited: {
    opacity: 0,
    width: 0,
  },
  unmounted: {},
};

const Hide = ({
  visible,
  children,
  unmountOnExit,
  ...rest
}: {
  visible: boolean;
  children?: ReactNode;
  style?: React.CSSProperties;
  className?: string;
  unmountOnExit?: boolean;
}) => (
  <Transition
    unmountOnExit={unmountOnExit}
    in={visible}
    timeout={hideTransitionDuration}
  >
    {(state) => (
      <div {...rest} style={hideTransitionStyles[state]}>
        {children}
      </div>
    )}
  </Transition>
);

export default Hide;
