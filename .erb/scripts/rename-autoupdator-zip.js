const fs = require('fs');
const path = require('path');
const jsYaml = require('js-yaml');

if (process.platform === 'darwin') {
  const ROOT = path.join(__dirname, '../../');
  ;[
    path.resolve(ROOT, './release/build-darwin-arm64-prod'),
    path.resolve(ROOT, './release/build-darwin-x64-prod'),
    path.resolve(ROOT, './release/build-darwin-arm64-reg'),
    path.resolve(ROOT, './release/build-darwin-x64-reg'),
  ].forEach(buildDir => {
    isReg = buildDir.includes('-reg');

    if (!fs.existsSync(buildDir)) {
      console.warn(`skip '${buildDir}' because it does not exist`);
      return ;
    }

    const ymlFile = path.resolve(buildDir, './latest-mac.yml');
    const arch = buildDir.match(/(x64|arm64)/)[0];
    fs.cpSync(ymlFile, `${ymlFile}.${arch}.bak`, { overwrite: true });

    let yamlContent = fs.readFileSync(path.resolve(buildDir, './latest-mac.yml'), 'utf8');
    const yamlJson = jsYaml.load(yamlContent);
    const version = yamlJson.version;

    yamlJson.files.filter((item) => item.url.endsWith('.zip')).forEach((item) => {
      const fileSource = path.resolve(buildDir, `./${item.url}`);
      const blockmapSource = path.resolve(buildDir, `./${item.url}.blockmap`);

      const newUrl = `rabby-wallet-desktop-installer-${arch}-${version}.zip`

      if (fileSource !== path.resolve(buildDir, newUrl)) {
        fs.cpSync(fileSource, path.resolve(buildDir, newUrl), { overwrite: true });
      }
      if (blockmapSource !== path.resolve(buildDir, `${newUrl}.blockmap`)) {
        fs.cpSync(blockmapSource, path.resolve(buildDir, `${newUrl}.blockmap`), { overwrite: true });
      }

      yamlContent = yamlContent.replace(new RegExp(item.url, 'g'), newUrl);
    });

    // const newYaml = jsYaml.dump(yamlJson, { noRefs: true, noCompatMode: true, skipInvalid: true });
    fs.writeFileSync(ymlFile, yamlContent, 'utf8');
  });
}
