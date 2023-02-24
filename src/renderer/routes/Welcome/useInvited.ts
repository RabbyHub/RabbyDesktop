import React from 'react';
import Axios from 'axios';
import { atom, useAtom } from 'jotai';

const IS_INVITED = 'IS_INVITED';
const isInvitedAtom = atom(false);

export const useInvited = () => {
  const [isInvited, setIsInvited] = useAtom(isInvitedAtom);

  const getStatus = React.useCallback(() => {
    const status = localStorage.getItem(IS_INVITED);
    setIsInvited(!!status);
  }, [setIsInvited]);

  const checkInviteCode = React.useCallback(
    async (code: string) => {
      const { data } = await Axios.get<{ is_valid: boolean }>(
        `https://api.rabby.io/promotion/invitation?id=${code}`
      );
      if (data?.is_valid) {
        localStorage.setItem(IS_INVITED, 'true');
        setIsInvited(true);
      }

      return data?.is_valid;
    },
    [setIsInvited]
  );

  React.useEffect(() => {
    getStatus();
  }, [getStatus]);

  return {
    isInvited,
    checkInviteCode,
  };
};
