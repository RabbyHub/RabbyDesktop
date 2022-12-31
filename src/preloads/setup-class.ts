export function setupClass() {
  const osType = process.platform;
  document.addEventListener('DOMContentLoaded', () => {
    const osCls = `os-${osType}`;
    document.body.classList.add(osCls);

    document.documentElement.classList.add(osCls, '__rabbyx-shell-page');
  });
}
