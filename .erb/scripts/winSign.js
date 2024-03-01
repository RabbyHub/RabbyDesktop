'use strict';

exports.fingerprint = process.env.RABBY_DESKTOP_CODE_SIGINING_CERT_FINGERPRINT;

const fingerprint = exports.fingerprint;

exports.default = async function (configuration) {
  if (configuration.path) {
    console.log(`[withSign] try to sign ${configuration.path}...`)
    require('child_process').execSync(
      `smctl sign --fingerprint=${fingerprint} --input "${String(
        configuration.path
      )}"`
    );
    console.log(`[withSign] finish sign ${configuration.path}...`)
  } else {
    console.log('[withSign] configuration.path is empty, skipped')
  }
};
