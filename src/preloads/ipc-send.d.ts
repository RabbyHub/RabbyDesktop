type ChannelSendSyncPayload = {
  '__internal_rpc:app:prompt-open': {
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
  '__internal_rpc:app:request-tab-mutex': {
    send: [];
    returnValue: {
      windowExisted: boolean;
      // mutextId: string;
    };
  };
};

type ISendSyncKey = keyof ChannelSendSyncPayload;
