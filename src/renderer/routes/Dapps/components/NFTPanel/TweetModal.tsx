import { Modal, Props as ModalProps } from '@/renderer/components/Modal/Modal';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { Button } from 'antd';
import React from 'react';

const TWEET_CONTENT = [
  `🤩  I just claimed my 'Rabby Desktop Genesis' NFT`,
  `⬇️  To join the FREE mint whitelist Visit https://rabby.io?platform=desktop to download Rabby Desktop Beta now.`,
  `#RabbyDesktop--a dedicated client for Dapp security. @Rabby_io`,
];
const COLORFUL_TWEET_HTML = TWEET_CONTENT.map((item) => {
  return item
    .replace(/#[\w]+/g, (match) => {
      return `<span class="text-blue-light">${match}</span>`;
    })
    .replace(/@[\w]+/g, (match) => {
      return `<span class="text-blue-light">${match}</span>`;
    })
    .replace(/https:\/\/[^\s]+/g, (match) => {
      return `<span class="text-blue-light">${match}</span>`;
    });
});
interface Props extends ModalProps {
  onClose: (isSendTweet: boolean) => void;
}
export const TweetModal: React.FC<Props> = ({ onClose, ...props }) => {
  const [isSend, setIsSend] = React.useState(false);

  const handleSendTweet = () => {
    openExternalUrl(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        TWEET_CONTENT.join('\n')
      )}`
    );
    setIsSend(true);
    setTimeout(() => {
      onClose(true);
    }, 2000);
  };

  return (
    <Modal
      {...props}
      centered
      smallTitle
      width={520}
      onCancel={() => onClose(isSend)}
    >
      <div className="text-[16px] leading-[22px] text-white pt-[50px] px-[30px]">
        {COLORFUL_TWEET_HTML.map((item) => (
          <p
            key={item}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: item,
            }}
          />
        ))}
      </div>
      <div className="flex py-[30px]">
        <Button
          onClick={handleSendTweet}
          type="primary"
          className="w-[200px] h-[50px] m-auto rounded-[8px] text-[20px]"
        >
          Tweet
        </Button>
      </div>
    </Modal>
  );
};
