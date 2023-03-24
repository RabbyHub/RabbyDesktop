// eslint-disable-next-line @typescript-eslint/ban-types
type ChannelPushToWebContents = {
  '__internal_push:app:prompt-init': {
    promptId: string;
    data?: {
      message?: string;
      originSite?: string;
      initInput?: string;
    };
  };
};
