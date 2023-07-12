// this file pointless now, but may be useful in the future

const { systemPreferences } = require('electron');

console.log(systemPreferences.getMediaAccessStatus('camera'));
