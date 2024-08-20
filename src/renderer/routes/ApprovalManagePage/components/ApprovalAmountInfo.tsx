import { formatNumber } from '@/renderer/utils/number';
import { Tooltip } from 'antd';
import clsx from 'clsx';
import { useMemo } from 'react';

export default function ApprovalAmountInfo({
  className,
  amountValue,
  balanceNumText,
  balanceUnitText,
  minWidthLimit,
}: {
  className?: string;
  amountValue: string | number;
  balanceNumText: string | number;
  balanceUnitText: string;
  minWidthLimit?: boolean;
}) {
  const amountText = useMemo(() => {
    if (typeof amountValue !== 'number') return amountValue;

    return formatNumber(amountValue);
  }, [amountValue]);

  const balanceText = useMemo(() => {
    return `${balanceNumText} ${balanceUnitText}`;
  }, [balanceNumText, balanceUnitText]);

  return (
    <div
      className={clsx(
        'approval-amount-info text-right flex flex-col justify-center',
        className
      )}
    >
      {amountText && (
        <div>
          <Tooltip
            overlayClassName="J-modal-item__tooltip disable-ant-overwrite"
            overlay="Approved Amount"
            align={{ offset: [0, 3] }}
            arrowPointAtCenter
          >
            <span className="text-12 font-medium text-r-neutral-body">
              {amountText}
            </span>
          </Tooltip>
        </div>
      )}

      {balanceText && (
        <Tooltip
          overlayClassName={clsx(
            'J-modal-item__tooltip disable-ant-overwrite',
            minWidthLimit && 'min-width-limit'
          )}
          overlay="My Balance"
          align={{ offset: [0, 3] }}
          arrowPointAtCenter
        >
          <div className="text-12 font-nomral text-r-neutral-foot inline-flex justify-end">
            <span className="whitespace-pre max-w-[8em] overflow-hidden overflow-ellipsis flex-shrink-1">
              {balanceNumText}
            </span>
            <span className="flex-shrink-0">{balanceUnitText}</span>
          </div>
        </Tooltip>
      )}
    </div>
  );
}
