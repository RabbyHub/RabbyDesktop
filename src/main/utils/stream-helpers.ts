import { firstValueFrom } from 'rxjs';
import { fromMainSubject } from '../streams/_init';

export async function getElectronChromeExtensions() {
  return firstValueFrom(fromMainSubject('electronChromeExtensionsReady'));
}

export async function getWebuiExtension() {
  return firstValueFrom(fromMainSubject('webuiExtensionReady'));
}

export async function getWebuiExtId() {
  return (await getWebuiExtension()).id;
}

export async function onMainWindowReady() {
  return firstValueFrom(fromMainSubject('mainWindowReady'));
}
