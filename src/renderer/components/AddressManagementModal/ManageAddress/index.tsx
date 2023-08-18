import React, { useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import { LedgerHDPathTypeLabel } from '@/renderer/utils/ledger';
import { message } from 'antd';
import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import { useWalletTypeData } from './hooks';
import { GroupItem } from './WalletGroupItem';
import Popup from '../../Popup';
import styles from './style.module.less';
import { AccountList } from './AccountList';
import { AddressDeleteModal } from './AddressDeleteModal';
import { Modal } from '../../Modal/Modal';

interface CommonProps {
  visible: boolean;
  onCancel: () => void;
}

function DrawerC({
  children,
  visible,
  onCancel,
}: React.PropsWithChildren<CommonProps>) {
  return (
    <Popup
      width="100%"
      height={440}
      open={visible}
      placement="right"
      maskClosable
      onClose={onCancel}
      getContainer={false}
      className={styles.manageDrawer}
      push={false}
      destroyOnClose
    >
      {children}
    </Popup>
  );
}
function ModalC({
  children,
  visible,
  onCancel,
}: React.PropsWithChildren<CommonProps>) {
  return (
    <Modal
      width="400px"
      open={visible}
      maskClosable
      onCancel={onCancel}
      getContainer={false}
      className={styles.manageModal}
      destroyOnClose
      bodyStyle={{ height: 600 }}
      centered
    >
      {children}
    </Modal>
  );
}

const ManageAddress = ({
  visible,
  onCancel,
  showBack,
  useDrawer,
}: CommonProps & {
  useDrawer?: boolean;
  showBack?: boolean;
}) => {
  const location = useLocation();

  const [currentIndex, setCurrentIndex] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    return Number(searchParams.get('index') || 0);
  });

  const { accountGroup, getAllAccountsToDisplay, removeAddress } =
    useWalletTypeData();

  const [TypedWalletObj, typedWalletIdList = []] = accountGroup || [];

  const activeIndex = typedWalletIdList[currentIndex];

  const isLedger =
    TypedWalletObj?.[activeIndex]?.type === KEYRING_CLASS.HARDWARE.LEDGER;

  const [open, setOpen] = useState(false);
  const [deleteGroup, setDeleteGroup] = useState(false);

  const [deleteList, setDeleteList] = useState<IDisplayedAccountWithBalance[]>(
    []
  );

  const updateInfoAndSetCurrentIndex = useCallback(
    async (cond = true) => {
      await getAllAccountsToDisplay();
      setCurrentIndex((pre) => {
        if (cond && TypedWalletObj && typedWalletIdList.length - 1 <= pre) {
          setCurrentIndex(pre - 1);
        }
        return pre;
      });
    },
    [TypedWalletObj, typedWalletIdList, getAllAccountsToDisplay]
  );

  const handleOpenDeleteModal = useCallback(
    (list: IDisplayedAccountWithBalance[], deleteAllGroup = true) => {
      setDeleteList(list);
      setDeleteGroup(deleteAllGroup);

      setOpen(true);
    },
    []
  );

  const handleConfirmDeleteAddress = async () => {
    if (deleteList.length) {
      await Promise.all(
        deleteList.map(async (e) =>
          removeAddress([e.address, e.type, e.brandName])
        )
      );

      forwardMessageTo('main-window', 'on-deleted-account', {});
    }

    await updateInfoAndSetCurrentIndex(deleteGroup);

    setOpen(false);
    message.success({
      content: 'Deleted',
      duration: 0.5,
    });
  };

  const Container = useMemo(() => (useDrawer ? DrawerC : ModalC), [useDrawer]);

  if (currentIndex < 0) {
    return null;
  }

  return (
    <Container onCancel={onCancel} visible={visible}>
      <div className="h-full flex flex-col clsx">
        <div className="text-center text-[20px] font-medium mb-[23px] pt-20 relative">
          {!!showBack && (
            <img
              onClick={onCancel}
              src="rabby-internal://assets/icons/address-management/back.svg"
              className="w-20 absolute top-20 left-20 cursor-pointer"
            />
          )}
          <div>Manage Address</div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto px-20">
          <div className="mb-20">
            <div className="rounded-[6px] bg-white bg-opacity-[0.06] flex flex-wrap p-[3px]">
              {typedWalletIdList?.map((id, i) => {
                const item = TypedWalletObj?.[id];
                const list = item?.list;
                if (!item) {
                  return null;
                }
                return (
                  <GroupItem
                    item={list?.[0]}
                    active={i === currentIndex}
                    count={list?.length || 0}
                    onChange={() => {
                      setCurrentIndex(i);
                    }}
                    type={item?.type}
                    brandName={item?.brandName}
                  />
                );
              })}
            </div>

            {TypedWalletObj?.[activeIndex] ? (
              <div className="flex items-center justify-between mt-20 ">
                <div className="text-[17px] font-medium">
                  {TypedWalletObj?.[activeIndex]?.name}
                </div>
                <div className="flex items-center gap-16">
                  <img
                    src="rabby-internal://assets/icons/address-management/trash.svg"
                    className="cursor-pointer text-gray-content hover:text-red-forbidden"
                    onClick={() => {
                      handleOpenDeleteModal(
                        TypedWalletObj?.[activeIndex]?.list
                      );
                    }}
                  />
                </div>
              </div>
            ) : null}

            {!!isLedger && !!TypedWalletObj?.[activeIndex]?.hdPathType && (
              <div className="text-gray-content text-12 mb-4">
                HD path:{' '}
                {
                  LedgerHDPathTypeLabel[
                    TypedWalletObj[activeIndex]
                      .hdPathType as keyof typeof LedgerHDPathTypeLabel
                  ]
                }
              </div>
            )}
          </div>

          <AccountList
            list={TypedWalletObj?.[activeIndex]?.list}
            updateIndex={updateInfoAndSetCurrentIndex}
          />

          {TypedWalletObj && deleteList.length ? (
            <AddressDeleteModal
              visible={open}
              onClose={() => setOpen(false)}
              onSubmit={handleConfirmDeleteAddress}
              item={deleteList[0]}
              count={deleteList.length || 0}
            />
          ) : null}
        </div>
      </div>
    </Container>
  );
};

export default ManageAddress;
