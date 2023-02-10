import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styles from './index.module.less';

interface Point {
  x: number;
  y: number;
}

export const calculateDeltas = (
  startPoint: Point,
  endPoint: Point
): {
  dx: number;
  dy: number;
  absDx: number;
  absDy: number;
} => {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  return { dx, dy, absDx, absDy };
};

const calculateFixedLineInflectionConstant = (absDx: number, absDy: number) => {
  const WEIGHT_X = 8;
  const WEIGHT_Y = 2;

  return Math.round(Math.sqrt(absDx) * WEIGHT_X + Math.sqrt(absDy) * WEIGHT_Y);
};

export const calculateControlPoints = ({
  absDx,
  absDy,
  dx,
  dy,
}: {
  absDx: number;
  absDy: number;
  dx: number;
  dy: number;
}): {
  p1: Point;
  p2: Point;
  p3: Point;
  p4: Point;
} => {
  const offset = 8;
  let startPointX = offset;
  let startPointY = offset;
  let endPointX = absDx - offset;
  let endPointY = absDy - offset;
  if (dx < 0) [startPointX, endPointX] = [endPointX, startPointX];
  if (dy < 0) [startPointY, endPointY] = [endPointY, startPointY];

  // const fixedLineInflectionConstant = 200; // We will calculate this value dynamically in next step
  const fixedLineInflectionConstant = calculateFixedLineInflectionConstant(
    absDx,
    absDy
  );

  const p1 = {
    x: startPointX,
    y: startPointY,
  };
  const p2 = {
    x: startPointX + fixedLineInflectionConstant / 10,
    y: startPointY + fixedLineInflectionConstant,
  };
  const p3 = {
    x: endPointX - fixedLineInflectionConstant / 4,
    y: endPointY - fixedLineInflectionConstant,
  };
  const p4 = {
    x: endPointX,
    y: endPointY,
  };

  return { p1, p2, p3, p4 };
};

interface ArrowProps {
  startPoint: Point;
  endPoint: Point;
  className?: string;
}
const Arrow = ({ startPoint, endPoint, className }: ArrowProps) => {
  const { absDx, absDy, dx, dy } = calculateDeltas(startPoint, endPoint);
  const { p1, p2, p3, p4 } = calculateControlPoints({
    dx,
    dy,
    absDx,
    absDy,
  });
  const arrowHeadEndingSize = 16;

  return (
    <svg width={absDx + 10} height={absDy + 10} className={className}>
      <g opacity={0.2}>
        <path
          d={`
          M 
            ${p1.x}, ${p1.y} 
          C 
            ${p2.x}, ${p2.y} 
            ${p3.x}, ${p3.y} 
            ${p4.x}, ${p4.y} 
        `}
          stroke="white"
          fill="none"
          strokeWidth={4}
        />
        <circle
          xmlns="http://www.w3.org/2000/svg"
          cx="8"
          cy="8"
          r="8"
          fill="white"
          stroke="black"
          strokeOpacity={0.28}
          strokeWidth={4}
        />

        <path
          d={`
            M ${p4.x} ${p4.y}
            L ${p4.x - arrowHeadEndingSize} ${p4.y - arrowHeadEndingSize / 2}
            Z
            M ${p4.x} ${p4.y}
            L ${p4.x + (arrowHeadEndingSize / 5) * 2} ${
            p4.y - arrowHeadEndingSize
          }
            Z
          `}
          fill="white"
          stroke="white"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

export const Empty = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [endPoint, setEndPoint] = useState({
    x: 200,
    y: 200,
  });

  const handleLayout = useCallback(() => {
    const end = document.body.getBoundingClientRect();
    const start = ref.current?.getBoundingClientRect();
    if (!start) {
      return;
    }

    const point = {
      x: end.left + end.width - (start.left + start.width) - 48,
      y: end.top + end.height - (start.top + start.height) - 130,
    };
    setEndPoint(point);
  }, []);

  useLayoutEffect(() => {
    handleLayout();
  }, [handleLayout]);

  useEffect(() => {
    window.addEventListener('resize', handleLayout);
    return () => {
      window.removeEventListener('resize', handleLayout);
    };
  }, [handleLayout]);

  return (
    <div className={styles.empty} ref={ref}>
      <div className={styles.emptyTitle}>
        Add Dapp and start your web3 journey
      </div>
      <div className={styles.emptyDesc}>
        Click the plus sign in the lower left corner to start adding your first
        Dapp
      </div>
      <Arrow
        startPoint={{ x: 0, y: 0 }}
        endPoint={endPoint}
        className={styles.arrow}
      />
    </div>
  );
};
