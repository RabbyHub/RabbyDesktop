import { useCallback } from 'react';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import styled from 'styled-components';
import ImgRabbyBg from '@/../assets/icons/swap/rabby-bg.svg';

const Wrapper = styled.div`
  color: #ffffff;
  height: 100%;
  background-image: url(${ImgRabbyBg});
  background-repeat: no-repeat;
  background-size: 78px 68px;
  background-position: bottom right;
  .segment {
    margin-top: 32px;
    font-size: 14px;
    font-weight: 700;
    line-height: 24px;
  }
  .title {
    font-weight: medium;
    font-size: 18px;
    margin-bottom: 12px;
  }
  .desc {
    font-size: 14px;
    line-height: 20px;
    color: rgba(255, 255, 255, 0.8);
  }

  .discord {
    margin-top: 32px;
    color: rgba(255, 255, 255, 0.6);
    .link {
      cursor: pointer;
      text-decoration: underline;
    }
  }
`;
export const SwapIntro = () => {
  const gotoDiscord = useCallback(() => {
    openExternalUrl('https://discord.com/invite/qBgBp4gRvQ');
  }, []);
  return (
    <Wrapper>
      <div className="title">Rabby Swap Aggregator</div>
      <div className="desc">
        We find the best rates from top aggregators like 1inch, 0x, Paraswap,
        and more. No hassle, just better swaps.
      </div>

      <div className="segment">What's more...</div>
      <ul>
        <li className="desc">
          Rabby provides reference prices from CEX to help inform your trades{' '}
        </li>
        <li className="desc">
          Rabby validates your deal by simulating the transaction to make sure
          it goes smoothly.{' '}
        </li>
      </ul>

      <div className="segment">About Safety</div>
      <div className="desc">
        We prioritize the safety and security of our users. We use the router
        contract of each aggregator, ensuring that your swaps are as safe and
        secure as if you were swapping directly from their interface.
      </div>
      <div className="segment">Rabby charges 0 fee</div>
      <div className="desc">
        To ensure a transparent and cost-effective experience for users, Rabby
        has no additional charges for swaps. You'll have the exact rates
        provided by the exchange.
      </div>

      <div className="discord">
        Find us in{' '}
        <span className="link" onClick={gotoDiscord}>
          Discord
        </span>{' '}
        if you have any questions
      </div>
    </Wrapper>
  );
};
