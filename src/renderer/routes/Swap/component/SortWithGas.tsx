import { Checkbox } from '@/renderer/components/Checkbox';
import { useSwapSettings } from '../hooks';

export const SortWithGas = () => {
  const { sortIncludeGasFee, setSwapSortIncludeGasFee } = useSwapSettings();

  return (
    <Checkbox
      checked={!!sortIncludeGasFee}
      onChange={setSwapSortIncludeGasFee}
      className="text-12 text-r-neutral-body"
      type="square"
      background="transparent"
      unCheckBackground="transparent"
      checkIcon={
        sortIncludeGasFee ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            width="100%"
            height="100%"
            viewBox="0 0 14 14"
          >
            <path
              fill="var(--r-blue-default)"
              d="M12.103.875H1.898a1.02 1.02 0 0 0-1.02 1.02V12.1c0 .564.456 1.02 1.02 1.02h10.205a1.02 1.02 0 0 0 1.02-1.02V1.895a1.02 1.02 0 0 0-1.02-1.02Z"
            />
            <path
              stroke="#fff"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.05}
              d="m4.2 7.348 2.1 2.45 4.2-4.9"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            width="100%"
            height="100%"
            viewBox="0 0 14 14"
          >
            <path
              stroke="var(--r-neutral-foot)"
              strokeLinejoin="round"
              strokeWidth={0.75}
              d="M12.103.875H1.898a1.02 1.02 0 0 0-1.02 1.02V12.1c0 .564.456 1.02 1.02 1.02h10.205a1.02 1.02 0 0 0 1.02-1.02V1.895a1.02 1.02 0 0 0-1.02-1.02Z"
            />
          </svg>
        )
      }
    >
      <span className="ml-[-4px]">Sort with gas</span>
    </Checkbox>
  );
};
