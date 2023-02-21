import { message } from 'antd';
import { useCallback } from 'react';
import { useCopyToClipboard } from 'react-use';

export const useCopyAddress = () => {
  const [, copyToClipboard] = useCopyToClipboard();

  const copy = useCallback(
    (address: string) => {
      copyToClipboard(address);
      message.success({
        duration: 3,
        icon: <i />,
        content: (
          <div>
            <div className="flex gap-[6px] mb-[6px] font-500 text-green">
              <img
                src="rabby-internal://assets/icons/common/success.svg"
                alt=""
              />
              Copied:
            </div>
            <div className="text-white">{address}</div>
          </div>
        ),
      });
    },
    [copyToClipboard]
  );

  return copy;
};
