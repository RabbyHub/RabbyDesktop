import React from 'react';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import { Modal } from '../Modal/Modal';
import { ManagePasswordContent } from './ManagePasswordContent';
import { SetUpPasswordContent } from './SetUpPasswordContent';

export const ManagePasswordModal: React.FC = () => {
  const { svVisible, closeSubview } = useZPopupViewState('manage-password');
  const [view, setView] = React.useState<'manage-password' | 'set-up-password'>(
    'manage-password'
  );
  const title = React.useMemo(() => {
    switch (view) {
      case 'manage-password':
        return 'Manage Password';

      case 'set-up-password':
      default:
        return 'Set Up Password';
    }
  }, [view]);

  return (
    <Modal
      width={480}
      title={title}
      smallTitle
      open={svVisible}
      onCancel={closeSubview}
    >
      {view === 'manage-password' && (
        <ManagePasswordContent
          onSetUpPassword={() => setView('set-up-password')}
          hasPassword={false}
        />
      )}
      {view === 'set-up-password' && (
        <SetUpPasswordContent
          onCancel={() => setView('manage-password')}
          onConfirm={() => setView('manage-password')}
        />
      )}
    </Modal>
  );
};
