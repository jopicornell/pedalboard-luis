<script setup lang="ts">
import {computed, Ref, ref} from "vue";
import {useMidi} from "../composables/useMidi";
import {Button} from "../types/Button";
import {useFcbPedal} from "../composables/useFcbPedal";
import {Input, Output} from "webmidi";

const {midiOutputs, pedalMidiOutput, pedalMidiInput, midiInputs, onPedalEvent} = useMidi(true)

const selectedBankIndex = ref(0)
const previousBankIndex = ref(1)
const {banks, hasDirectBank} = useFcbPedal(pedalMidiInput as Ref<Input | null>, pedalMidiOutput as Ref<Output | null>)


const selectedBank = computed(() => {
  return banks[selectedBankIndex.value]
})

const selectedBankButtons = computed(() => {
  if (hasDirectBank && selectedBankIndex.value === 0) {
    return [...selectedBank.value.buttons, {name: "Return to previous bank", type: "returnToPreviousBank"} as Button]
  }
  if (hasDirectBank && selectedBankIndex.value > 0) {
    return [...selectedBank.value.buttons, {name: "Go to Looper", type: "returnToPreviousBank"} as Button]
  }
  return selectedBank.value.buttons
})
const handleButtonClick = (index: number) => {
  const button = selectedBankButtons.value[index]
  if (button.type === "effect") {
    button.enabled = !button.enabled
    pedalMidiOutput.value?.channels[button.channel].sendControlChange(button.controller, button.enabled ? 127 : 0)
  }
  if (button.type === "trigger") {
    pedalMidiOutput.value?.channels[button.channel].sendControlChange(button.controller, 127)
  }
  if (button.type === "returnToPreviousBank") {
    if (selectedBankIndex.value === 0) {
      selectedBankIndex.value = previousBankIndex.value
    } else {
      previousBankIndex.value = selectedBankIndex.value
      selectedBankIndex.value = 0
    }
    pedalMidiOutput.value?.channels[15].sendProgramChange(selectedBankIndex.value)
  }
}

const handleBankUp = () => {
  if (selectedBankIndex.value < banks.length - 1) {
    selectedBankIndex.value++
  } else {
    selectedBankIndex.value = 0
  }
  pedalMidiOutput.value?.channels[15].sendProgramChange(selectedBankIndex.value)
}

const handleBankDown = () => {
  if (selectedBankIndex.value > 0) {
    selectedBankIndex.value--
  } else {
    selectedBankIndex.value = banks.length - 1
  }
  pedalMidiOutput.value?.channels[15].sendProgramChange(selectedBankIndex.value)
}

const handleRemoteEvent = (event: any) => {
  const controller = event.data[1]
  if (event.message.type === "programchange" && controller > -1 && controller < 10) {
    const button = banks[selectedBankIndex.value].buttons[controller]
    if (button && button.type === "effect") {
      button.enabled = !button.enabled
      console.log(`Button ${button.name} is now ${button.enabled ? "enabled" : "disabled"}`)
      pedalMidiOutput.value?.channels[button.channel].sendControlChange(button.controller, button.enabled ? 127 : 0)
    } else if (button && button.type === "program") {
      banks[selectedBankIndex.value].buttons.forEach((buttonFiltered, index) => {
        if (buttonFiltered.type === 'program') {
          console.log('button ',button === buttonFiltered, banks)
          banks[selectedBankIndex.value].buttons[index].enabled = button === buttonFiltered
        }
      })

    } else if (controller === 9) {
      if (selectedBankIndex.value === 0) {
        selectedBankIndex.value = previousBankIndex.value
      } else {
        previousBankIndex.value = selectedBankIndex.value
        selectedBankIndex.value = 0
      }
      pedalMidiOutput.value?.channels[15].sendProgramChange(selectedBankIndex.value)
    }
  }

  if (event.message.type === "programchange" && controller === 14) {
    handleBankDown()
  }
  if (event.message.type === "programchange" && controller === 15) {
    handleBankUp()
  }
  if (event.message.type === "controlchange" && controller === 0) {
    previousBankIndex.value = event.value
  }
}

onPedalEvent((event) => {
  if (event.message.channel === 16) {
    handleRemoteEvent(event)
  }
  console.log(`Pedal received ${event.message.type} on channel ${event.message.channel} for controller ${event.message.dataBytes[0]} with value ${event.message.dataBytes[1]}`)
})


</script>

<template>
  <div class="pedalboard grid grid-cols-1 grid-rows-[auto_auto_1fr]">
    <div class="top-bar flex justify-between items-center p-4 gap-4">
      <div class="w-full">
        <label for="midi-input" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Simulator Midi Out
        </label>
        <select
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            v-model="pedalMidiInput">
          <option v-for="input in midiInputs" :key="input" :value="input">{{ input.name }}</option>
        </select>
      </div>
      <div class="w-full">
        <label for="midi-output" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Simulator Midi In
        </label>
        <select
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            v-model="pedalMidiOutput">
          <option v-for="output in midiOutputs" :key="output" :value="output">{{ output.name }}</option>
        </select>
      </div>

      <button class="config-icon" @click="handleConfigButtonClick">Config</button>
    </div>
    <div class="preset-bar flex justify-center items-center h-16 mb-4 text-4xl">{{ selectedBank.name }}</div>
    <div class="grid-layout flex grid grid-cols-6 gap-4 p-4">
      <template v-for="(button, index) in selectedBankButtons"
                :key="button.name">
        <button
            class="text-white 0 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:focus:ring-gray-700 dark:border-gray-700"
            :style="{ 'order': index < 5 ? index + 6 : index - 6 }"
            @click="handleButtonClick(index)"
            :class="{ 'bg-cyan-800 hover:bg-cyan-900': button.enabled, 'bg-gray-700 hover:bg-gray-800': !button.enabled }"
        >{{ button.name }}
        </button>
        <button
            v-if="index === 4 || index === 9"
            class="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
            :style="{ 'order': index+1 }"
            @click="index === 4 ? handleBankUp() : handleBankDown()">
          {{ index === 4 ? 'Up' : 'Down' }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pedalboard {
  width: 100vw;
  height: 100vh;
}
</style>
