import {Message, WebMidi} from "webmidi";
import type {Input, Output, MessageEvent} from "webmidi";
import {onMounted, Ref, ref, watch} from "vue";
import { listMidiConnections } from '../utils/midi';

function getDawMidiInput(): Input | null {
  listMidiConnections().then((connections) => {
    console.log(connections)
  })
  return WebMidi.getInputByName("Virtual Midi Daw In") ?? null;
}

function getDawMidiOutput(): Output | null {
  return WebMidi.getOutputByName("Virtual Midi Daw Out") ?? null;
}

function getPedalMidiInput(simulator: boolean): Input | null {
  return WebMidi.getInputByName(simulator ? "Virtual Midi Simulator Out" : "Komplete Audio 6") ?? null;
}

function getPedalMidiOutput(simulator: boolean): Output | null {
  return WebMidi.getOutputByName(simulator ? "Virtual Midi Simulator In" : "Komplete Audio 6") ?? null;
}

const pedalListeners = ref([] as ((message: MessageEvent) => void)[]);
const dawListeners = ref([] as ((message: MessageEvent) => void)[]);

export function useMidi(simulator: boolean = false) {
  const midiInputs = ref<Input[]>([]);
  const midiOutputs = ref<Output[]>([]);
  const dawMidiInput = ref<Input | null>(null)
  const dawMidiOutput = ref<Output | null>(null)
  const pedalMidiInput = ref<Input | null>(null)
  const pedalMidiOutput = ref<Output | null>(null)
  onMounted(async () => {
    await WebMidi.enable()
    midiInputs.value = WebMidi.inputs
    midiOutputs.value = WebMidi.outputs
    dawMidiInput.value = getDawMidiInput()
    dawMidiOutput.value = getDawMidiOutput()
    pedalMidiInput.value = getPedalMidiInput(simulator)
    pedalMidiOutput.value = getPedalMidiOutput(simulator)
  })

  watch(dawMidiInput, (input, oldValue) => {
    if (oldValue) {
      dawListeners.value.forEach((listener) => oldValue.removeListener('controlchange', listener))
      dawListeners.value.forEach((listener) => oldValue.removeListener('programchange', listener))
    }
    if (input) {
      dawListeners.value.forEach((listener) => input.addListener('controlchange', listener))
      dawListeners.value.forEach((listener) => input.addListener('programchange', listener))
    }
  })

  watch(pedalMidiInput, (input, oldValue) => {
    if (oldValue) {
      pedalListeners.value.forEach((listener) => oldValue.removeListener('controlchange', listener))
      pedalListeners.value.forEach((listener) => oldValue.removeListener('programchange', listener))
    }
    if (input) {
      console.log('adding listener')
      pedalListeners.value.forEach((listener) => input.addListener('controlchange', listener))
      pedalListeners.value.forEach((listener) => input.addListener('programchange', listener))
    }
  })

  function onPedalEvent(listener: (event: MessageEvent) => void) {
    pedalListeners.value.push(listener)
  }

  function onDawEvent(listener: (event: MessageEvent) => void) {
    dawListeners.value.push(listener)
  }

  return {
    midiInputs,
    midiOutputs,
    dawMidiInput,
    dawMidiOutput,
    pedalMidiInput,
    pedalMidiOutput,
    onPedalEvent,
    onDawEvent,
  }
}
