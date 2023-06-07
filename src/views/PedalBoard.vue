<script setup lang="ts">
import {computed, Ref, ref} from "vue";
import {useMidi} from "../composables/useMidi";
import {Button} from "../types/Button";
import {useFcbPedal} from "../composables/useFcbPedal";
import {Input, Output, MessageEvent} from "webmidi";

const {
    dawMidiOutput,
    midiOutputs,
    dawMidiInput,
    pedalMidiOutput,
    pedalMidiInput,
    midiInputs,
    onPedalEvent,
    onDawEvent
} = useMidi()
const {
    exportFcb,
    banks,
    goToBank,
    hasDirectBank
} = useFcbPedal(pedalMidiInput as Ref<Input | null>, pedalMidiOutput as Ref<Output | null>)

const selectedBankIndex = ref(0)

const selectedBank = computed(() => {
    return banks[selectedBankIndex.value]
})

const selectedBankButtons = computed(() => {
    if (hasDirectBank && selectedBankIndex.value === 0) {
        return [...selectedBank.value.buttons, {name: "Return to previous bank", type: "returnToPreviousBank"}]
    }
    if (hasDirectBank && selectedBankIndex.value > 0) {
        return [...selectedBank.value.buttons, {name: "Go to Looper", type: "goToDirectBank"}]
    }
    return selectedBank.value.buttons
})

const handleButtonClick = (index: number) => {
    pedalMidiOutput.value?.channels[16].sendProgramChange(index)
}

const handleBankUp = () => {
    if (selectedBankIndex.value < banks.length - 1) {
        selectedBankIndex.value++
    } else {
        selectedBankIndex.value = 0
    }
    pedalMidiOutput.value?.channels[16].sendProgramChange(15)
}

const handleBankDown = () => {
    if (selectedBankIndex.value > 0) {
        selectedBankIndex.value--
    } else {
        selectedBankIndex.value = banks.length - 1
    }
    pedalMidiOutput.value?.channels[16].sendProgramChange(14)
}

const handleConfigButtonClick = () => {
    exportFcb(banks)
}

const handleButtonPressedFromPedal = (button: Button, event: MessageEvent) => {
    if (button.type === "effect" && event.value !== undefined) {
        button.enabled = !button.enabled
        console.log(`Button ${button.name} is now ${event.value > 0 ? "enabled" : "disabled"}`)
        dawMidiOutput.value?.channels[button.channel].sendControlChange(button.controller, event.value > 0 ? 127 : 1)
    }
    if (button.type === "trigger") {
        button.enabled = true
        setTimeout(() => {
            button.enabled = false
        }, 200)
        dawMidiOutput.value?.channels[button.channel].sendControlChange(button.controller, 127)
    }
    if (button.type === "program") {
        banks[selectedBankIndex.value].buttons.forEach((buttonFiltered, index) => {
            if (buttonFiltered.type === 'program') {
                banks[selectedBankIndex.value].buttons[index].enabled = button === buttonFiltered
            }
        })
    }
}

onPedalEvent((event) => {
    console.log(`Pedal sent ${event.message.type} on channel ${event.message.channel} for controller ${event.message.dataBytes[0]} with value ${event.message.dataBytes[1]}`)

    const controller = event.message.dataBytes[0]
    const findBankIndex = banks.findIndex(bank => bank.buttons.find(button => button.controller === controller && button.channel === event.message.channel))

    if (event.message.channel === 15) {
        selectedBankIndex.value = event.message.dataBytes[0]
    }
    if (event.message.type === 'programchange' && findBankIndex > -1) {
        const button = banks[findBankIndex].buttons.find(button => button.controller === controller && button.channel === event.message.channel)
        if (button) {
            handleButtonPressedFromPedal(button, event)
        }
    }
    if (event.message.type === 'controlchange' && findBankIndex > -1) {
        const controller = event.message.dataBytes[0]
        const findBankIndex = banks.findIndex(bank => bank.buttons.find(button => button.controller === controller && button.channel === event.message.channel))
        const button = banks[findBankIndex].buttons.find(button => button.controller === controller && button.channel === event.message.channel)
        if (button) {
            handleButtonPressedFromPedal(button, event)
        } else {
            dawMidiOutput.value?.channels[event.message.channel].sendControlChange(controller, event.message.dataBytes[1])
        }
    }

})

onDawEvent((event) => {
    if (event.message.type === 'controlchange') {
        const controller = event.message.dataBytes[0]
        const findBankIndex = banks.findIndex(bank => bank.buttons.find(button => button.controller === controller && button.channel === event.message.channel))
        const button = banks[findBankIndex].buttons.find(button => button.controller === controller && button.channel === event.message.channel)
        const buttonIndex = banks[findBankIndex].buttons.findIndex(button => button.controller === controller && button.channel === event.message.channel)
        if (button) {
            if (selectedBankIndex.value === findBankIndex) {
                if (button.type === "effect" && button.enabled !== (event.message.dataBytes[1] > 0)) {
                    pedalMidiOutput.value?.channels[16].sendProgramChange(buttonIndex)
                }

            } else {
                button.enabled = event.message.dataBytes[1] > 0
                console.warn(`Received from DAW an event type ${event.type} with channel ${event.message.channel}, controller ${controller} and value ${event.message.dataBytes[1]}. Button ${button.name} is not in the current bank`)
            }
        } else {
            throw new Error(`Button not found for channel ${event.message.channel} controller ${event.message.dataBytes[0]}`)
        }
    }
    console.log(`DAW sent ${event.message.type} on channel ${event.message.channel} for controller ${event.message.dataBytes[0]} with value ${event.message.dataBytes[1]}`)
})

</script>

<template>
    <div class="pedalboard grid grid-cols-1 grid-rows-[auto_auto_1fr]">
        <div class="top-bar flex justify-between items-center p-4 gap-4">
            <div class="w-full">
                <label for="midi-input" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Pedal Midi
                    input</label>
                <select
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        v-model="pedalMidiInput">
                    <option v-for="input in midiInputs" :key="input" :value="input">{{ input.name }}</option>
                </select>
            </div>
            <div class="w-full">
                <label for="midi-output" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Pedal midi
                    output</label>
                <select
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        v-model="pedalMidiOutput">
                    <option v-for="output in midiOutputs" :key="output" :value="output">{{ output.name }}</option>
                </select>
            </div>
            <div class="w-full">
                <label for="midi-input" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">DAW midi
                    input</label>
                <select
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        v-model="dawMidiInput">
                    <option v-for="input in midiInputs" :key="input" :value="input">{{ input.name }}</option>
                </select>
            </div>
            <div class="w-full">
                <label for="midi-output" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">DAW midi
                    output</label>
                <select
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        v-model="dawMidiOutput">
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
                        class="text-white focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:focus:ring-gray-700 dark:border-gray-700"
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
