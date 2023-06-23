import { invoke } from '@tauri-apps/api'

export async function listMidiConnections(): Promise<string[]> {
  console.log(await invoke('list_midi_connections'))
  return invoke('list_midi_connections')
}
