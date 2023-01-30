import { OpenApiService } from '@debank/rabby-api';
import { Button, Input } from 'antd';
import React from 'react';
import useDebounceValue from '@/renderer/hooks/useDebounceValue';
import { isValidAddress } from 'ethereumjs-util';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useWalletRequest } from '@/renderer/hooks/useWalletRequest';
import { useAccountToDisplay } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useAddressManagement } from '@/renderer/hooks/rabbyx/useAddressManagement';
import styles from './AddAddressModal.module.less';

type ENS = Awaited<ReturnType<OpenApiService['getEnsAddressByName']>>;

interface Props {
  onSuccess: (address: string) => void;
}

export const ContactModalContent: React.FC<Props> = ({ onSuccess }) => {
  const [ens, setEns] = React.useState<ENS>();
  const [input, setInput] = React.useState<string>();
  const [value, setValue] = React.useState<string>();
  const debounceInput = useDebounceValue(input, 150);
  const [tags, setTags] = React.useState<string[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const [locked, setLocked] = React.useState<boolean>(false);

  const handleInput = React.useCallback(async (address?: string) => {
    setTags([]);
    setEns(undefined);
    setLocked(true);
    if (address && !isValidAddress(address)) {
      try {
        const result = await walletOpenapi.getEnsAddressByName(address);
        if (result?.addr) {
          setEns(result);
        }
      } catch (e) {
        setEns(undefined);
      }
    }
    setLocked(false);
  }, []);

  const handleConfirmENS = React.useCallback((data: ENS) => {
    setValue(data.addr);
    setTags([data.name]);
    setEns(undefined);
  }, []);

  const handleEnter = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (ens) {
        e.preventDefault();
        setErrorMessage(undefined);
        handleConfirmENS(ens);
      }
    },
    [ens, handleConfirmENS]
  );

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
      setValue(e.target.value);
      setErrorMessage(undefined);
    },
    []
  );
  const { getAllAccountsToDisplay } = useAccountToDisplay();
  const { getHighlightedAddressesAsync } = useAddressManagement();
  const [run, loading] = useWalletRequest(walletController.importWatchAddress, {
    async onSuccess(accounts) {
      setLocked(true);
      await Promise.all([
        getHighlightedAddressesAsync(),
        getAllAccountsToDisplay(),
      ]);
      onSuccess(accounts[0].address);
      setLocked(false);
    },
    onError(err) {
      setErrorMessage(err.message ?? 'Not a valid address');
    },
  });

  const buttonLoading = loading || locked || input !== debounceInput;

  const onSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (value) {
        run(value);
      }
    },
    [run, value]
  );

  React.useEffect(() => {
    handleInput(debounceInput);
  }, [debounceInput, handleInput]);

  return (
    <form onSubmit={onSubmit} className={styles.ContactModalContent}>
      <div className={styles.inputWrap}>
        <Input
          className={styles.input}
          autoFocus
          value={value}
          onChange={onChange}
          placeholder="ENS/address"
          maxLength={44}
          spellCheck={false}
          onPressEnter={handleEnter}
          suffix={
            ens ? (
              <img
                src="rabby-internal://assets/icons/add-address/right.svg"
                className="icon icon-checked"
              />
            ) : null
          }
        />

        {errorMessage && <div className={styles.error}>{errorMessage}</div>}

        {tags.length > 0 && (
          <div className={styles.tagGroup}>
            {tags.map((tag) => (
              <span className={styles.tag} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {ens && (
          <div className={styles.ens} onClick={() => handleConfirmENS(ens)}>
            <span className={styles.text}>{ens.addr}</span>
            <img
              className={styles.icon}
              src="rabby-internal://assets/icons/add-address/enter.svg"
            />
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button
          loading={buttonLoading}
          disabled={buttonLoading}
          htmlType="submit"
          block
          size="large"
          className={styles.button}
          type="primary"
        >
          Add
        </Button>
      </div>
    </form>
  );
};
