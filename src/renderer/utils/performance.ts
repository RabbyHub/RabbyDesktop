/**
 * @description collect heap size information on the current page
 */
export function getPerfInfo(): IWebviewPerfInfo {
  // @ts-expect-error
  const memory = window.performance.memory;
  const time = Date.now();

  return {
    time,
    memoryInfo: {
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    },
  };
}
