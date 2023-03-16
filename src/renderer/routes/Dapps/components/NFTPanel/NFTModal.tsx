import { Modal, Props as ModalProps } from '@/renderer/components/Modal/Modal';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Button, Tooltip } from 'antd';
import React from 'react';
import { useZoraMintFee } from './util';

interface Props extends ModalProps {
  onClose: (hash: string) => void;
}

const RowItem = ({
  label,
  value,
}: {
  label: React.ReactNode;
  value: string;
}) => {
  return (
    <div className="border-0 border-[#ffffff06] border-solid flex justify-between py-[15px]">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
};

export const NFTModal: React.FC<Props> = ({ onClose, ...props }) => {
  const [submitting, setSubmitting] = React.useState(false);
  const [hash, setHash] = React.useState('');
  const fee = useZoraMintFee();
  const onMint = React.useCallback(() => {
    setSubmitting(true);
    walletController
      .mintRabby()
      .then((result: string) => {
        setHash(result);
        onClose(result);
        setSubmitting(false);
      })
      .catch(() => {
        setSubmitting(false);
      });
  }, [onClose]);

  return (
    <Modal
      {...props}
      width={368}
      centered
      smallTitle
      onCancel={() => onClose(hash)}
    >
      <div className="flex flex-col text-white overflow-hidden rounded-[8px]">
        <img
          src="https://via.placeholder.com/500"
          className="object-cover h-[368px]"
        />

        <section className="p-[20px] space-y-[8px]">
          <h2 className="text-[16px] text-white font-bold">
            Rabby Desktop Genesis
          </h2>
          <div className="divide-y flex flex-col text-[13px]">
            <RowItem label="Amount" value="1" />
            <RowItem label="Rabby mint fee" value="Free" />
            <RowItem
              label={
                <div className="flex items-center">
                  <span>Powered by zora</span>
                  <span className="ml-[5px]">
                    <Tooltip
                      title={`A ${fee}ETH fee goes to Zora for each mint.`}
                    >
                      <img src="rabby-internal://assets/icons/add-dapp/icon-help.svg" />
                    </Tooltip>
                  </span>
                </div>
              }
              value={`${fee} ETH`}
            />
          </div>

          <Button
            loading={submitting}
            block
            type="primary"
            className="h-[50px] rounded-[8px]"
            onClick={onMint}
          >
            Mint
          </Button>
        </section>
      </div>
    </Modal>
  );
};
