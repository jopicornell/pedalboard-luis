import {Message} from "webmidi";

export interface Button {
  name: string,
  type: "effect" | "trigger" | "program" | "returnToPreviousBank"
  enabled: boolean
  controller: number
  channel: number
  invert: boolean
  messages?: Message[]
}
