export function getEntryNameFromJSOutputPath(jsoutputPath: string) {
  const slices = jsoutputPath.split('/');
  return slices.length > 2 ? slices[1] : (slices[0] || '');
}
