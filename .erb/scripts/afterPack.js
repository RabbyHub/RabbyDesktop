const path = require("path");
const asarmor = require('asarmor');

const ROOT = path.resolve(__dirname, '../..');

exports.default = async ({ appOutDir, packager }) => {
  try {
    const asarPath = path.join(packager.getResourcesDir(appOutDir), 'app.asar');

    // encrypt file contents first
    const src = path.join(packager.info.projectDir, 'release/app');
    const dst = asarPath;
    console.log(`[asarmor] encrypting contents of ${src} to ${dst}`);
    await encrypt({
      // path to your source code (e.g. src, build or dist)
      src,
      // destination asar file to write to
      dst,
      // path to the encryption key file; asarmor should generate a new one every time it's installed as a dev-dependency.
      keyFilePath: path.join(ROOT, './node_modules/asarmor/src/encryption/key.txt'),
    });

    // then patch the header
    console.log(`[asarmor] applying patches to ${asarPath}`);
    const archive = await asarmor.open(asarPath);
    archive.patch(); // apply default patches
    await archive.write(asarPath);
  } catch (err) {
    console.warn('[asarmor] error occured on afterPack.js');
    console.error(err);
  }
};
