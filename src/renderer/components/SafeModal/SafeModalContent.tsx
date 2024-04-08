import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { LoadingOutlined } from '@ant-design/icons';
import { CHAINS, Chain } from '@debank/common';
import { useRequest } from 'ahooks';
import { Form } from 'antd';
import classNames from 'classnames';
import clsx from 'clsx';
import { isValidAddress } from 'ethereumjs-util';
import React, { useState } from 'react';
import { KEYRING_TYPE } from '@/renderer/utils/constant';
import { findChain } from '@/renderer/utils/chain';
import RabbyInput from '../AntdOverwrite/Input';
import { RabbyButton } from '../Button/RabbyButton';

type Account = import('@/isomorphic/types/rabbyx').Account;

export interface Props {
  onSuccess: (accounts: Account[]) => void;
}

export const SafeModalContent: React.FC<Props> = ({ onSuccess }) => {
  const [form] = Form.useForm<{
    address: string;
    chain: Chain;
  }>();

  const onValuesChange = React.useCallback(() => {
    form.setFields([
      {
        name: 'address',
        errors: [],
      },
      {
        name: 'chain',
        errors: [],
      },
    ]);
  }, [form]);

  const [errorMessage, setErrorMessage] = useState('');

  const {
    data: chainList,
    runAsync,
    loading,
  } = useRequest(
    async (address: string) => {
      const res = await walletController.fetchGnosisChainList(address);
      if (!res.length) {
        throw new Error('This address is not a valid safe address');
      }
      return res;
    },
    {
      manual: true,
      debounceWait: 500,
      onBefore() {
        form.setFields([
          {
            name: ['address'],
            errors: [],
          },
        ]);
      },
      onError(e) {
        setErrorMessage(e.message);
      },
      onSuccess() {
        setErrorMessage('');
      },
    }
  );

  const { runAsync: handleNext, loading: isSubmiting } = useRequest(
    walletController.importGnosisAddress,
    {
      manual: true,
      onSuccess(accounts) {
        onSuccess(accounts);
      },
      onError(err) {
        setErrorMessage(err?.message || 'Not a valid address');
      },
    }
  );

  const onAdd = React.useCallback(async () => {
    const { address } = form.getFieldsValue();

    handleNext(
      address,
      (chainList || []).map((chain) => chain.network)
    );
  }, [chainList, form, handleNext]);

  const disabledSubmit = loading || !!errorMessage || !chainList?.length;

  return (
    <Form
      onValuesChange={onValuesChange}
      form={form}
      className="px-[190px] pb-[40px] h-[635px]"
      onFinish={onAdd}
    >
      <img
        className="w-[80px] h-[80px] mb-[40px] block mx-auto"
        src="rabby-internal://assets/icons/walletlogo/gnosis.svg"
        alt=""
      />
      <Form.Item
        name="address"
        className="mb-[20px]"
        validateStatus={errorMessage ? 'error' : undefined}
      >
        <RabbyInput
          placeholder="Please input Address"
          className={classNames(
            'py-[15px] px-[24px] rounded-[8px]',
            'bg-white bg-opacity-10 border  rounded-[4px]',
            'text-[15px] leading-[18px] text-white',
            errorMessage ? 'border-[#FF000080]' : 'border-[#FFFFFF1A]'
          )}
          autoFocus
          onChange={(e) => {
            const value = e.target.value;
            if (!value) {
              setErrorMessage('Please input address');
              return;
            }
            if (!isValidAddress(value)) {
              setErrorMessage('Not a valid address');
              return;
            }
            runAsync(e.target.value);
          }}
        />
      </Form.Item>
      <div>
        {loading ? (
          <div className="text-white flex gap-[6px] text-[13px] leading-[16px] items-center">
            <LoadingOutlined className="w-[16px] h-[16px]" /> Searching the
            deployed chain of this address
          </div>
        ) : (
          <>
            {errorMessage ? (
              <div className="text-13 leading-[16px] text-[#EC5151]">
                {errorMessage}
              </div>
            ) : (
              !!chainList?.length && (
                <div>
                  <div className="text-white text-13 mb-[20px] leading-[16px]">
                    This address was found deployed on {chainList?.length}{' '}
                    chains
                  </div>
                  <div className="flex flex-wrap gap-[20px]">
                    {chainList?.map((chain) => {
                      return (
                        <div
                          className="flex items-center gap-[8px] text-[15px] font-medium leading-[18px] text-white"
                          key={chain.id}
                        >
                          <img
                            src={findChain({ enum: chain.enum })?.logo}
                            alt=""
                            className="w-[20px] h-[20px]"
                          />
                          {chain.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>
      <div className="text-center absolute bottom-[100px] left-0 right-0">
        <RabbyButton
          className="w-[240px] h-[52px]"
          loading={isSubmiting}
          disabled={disabledSubmit}
          type="primary"
          htmlType="submit"
        >
          Next
        </RabbyButton>
      </div>
    </Form>
  );
};
