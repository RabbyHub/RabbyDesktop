import styled from 'styled-components';
import IconSwitchDex from '@/../assets/icons/swap/switch.svg?rc';

const HeaderWrapper = styled.div`
  padding: 20px 0;

  .titleBox {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    .logo {
      width: 24px;
      height: 24px;
      border-radius: 9999px;
    }
    .title {
      font-weight: 500;
      font-size: 20px;
      color: var(--color-purewhite);
    }
  }

  .switchDex {
    position: absolute;
    right: 10px;
    top: 28px;
    color: rgba(0, 0, 0, 0.4);
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
`;

export const Header = ({
  logo,
  name,
  toggleVisible,
}: {
  logo: string;
  name: string;
  toggleVisible: () => void;
}) => {
  return (
    <HeaderWrapper>
      <div className="titleBox">
        <img src={logo} alt="" className="logo" />
        <span className="title">{name}</span>
      </div>

      <IconSwitchDex
        className="switchDex"
        style={{
          top: 28,
        }}
        onClick={toggleVisible}
      />
    </HeaderWrapper>
  );
};
