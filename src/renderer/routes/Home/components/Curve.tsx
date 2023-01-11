import { useMemo } from 'react';
import { AreaChart, YAxis, Area, XAxis } from 'recharts';
import styled from 'styled-components';

export type CurvePoint = {
  value: number;
  netWorth: string;
  change: string;
  isLoss: boolean;
  changePercent: string;
  timestamp: number;
};

type Curve = {
  list: CurvePoint[];
  netWorth: string;
  change: string;
  changePercent: string;
  isLoss: boolean;
  isEmptyAssets: boolean;
};

type CurveThumbnailProps = {
  className?: string;
  data?: Curve;
};

const CurveWrapper = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
`;

const CurveThumbnail = ({ data, className }: CurveThumbnailProps) => {
  const color = useMemo(() => {
    return `var(--color-${data?.isLoss ? 'red' : 'green'})`;
  }, [data]);

  return (
    <CurveWrapper className={className}>
      <AreaChart data={data?.list} width={460} height={100}>
        <defs>
          <linearGradient id="curveThumbnail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="timestamp"
          hide
          type="number"
          domain={['dataMin', 'dataMax']}
        />
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Area
          type="linear"
          dataKey="value"
          stroke={color}
          fill="url(#curveThumbnail)"
        />
      </AreaChart>
    </CurveWrapper>
  );
};

export default CurveThumbnail;
