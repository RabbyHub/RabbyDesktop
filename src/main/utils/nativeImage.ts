export function resizeImage(image: Electron.NativeImage, quality = 0.1) {
  const size = image.getSize();
  return image.resize({
    width: Math.round(size.width * quality),
    height: Math.round(size.height * quality),
  });
}
