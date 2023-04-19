import PortMessage from './portMessage';

class RabbyXPortMessage extends PortMessage {
  protected _EVENT_PRE: string = 'RABBYX_';
}

export default RabbyXPortMessage;
