import { AppData, PlayerPlugin } from '@phonophant/shared-models';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import net from 'net';

interface SendCommandOptions {
  host?: string;
  port?: number;
}

export default class VlcPlayer extends PlayerPlugin<any> {
  private socket: net.Socket | null = null;

  private getVlcPath(): string {
    const possibleVlcPath: string[] = [];
    const isWindows = process.platform === 'win32';
    switch(true) {
      case isWindows && !!process.env['ProgramFiles(x86)']:
        possibleVlcPath.push(path.join(process.env['ProgramFiles(x86)'] as string, 'VideoLAN/VLC/vlc.exe'));
      case isWindows && !!process.env['ProgramFiles']:
        possibleVlcPath.push(path.join(process.env['ProgramFiles'] as string, 'VideoLAN/VLC/vlc.exe'));
      case !!process.env['VlcExecPath']:
        possibleVlcPath.push(process.env['VlcExecPath'] as string);
      case !isWindows:
        possibleVlcPath.push("/usr/bin/cvlc");
    }

    const vlcPath = possibleVlcPath.find(path => fs.existsSync(path));

    if (!vlcPath) {
      throw new Error('Vlc executable not found. You can try to set env variable "VlcExecPath" pointing to it.')
    }

    return vlcPath;
  }

  private connectToSocket(host='127.0.0.1', port=8088): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const socket: net.Socket = net.connect({ port, host }, () => resolve(socket));
    })
  }

  init(appData: AppData) {
    spawn(this.getVlcPath(), ['--no-video', '--intf=dummy', '--extraintf=rc', '--rc-host=127.0.0.1:8088', '--rc-quiet']);
  }

  async sendCommand(command: string, sendCommandOptions: SendCommandOptions = {}) {
    const { host = "127.0.0.1", port = 8088 } = sendCommandOptions;

    return new Promise(async (resolve, reject) => {
      let returnMessage = '';

      const socket = await this.connectToSocket(host, port);
      socket.setNoDelay();
  
      socket.once('end', () => {
        resolve(returnMessage)
      });
  
      socket.on("data", (data) => {
        returnMessage += `${data.toString()}\n`;
      });
  
      try {
        socket.write(command + "\r\n", function() {
          socket.end();
        });
      } catch(e) {
        console.log(e);
      }
    });
  }

  async play(soundIdentifier: string) {
    await this.sendCommand('clear');
    await this.sendCommand(`add "${soundIdentifier}"`);
    await this.sendCommand('play');
  }

  async pause() {
    await this.sendCommand(`pause`);
  }

  async stop() {
    await this.sendCommand(`stop`);
  }

  async seek(seconds: number) {
    await this.sendCommand(`seek ${seconds}`);
  }

  async getTimeInSec(): Promise<number> {
    const response = await this.sendCommand(`get_time`) as string;
    return Number(response.replace(/\W/g, ""));
  }

  async getLengthInSec(): Promise<number> {
    const response = await this.sendCommand(`get_length`) as string;
    return Number(response.replace(/\W/g, ""));
  }

  async getVolume(): Promise<number> {
    const response = await this.sendCommand(`volume`) as string;
    if (!response.includes('audio volume')) {
      return 0;
    }
    const onlyNumber = response.replace(/\\r.*/g, '').replace('status change: ( audio volume:', '').replace(/\W/g, '');
    return Number(onlyNumber);
  }

  async volumeUp(volStep: number) {
    await this.sendCommand(`volup ${volStep}`);
  }

  async volumeDown(volStep: number) {
    await this.sendCommand(`voldown ${volStep}`);
  }

  async setVolume(volValue: number) {
    await this.sendCommand(`volume ${volValue}`);
  }
}