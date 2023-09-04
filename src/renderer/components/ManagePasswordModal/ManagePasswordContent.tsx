import { Button } from 'antd';
import React from 'react';

interface Props {
  onSetUpPassword: () => void;
  hasPassword: boolean;
}

export const ManagePasswordContent: React.FC<Props> = ({
  onSetUpPassword,
  hasPassword,
}) => {
  if (hasPassword) {
    return <section>123</section>;
  }
  return (
    <section>
      <div className="text-center mt-[70px]">
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
      <Button
        onClick={onSetUpPassword}
        className="bg-r-blue-default w-[200px] h-[48px]"
      >
        Set Up Password
      </Button>
    </section>
  );
};
