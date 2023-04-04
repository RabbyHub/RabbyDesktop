import { Skeleton } from 'antd';
import classNames from 'classnames';
import styles from '../index.module.less';

export const Loading = () => {
  return (
    <>
      <div
        className={classNames(
          'flex items-center justify-between px-[26px] py-24px',
          styles.loadingItem
        )}
      >
        <div className={styles.colTxInfo}>
          <div>
            <Skeleton.Input
              active
              style={{
                borderRadius: '2px',
                width: '79px',
                height: '14px',
                marginBottom: '10px',
              }}
            />
          </div>
          <div>
            <Skeleton.Input
              active
              style={{
                borderRadius: '2px',
                width: '153px',
                height: '14px',
                marginBottom: '10px',
              }}
            />
          </div>
        </div>
        <div
          className={classNames(
            'flex items-center gap-[15px]',
            styles.colTxExplain
          )}
        >
          <Skeleton.Input
            active
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
            }}
          />
          <div>
            <div>
              <Skeleton.Input
                active
                style={{
                  width: '100px',
                  height: '20px',
                  marginBottom: 8,
                }}
              />
            </div>
            <div>
              <Skeleton.Input
                active
                style={{
                  width: '130px',
                  height: '14px',
                }}
              />
            </div>
          </div>
        </div>
        <div
          className={classNames(
            'flex items-center gap-[15px]',
            styles.colTxChange
          )}
        >
          <Skeleton.Input
            active
            style={{
              width: '20px',
              height: '20px',
            }}
          />
          <Skeleton.Input
            active
            style={{
              width: '149px',
              height: '20px',
            }}
          />
        </div>
        <div className={classNames('text-right ml-auto', styles.colTxExtra)}>
          <div>
            <Skeleton.Input
              active
              style={{
                width: '112px',
                height: '14px',
                marginBottom: 10,
              }}
            />
          </div>
          <div>
            <Skeleton.Input
              active
              style={{
                width: '217px',
                height: '14px',
              }}
            />
          </div>
        </div>
      </div>
      <div
        className={classNames(
          'flex items-center justify-between px-[26px] py-24px',
          styles.loadingItem
        )}
      >
        <div className={styles.colTxInfo}>
          <div>
            <Skeleton.Input
              active
              style={{
                borderRadius: '2px',
                width: '79px',
                height: '14px',
                marginBottom: '10px',
              }}
            />
          </div>
          <div>
            <Skeleton.Input
              active
              style={{
                borderRadius: '2px',
                width: '153px',
                height: '14px',
                marginBottom: '10px',
              }}
            />
          </div>
        </div>
        <div
          className={classNames(
            'flex items-center gap-[15px]',
            styles.colTxExplain
          )}
        >
          <Skeleton.Input
            active
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
            }}
          />
          <div>
            <div>
              <Skeleton.Input
                active
                style={{
                  width: '100px',
                  height: '20px',
                  marginBottom: 8,
                }}
              />
            </div>
            <div>
              <Skeleton.Input
                active
                style={{
                  width: '130px',
                  height: '14px',
                }}
              />
            </div>
          </div>
        </div>
        <div className={styles.colTxChange}>
          <div className="flex items-center gap-[15px]  mb-[10px]">
            <Skeleton.Input
              active
              style={{
                width: '20px',
                height: '20px',
              }}
            />
            <Skeleton.Input
              active
              style={{
                width: '149px',
                height: '20px',
              }}
            />
          </div>
          <div className="flex items-center gap-[15px]  mb-[10px]">
            <Skeleton.Input
              active
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
              }}
            />
            <Skeleton.Input
              active
              style={{
                width: '149px',
                height: '20px',
              }}
            />
          </div>
          <div className="flex items-center gap-[15px]">
            <Skeleton.Input
              active
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
              }}
            />
            <Skeleton.Input
              active
              style={{
                width: '149px',
                height: '20px',
              }}
            />
          </div>
        </div>
        <div className={classNames('text-right ml-auto', styles.colTxExtra)}>
          <div>
            <Skeleton.Input
              active
              style={{
                width: '112px',
                height: '14px',
                marginBottom: 10,
              }}
            />
          </div>
          <div>
            <Skeleton.Input
              active
              style={{
                width: '217px',
                height: '14px',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
