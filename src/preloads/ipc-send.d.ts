type ChannelSendSyncPayload = {
  [C in `__internal_rpc:app:prompt-open`]: {
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
};

type ISendSyncKey = keyof ChannelSendSyncPayload;
