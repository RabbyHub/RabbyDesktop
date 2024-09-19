import styled from 'styled-components';

const Wraper = styled.div`
  background-color: transparent;
  min-height: auto;
  flex: 1;
  padding-top: 117px;
  .no-data-image {
    width: 100px;
    margin: 0 auto;
    display: block;
  }
`;

export const Emtpy = ({ description }: { description: string }) => {
  return (
    <Wraper>
      <img
        className="no-data-image"
        src="rabby-internal://assets/icons/mainwin-settings/nodata-tx.png"
        alt="no address"
      />
      <p className="font-medium text-center text-r-neutral-body text-14">
        {description}
      </p>
    </Wraper>
  );
};
