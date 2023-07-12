import { message } from 'antd';

export function testRequestSelectCamera(constraints?: MediaStreamConstraints) {
  window.navigator.mediaDevices
    .getUserMedia({
      ...constraints,
      video: {
        facingMode: 'environment',
      },
    })
    .then((result) => {
      console.debug('[debug] testRequestSelectCamera', result);
      message.open({
        type: result.id ? 'success' : 'warning',
        content: `Request camera finished`,
      });
    });
}
