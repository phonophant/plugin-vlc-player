import { AppData } from '@phonophant/shared-models';
import VlcPlayer from './main';

describe('VlcPlayer', () => {
  jest.setTimeout(100000);

  const sleep = async (ms: number) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => resolve(), ms);
    })
  }

  it('should create', async () => {
    const vlcPlayer = new VlcPlayer();
    const mockExpress = {} as any;
    await vlcPlayer.init({ version: '1.0.0', express: mockExpress} as AppData);
    await sleep(2000);
    await vlcPlayer.play("C:\\temp\\Fröhliche Weihnacht.mp3");
    await sleep(2000);
    await vlcPlayer.seek(130);
    const pos = await vlcPlayer.getTimeInSec();
    await vlcPlayer.getVolume();
    await sleep(2000);
  });
})