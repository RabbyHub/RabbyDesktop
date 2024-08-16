import { useSwap } from '@/renderer/hooks/rabbyx/useSwap';
import { useRabbyFee, useSetRabbyFee } from '../atom';
import { RabbyFeePopup } from './RabbyFeePopup';

export const Header = () => {
  const { visible, feeDexDesc, dexName } = useRabbyFee();
  const setRabbyFeeVisible = useSetRabbyFee();

  useSwap();

  return (
    <>
      <RabbyFeePopup
        visible={visible}
        dexName={dexName}
        feeDexDesc={feeDexDesc}
        onClose={() => setRabbyFeeVisible({ visible: false })}
      />
    </>
  );
};
