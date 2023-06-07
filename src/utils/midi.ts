import {Message} from "webmidi";
import { invoke } from '@tauri-apps/api'

export function createControlChangeMessage(channel: number, controller: number, value: number): Message {
  return new Message(new Uint8Array([

  ]))
}

export function createProgramChangeMessage(channel: number, controller: number): Message {
  return new Message(new Uint8Array([

  ]))
}

export async function listMidiConnections(): Promise<string[]> {
  console.log(await invoke('list_midi_connections'))
  return invoke('list_midi_connections')
}
