import styled from 'styled-components';

const OfflineAlertWrapper = styled.div`
  background-color: #7084ff;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  color: #fff;
  margin-bottom: 22px;
  display: flex;
  line-height: 130%;
  img {
    width: 12px;
    height: 12px;
    margin-right: 7px;
    margin-top: 1px;
  }
`;

const OfflineAlert = () => {
  return (
    <OfflineAlertWrapper>
      <img src="rabby-internal://assets/icons/home/offline-alert.svg" alt="" />
      Rabby Desktop backend API will be discontinued on December 31. User assets
      remain completely safe and unaffected, and can still be managed via Rabby
      Extension or the Rabby mobile app. A new Rabby Desktop is planned for a
      future release.
    </OfflineAlertWrapper>
  );
};

export default OfflineAlert;
