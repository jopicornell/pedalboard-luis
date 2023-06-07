// Function that exports
import {Bank} from "../types/Bank";
import {useFileSystemAccess} from "@vueuse/core";
import {banksToUno2} from "../utils/uno2-parser";
import {Button} from "../types/Button";
import {computed, reactive, Ref} from "vue";
import {Input, Output, Message} from "webmidi";
import {createControlChangeMessage} from "../utils/midi";

export async function exportFcb(banks: Bank[]) {
  const fileSystem = useFileSystemAccess({
    dataType: 'Text',
  })
  await fileSystem.create({suggestedName: 'fcb.txt'})
  fileSystem.data.value = banksToUno2(banks)
  await fileSystem.save()
}

const createButton = ({
                        name,
                        type,
                        controller = 1,
                        channel = 1,
                        invert = false,
                        messages
                      }:
                        { name: string, type: Button['type'], controller?: number, channel?: number, invert?: boolean, messages?: Message[] }): Button => {
  return {
    name,
    type,
    enabled: false,
    controller,
    messages,
    channel,
    invert
  }
}

const createBank = ({name, buttons, channel}: Bank): Bank => {
  return {
    name,
    buttons,
    channel,
  }
}


const banks = reactive([
  createBank({
    name: "Direct Bank",
    buttons: [
      createButton({name: "Tap tempo", type: "trigger", controller: 0}),
      createButton({name: "Looper rec", type: "trigger", controller: 1}),
      createButton({name: "Looper play", type: "trigger", controller: 2}),
      createButton({name: "Looper add", type: "trigger", controller: 3}),
      createButton({name: "Looper stop", type: "trigger", controller: 4}),
      createButton({name: "Looper clear", type: "trigger", controller: 5}),
      createButton({name: "Looper reverse", type: "trigger", controller: 6}),
      createButton({name: "Looper %2", type: "trigger", controller: 7}),
      createButton({name: "Looper x2", type: "trigger", controller: 8}),
    ],
    channel: 1,
  }),
  createBank({
    name: "Song 1",
    buttons: [
      createButton({name: "Overdrive", type: "effect", controller: 10}),
      createButton({name: "Delay", type: "effect", controller: 11, invert: true}),
      createButton({name: "Reverb", type: "effect", controller: 12}),
      createButton({name: "Freeze", type: "effect", controller: 13}),
      createButton({name: "Compressor", type: "effect", controller: 14}),
      createButton({
        name: "Clean Amp",
        type: "program",
        controller: 15,
        messages: [
          createControlChangeMessage(1, 19, 127),
          createControlChangeMessage(1, 20, 0),
          createControlChangeMessage(1, 21, 0)
        ]
      }),
      createButton({name: "EdgeBreak Amp", type: "program", controller: 16}),
      createButton({name: "Cloudy", type: "program", controller: 17}),
      createButton({name: "Hi gain", type: "program", controller: 18}),
    ],
    channel: 1,
  }),
]);


export const useFcbPedal = (pedalInput: Ref<Input | null>, pedalOutput: Ref<Output | null>) => {
  const goToBank = (bankNumber: number) => {
    pedalOutput.value?.channels[16].sendControlChange(0, bankNumber)
  }
  const hasDirectBank = computed(() => banks.some(bank => bank.name === 'Direct Bank'))

  return {
    exportFcb,
    createButton,
    createBank,
    banks,
    hasDirectBank,
    goToBank,
  }
}
