export enum MidiMessageType {
    ControlChange = 'control-change',
    ProgramChange = 'program-change',
    NoteOn = 'note-on',
    NoteOff = 'note-off',
}

export interface MidiMessageBase {
  channel: number
  controller: number
}

export interface ControlChangeMessage extends MidiMessageBase {
    type: MidiMessageType.ControlChange
    value: number
}

export interface ProgramChangeMessage extends MidiMessageBase {
    type: MidiMessageType.ProgramChange
}

export interface NoteOnMessage extends MidiMessageBase {
    type: MidiMessageType.NoteOn
    value: number
}

export interface NoteOffMessage extends MidiMessageBase {
    type: MidiMessageType.NoteOff
    value: number
}
export type MidiMessage = ControlChangeMessage | ProgramChangeMessage | NoteOnMessage | NoteOffMessage