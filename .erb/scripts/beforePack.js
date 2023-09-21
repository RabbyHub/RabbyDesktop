const path = require('path');
const { copyFile } = require('fs/promises');

const ROOT = path.resolve(__dirname, '../..');

exports.default = async (context) => {
  try {
    console.log('[asarmor] copying native dependencies');

    // copy main.node from asarmor to our dist/build/release folder; this will become the entrypoint later on.
    await copyFile(
      path.join(ROOT, './node_modules/asarmor/build/Release/main.node'),
      path.join(
        context.packager.info.projectDir, 'release/app/dist/main/main.node'
      )
    );

    // // copy renderer.node to our dist/build/release folder; the render process will be bootstrapped from the main process later on.
    // await copyFile(
    //   path.join(release, 'renderer.node'),
    //   path.join(
    //     context.packager.info.projectDir, 'release/app/dist/renderer/renderer.node'
    //   )
    // );
  } catch (err) {
    console.warn('[asarmor] error occured on beforePack.js');
    console.error(err);
  }
};
