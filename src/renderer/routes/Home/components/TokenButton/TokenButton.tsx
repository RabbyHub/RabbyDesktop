import clsx from 'clsx';
import React from 'react';
import { Modal } from '@/renderer/components/Modal/Modal';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { useAtom } from 'jotai';
import { visibleTokenListAtom } from '@/renderer/components/TokenActionModal/TokenActionModal';
import { TokenTable } from '../TokenTable/TokenTable';

export interface Props {
  label: string;
  onClickLink: () => void;
  tokens?: TokenItem[];
  linkText?: string;
  description?: string;
  hiddenSubTitle?: boolean;
}

export const TokenButton: React.FC<Props> = ({
  label,
  tokens,
  onClickLink,
  linkText,
  description,
  hiddenSubTitle,
}) => {
  const [visible, setVisible] = React.useState(false);
  const len = tokens?.length ?? 0;
  const [visibleTokenList, setVisibleTokenList] = useAtom(visibleTokenListAtom);

  const handleClickLink = React.useCallback(() => {
    setVisible(false);
    onClickLink();
  }, [onClickLink]);

  React.useEffect(() => {
    setVisibleTokenList(visible);
  }, [visible, setVisibleTokenList]);

  React.useEffect(() => {
    if (!visibleTokenList) {
      setVisible(false);
    }
  }, [visibleTokenList]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setVisible(true)}
        className={clsx(
          'rounded-[2px] p-6',
          'text-12 bg-[#FFFFFF0F] text-[#D3D8E0]',
          'flex items-center',
          'gap-2',
          'hover:opacity-60',
          'border-none outline-none',
          'cursor-pointer'
        )}
      >
        <span>{len}</span>
        <span>{label}</span>
        <img
          src="rabby-internal://assets/icons/home/expand-arrow.svg"
          className="w-[14px] h-[5px] transform rotate-90"
        />
      </button>

      <Modal
        bodyStyle={{ height: hiddenSubTitle ? 427 : 405, padding: '0 20px 0' }}
        width={400}
        open={visible}
        onCancel={() => setVisible(false)}
        title={`${len} ${label}`}
        smallTitle
        centered
        subtitle={
          !hiddenSubTitle && (
            <div className="text-[13px] text-r-neutral-foot leading-[16px]">
              The token in this list will not be added to total balance
            </div>
          )
        }
      >
        <TokenTable
          list={tokens}
          EmptyComponent={
            <div className="space-y-24 text-13 text-center mt-[100px]">
              <img
                src="rabby-internal://assets/icons/home/low-value-empty.svg"
                className="w-[52px] h-[52px] m-auto"
              />
              <div className="text-[#BABEC5]">{description}</div>
              {linkText ? (
                <div
                  onClick={handleClickLink}
                  className="text-[#7084FF] underline cursor-pointer"
                >
                  {linkText}
                </div>
              ) : null}
            </div>
          }
        />
      </Modal>
    </div>
  );
};
