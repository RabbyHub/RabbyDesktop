import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { AreaChart, YAxis, Area, XAxis, Tooltip } from 'recharts';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { Modal } from '@/renderer/components/Modal/Modal';

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
  z-index: 1;
  width: 430px;
  -webkit-mask-image: -webkit-gradient(
    linear,
    left top,
    right top,
    from(rgba(255, 255, 255, 0.15)),
    to(rgba(255, 255, 255, 0.8))
  );

  &:hover {
    -webkit-mask-image: -webkit-gradient(
      linear,
      left top,
      right top,
      from(rgba(255, 255, 255, 0.4)),
      to(rgba(255, 255, 255, 1))
    );
  }
`;

const CurveThumbnail = ({ data, className }: CurveThumbnailProps) => {
  const color = useMemo(() => {
    return `var(--color-${data?.isLoss ? 'red' : 'green'})`;
  }, [data]);
  const divRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(92);

  useEffect(() => {
    if (divRef.current) {
      setHeight(divRef.current.clientHeight);
    }
  }, []);

  return (
    <CurveWrapper ref={divRef} className={className}>
      <AreaChart
        data={data?.list}
        width={430}
        height={height}
        style={{ position: 'absolute', right: 0, cursor: 'pointer' }}
      >
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
        <YAxis
          hide
          domain={[
            (dataMin: number) => dataMin * 0.98,
            (dataMax: number) => dataMax * 1.005,
          ]}
        />
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

type CurveModalProps = {
  onClose(): void;
} & CurveThumbnailProps;

const CurveModalWrapper = styled.div`
  padding: 16px;
  border-radius: 6px;
  .legendTitle {
    margin-bottom: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #fff;
  }
  .assets {
    margin-bottom: 4px;
    font-size: 26px;
    font-weight: 700;
    color: #fff;
  }
  .assetsChange {
    margin-bottom: 32px;
    font-size: 14px;
    font-weight: 50000;
  }
  .assetsChangePercent {
    margin-right: 6px;
  }
  .xaxis {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    font-size: 12px;
    font-weight: 400;
  }
`;

export const CurveModal = ({ data, className, onClose }: CurveModalProps) => {
  const [activePointer, setActivePointer] = useState<CurvePoint>();

  const color = useMemo(() => {
    return `var(--color-${data?.isLoss ? 'red' : 'green'})`;
  }, [data]);

  const [startTime, endTime] = useMemo(() => {
    return data?.list?.length
      ? [
          dayjs.unix(data.list[0].timestamp).format('MM-DD HH:mm'),
          dayjs
            .unix(data.list[data.list.length - 1].timestamp)
            .format('MM-DD HH:mm'),
        ]
      : [];
  }, [data]);

  const handleMouseMove = useCallback((nextState: any) => {
    const pointer = nextState.activePayload?.[0]?.payload;
    setActivePointer(pointer);
  }, []);

  const resetActivePoint = useCallback(() => {
    setActivePointer(undefined);
  }, []);

  const legendPoint = useMemo(
    () => activePointer || data,
    [activePointer, data]
  );

  return (
    <Modal
      onCancel={onClose}
      open
      width="742px"
      className="curve-modal inherit"
      footer={null}
      centered
    >
      <CurveModalWrapper className={className}>
        <div className="legend">
          <div className="legendTitle">
            {activePointer
              ? dayjs.unix(activePointer.timestamp).format('MM-DD HH:mm')
              : 'Net Worth'}
          </div>
          <div className="assets">{legendPoint?.netWorth}</div>
          <div
            className="assetsChange"
            style={{
              color: `var(--color-${legendPoint?.isLoss ? 'red' : 'green'})`,
            }}
          >
            <span className="assetsChangePercent">
              {legendPoint?.isLoss ? '-' : '+'}
              {legendPoint?.changePercent}
            </span>
            ({legendPoint?.change})
          </div>
        </div>
        <AreaChart
          data={data?.list}
          width={662}
          height={200}
          onMouseMove={handleMouseMove}
          onMouseLeave={resetActivePoint}
        >
          <defs>
            <linearGradient id="curveModalColor" x1="0" y1="0" x2="0" y2="1">
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
          <YAxis
            hide
            domain={[
              (dataMin: number) => dataMin * 0.98,
              (dataMax: number) => dataMax * 1.005,
            ]}
          />
          <Tooltip
            cursor={{ strokeDasharray: 4 }}
            contentStyle={{ display: 'none' }}
          />
          <Area
            type="linear"
            dataKey="value"
            stroke={color}
            fill="url(#curveModalColor)"
          />
        </AreaChart>
        <div className="xaxis">
          <div className="xaxisLabel">{startTime}</div>
          <div className="xaxisLabel">{endTime}</div>
        </div>
      </CurveModalWrapper>
    </Modal>
  );
};

export default CurveThumbnail;
