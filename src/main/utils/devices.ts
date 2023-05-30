import nodeHid = require('node-hid');

export function filterNodeHIDDevices(opts?: {
  filters?: HIDDeviceRequestOptions['filters'];
}) {
  let nodeDevices: nodeHid.Device[] = [];

  try {
    const nodeDevicesOrig = nodeHid.devices();
    nodeDevicesOrig.forEach((d) => {
      if (
        !nodeDevices.find(
          (d2) => d2.productId === d.productId && d2.vendorId === d.vendorId
        )
      ) {
        nodeDevices.push(d);
      }
    });
  } catch (e) {
    console.error(e);
    return {
      error: 'Not supported on this platform',
      devices: [],
    };
  }

  if (opts?.filters) {
    const filters = Array.isArray(opts.filters) ? opts.filters : [opts.filters];
    filters.forEach((filter) => {
      if (filter.vendorId) {
        nodeDevices = nodeDevices.filter((d) => d.vendorId === filter.vendorId);
      }
      if (filter.productId) {
        nodeDevices = nodeDevices.filter(
          (d) => d.productId === filter.productId
        );
      }
      if (filter.usagePage) {
        nodeDevices = nodeDevices.filter(
          (d) => d.usagePage === filter.usagePage
        );
      }
      if (filter.usage) {
        nodeDevices = nodeDevices.filter((d) => d.usage === filter.usage);
      }
    });
  }

  return {
    devices: nodeDevices,
  };
}

export function mergeNodeHIDInfo(deviceList: IHidDevice[]) {
  const nodeDeviceMap = nodeHid.devices().reduce((acc, device) => {
    acc.set(`${device.productId}+${device.vendorId}`, device);
    return acc;
  }, new Map<string, nodeHid.Device>());

  return deviceList.map((device) => {
    const nodeDevice = nodeDeviceMap.get(
      `${device.productId}+${device.vendorId}`
    );

    return {
      ...device,
      nodeDevice: nodeDevice || null,
    };
  });
}
