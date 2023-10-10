type ChannelSendSyncPayload = {
  '__outer_rpc:app:prompt-open': {
    send: [
      params: {
        callerURL: string;
        message?: string;
        defaultContent?: string;
      }
    ];
    returnValue: {
      promptId: string;
      value: string | null;
    };
  };
  '__outer_rpc:app:request-tab-mutex': {
    send: [];
    returnValue: {
      windowExisted: boolean;
      // mutextId: string;
    };
  };
  '__internal_rpc:dapp:get-dapp-by-url': {
    send: [params: { dappURL: string }];
    returnValue: {
      dapp?: IDapp | null;
    };
  };
};

type IpcMainSendSyncEvent<RT> = Omit<
  Electron.IpcMainEvent,
  'returnValue' | 'reply'
> & {
  returnValue: RT;
};

type ISendSyncKey = keyof ChannelSendSyncPayload;
