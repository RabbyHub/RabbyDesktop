import { ReactNode, useMemo } from 'react';
import { Transition } from 'react-transition-group';
import { cloneDeep } from 'lodash';

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
  activeOpacity = 1,
  ...rest
}: {
  visible: boolean;
  children?: ReactNode;
  style?: React.CSSProperties;
  className?: string;
  unmountOnExit?: boolean;
  activeOpacity?: number;
}) => {
  const tStyles = useMemo(() => {
    const final = cloneDeep(hideTransitionStyles);
    final.entering.opacity = activeOpacity;
    final.entered.opacity = activeOpacity;
    return final;
  }, [activeOpacity]);

  return (
    <Transition
      unmountOnExit={unmountOnExit}
      in={visible}
      timeout={hideTransitionDuration}
    >
      {(state) => (
        <div {...rest} style={tStyles[state]}>
          {children}
        </div>
      )}
    </Transition>
  );
};

export default Hide;
