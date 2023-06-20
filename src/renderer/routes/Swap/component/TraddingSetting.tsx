import { useState } from 'react';
import clsx from 'clsx';
import { Button } from 'antd';
import { Switch } from '@/renderer/components/Switch/Switch';
import { Modal } from '@/renderer/components/Modal/Modal';
import { Checkbox } from '@/renderer/components/Checkbox';
import IconSwapSetting from '@/../assets/icons/swap/setting.svg?rc';
import { CEX, DEX } from '../constant';
import { useSwapSettings } from '../hooks';

const list = [...Object.values(DEX), ...Object.values(CEX)] as {
  id: keyof typeof DEX | keyof typeof CEX;
  logo: string;
  name: string;
  chains: CHAINS_ENUM[];
}[];

function EnableTrading({ onConfirm }: { onConfirm: () => void }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="px-16 text-white">
      <div className="relative mt-20 mb-20  text-20 font-medium text-center ">
        Enable Trading
      </div>
      <div className="text-13 leading-[18px]">
        <p>
          1. Once enabled, you will interact with the contract from the exchange
          directly
        </p>
        <p>
          2. Rabby is not liable for any risks arising from the contract of the
          exchanges
        </p>
      </div>
      <div className="flex flex-col justify-center items-center gap-16 mt-[30px]">
        <Checkbox
          checked={checked}
          onChange={setChecked}
          unCheckBackground="transparent"
          checkIcon={
            !checked ? (
              <div className="bg-transparent border border-white border-solid w-14 h-14 rounded-full" />
            ) : null
          }
        >
          I understand and accept it
        </Checkbox>

        <Button
          type="primary"
          block
          disabled={!checked}
          className="h-[40px] w-[200px] text-13 font-medium mx-auto rounded-[4px]"
          onClick={onConfirm}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}

export const TradingSettingList = () => {
  const { swapViewList, swapTradeList, setSwapView, setSwapTrade } =
    useSwapSettings();

  const [open, setOpen] = useState(false);

  const [id, setId] = useState<Parameters<typeof setSwapTrade>[0][0]>();

  const onConfirm = () => {
    if (id) {
      setSwapTrade([id, true]);
      setOpen(false);
    }
  };

  return (
    <div>
      <div>
        <div className="flex items-center text-white text-opacity-70 text-12 pb-8 whitespace-nowrap">
          <div className="w-[200px]">Exchanges</div>
          <div className="w-[66px]">View quotes</div>
          <div className="ml-auto mr-12">Trade</div>
        </div>

        <div className="flex flex-col gap-16">
          {list.map((item) => {
            return (
              <div
                className={clsx(
                  'flex items-center h-[48px] rounded-[6px] px-12 py-12',
                  'border border-solid border-white border-opacity-10'
                )}
                key={item.name}
              >
                <div className="flex items-center gap-8 w-[200px]">
                  <img
                    src={item.logo}
                    className="w-[24px] h-[24px] rounded-full"
                  />
                  <span className="text-15 text-white font-medium ">
                    {item.name}
                  </span>
                  <span
                    className={clsx(
                      'text-12 text-white opacity-30 rounded-[2px] px-[4px] py-[1px]',
                      'border-[0.5px] border-solid border-white'
                    )}
                  >
                    {item?.chains ? 'Dex' : 'Cex'}
                  </span>
                </div>
                <div className="w-[66px] flex items-center justify-end pr-12">
                  <Switch
                    checked={swapViewList?.[item.id] ?? true}
                    onChange={(checked) => {
                      setSwapView([item.id, checked]);
                      if (!checked && item.id in DEX) {
                        setSwapTrade([item.id, checked]);
                      }
                    }}
                  />
                </div>
                <div className="ml-auto flex items-center">
                  <Switch
                    disabled={
                      swapViewList?.[item.id] === false || !!(item.id in CEX)
                    }
                    checked={!!swapTradeList?.[item.id]}
                    onChange={(checked) => {
                      if (checked) {
                        setId(item.id);
                        setOpen(true);
                      } else {
                        setSwapTrade([item.id, checked]);
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Modal
        bodyStyle={{
          height: 280,
        }}
        width={360}
        centered
        visible={open}
        title={null}
        footer={null}
        destroyOnClose
        onCancel={() => {
          setOpen(false);
        }}
        smallTitle
      >
        <EnableTrading onConfirm={onConfirm} />
      </Modal>
    </div>
  );
};

export const TradingSetting = () => {
  const { swapSettingVisible, setSwapSettingVisible } = useSwapSettings();

  return (
    <>
      <IconSwapSetting
        className="w-20 h-20 cursor-pointer"
        onClick={() => {
          setSwapSettingVisible(true);
        }}
      />
      <Modal
        width={400}
        destroyOnClose
        centered
        open={swapSettingVisible}
        onCancel={() => {
          setSwapSettingVisible(false);
        }}
        title="Enable Exchanges"
        smallTitle
        closable
        bodyStyle={{
          padding: '0 20px 20px 20px',
        }}
      >
        <TradingSettingList />
      </Modal>
    </>
  );
};
