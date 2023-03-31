import styled from 'styled-components';
import IconSwitchDex from '@/../assets/icons/swap/switch.svg?rc';

const HeaderWrapper = styled.div`
  .titleBox {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    .logo {
      width: 36px;
      height: 36px;
      border-radius: 9999px;
    }
    .title {
      font-weight: 500;
      font-size: 20px;
      color: var(--color-purewhite);
    }

    .switchDex {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
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
        <IconSwitchDex
          className="switchDex"
          style={{
            top: 28,
          }}
          onClick={toggleVisible}
        />
      </div>
    </HeaderWrapper>
  );
};
