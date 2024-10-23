/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { Modal } from '@/renderer/components/Modal/Modal';
import { RevokeTable, RevokeTableProps } from './RevokeTable';
import { findIndexRevokeList } from '../../utils';
import { BatchRevokeTaskType } from './useBatchRevokeTask';

export const useBatchRevokeModal = ({
  revokeList,
  dataSource,
  ...props
}: Omit<RevokeTableProps, 'onTaskStatus'>) => {
  const [visible, setVisible] = React.useState(false);
  const maskClosableRef = React.useRef(true);
  const needUpdateRef = React.useRef(false);

  const show = React.useCallback(() => {
    setVisible(true);
  }, []);

  const filteredDataSource = React.useMemo(
    () =>
      dataSource.filter((record) => {
        return (
          findIndexRevokeList(revokeList, {
            item: record.$assetContract!,
            spenderHost: record.$assetToken!,
            assetApprovalSpender: record,
          }) > -1
        );
      }),
    [revokeList, dataSource]
  );

  const handleTaskStatus = React.useCallback(
    (status: BatchRevokeTaskType['status']) => {
      if (status === 'idle') {
        maskClosableRef.current = true;
        needUpdateRef.current = false;
      } else if (status === 'completed') {
        maskClosableRef.current = true;
        needUpdateRef.current = true;
      } else {
        maskClosableRef.current = false;
      }
    },
    []
  );

  const handleCancel = React.useCallback(() => {
    if (maskClosableRef.current) {
      setVisible(false);
      props.onClose(needUpdateRef.current);
    }
  }, []);

  const node = React.useMemo(() => {
    return (
      <Modal
        open={visible}
        className="confirm-revoke-modal revoke-list"
        closable={false}
        maskClosable
        centered
        width={964}
        okCancel={false}
        destroyOnClose
        onCancel={handleCancel}
      >
        <RevokeTable
          {...props}
          onTaskStatus={handleTaskStatus}
          dataSource={filteredDataSource}
          revokeList={revokeList}
          onDone={() => {
            props.onDone();
            setVisible(false);
          }}
          onClose={(_needUpdate) => {
            props.onClose(_needUpdate);
            setVisible(false);
          }}
        />
      </Modal>
    );
  }, [visible]);

  return {
    show,
    node,
  };
};
