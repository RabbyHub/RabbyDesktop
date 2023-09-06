import { Button } from 'antd';
import { useManagePasswordUI } from './useManagePassword';

export function HaveSetupPassword() {
  const { setManagePwdView } = useManagePasswordUI();

  return (
    <section className="manage-password-content has-password pt-[70px] pl-40 pr-40">
      <div className="text-center">
        <img
          src="rabby-internal://assets/icons/password/has-password.svg"
          className="mb-20"
        />
        <h2 className="text-r-neutral-title-2 text-15">
          Password successfully set up
        </h2>
      </div>
      <div className="mt-[94px] w-[100%] gap-24 flex justify-center">
        <Button
          className="flex-shrink-1 w-[100%] h-[48px] rabby-antd-default-button"
          type="default"
          ghost
          onClick={() => setManagePwdView('change-password')}
        >
          Change Password
        </Button>
        <Button
          className="flex-shrink-1 w-[100%] h-[48px] rabby-antd-default-button"
          type="default"
          ghost
          onClick={() => setManagePwdView('cancel-password')}
        >
          Cancel Password
        </Button>
      </div>
    </section>
  );
}

export function HaventSetupPassWord() {
  const { setManagePwdView } = useManagePasswordUI();

  return (
    <section className="manage-password-content pt-[70px] pb-[40px] h-[100%] flex flex-col justify-between items-center">
      <div className="text-center">
        <img
          src="rabby-internal://assets/icons/password/no-password.svg"
          className="mb-20"
        />
        <h2 className="text-r-neutral-title-2 text-15 mb-8">
          No password currently
        </h2>
        <p className="text-r-neutral-foot text-13">
          Set up a password to lock the app and secure your data
        </p>
      </div>
      <div className="w-[100%] flex justify-center">
        <Button
          onClick={() => {
            setManagePwdView('setup-password');
          }}
          type="primary"
          className="bg-r-blue-default w-[200px] h-[48px] shadow-none mx-0 my-auto rounded-[4px]"
        >
          Set Up Password
        </Button>
      </div>
    </section>
  );
}
