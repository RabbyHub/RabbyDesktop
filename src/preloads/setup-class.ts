export function setupClass() {
  const osType = process.platform;
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add(`os-${osType}`);
  });
}
