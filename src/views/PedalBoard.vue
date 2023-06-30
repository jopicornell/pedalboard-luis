<script setup lang="ts">
import {computed, Ref, ref} from "vue";
import {useMidi} from "../composables/useMidi";
import {Button} from "../types/Button";
import {useFcbPedal} from "../composables/useFcbPedal";
import {Input, Output, MessageEvent, Message} from "webmidi";
import PedalButton from "../components/PedalButton.vue";
import MainLayout from "../layout/MainLayout.vue";
import SweepPedal from "../components/SweepPedal.vue";
import {Sweep} from "../types/Sweep";

const {
    dawMidiOutput,
    pedalMidiOutput,
    pedalMidiInput,
    onPedalEvent,
    onDawEvent,
    getRawMidiMessage,
    configureMidi,
} = useMidi()
configureMidi()
const {
    banks,
    hasDirectBank
} = useFcbPedal(pedalMidiInput as Ref<Input | null>, pedalMidiOutput as Ref<Output | null>)

const selectedBankIndex = ref(0)

const selectedBank = computed(() => {
    return banks[selectedBankIndex.value]
})

const activeSweeps = ref<(Sweep | undefined)[]>([])

const selectedBankButtons = computed<Button[]>((): Button[] => {
    return selectedBank.value.buttons
})

const handleButtonClick = (index: number) => {
    const button = selectedBankButtons.value[index]
    if ('controller' in button) {
        dawMidiOutput.value?.channels[button.channel].sendControlChange(button.controller, 127)
    }
}

function findButtonByChannelAndController(channel: number, controller: number): Button | undefined {
    return banks[selectedBankIndex.value].buttons.find((button) => {
        if (!('controller' in button)) {
            return false
        }
        return button.channel === channel && button.controller === controller
    })
}


onPedalEvent((event) => {
    const controller = (event.message.dataBytes[0] % 4) + 1
    console.log(`From Pedal: CH: ${event.message.channel} CT: ${controller} (${event.message.dataBytes[0] }) ${event.message.dataBytes[1]}`)
    const button = findButtonByChannelAndController(event.message.channel, controller)
    if (!button || !('controller' in button)) {
        console.log('Button not found')
        return
    }
    console.log(`Button found: ${button.name}`)
    dawMidiOutput.value?.channels[button.channel].sendControlChange(controller, 127)
})

</script>

<template>
    <MainLayout>
        <template v-slot:top-bar>
            <div class="preset-bar grid grid-cols-[1fr_auto]">
                <span class="text-4xl justify-self-center">{{ selectedBank.name }}</span>
            </div>
        </template>

        <template v-slot:buttons>
            <div class="h-full grid grid-cols-[1fr_auto] gap-4">
                <div class="h-full grid-layout grid grid-cols-4 gap-4 p-4">
                    <template v-for="(button, index) in selectedBankButtons"
                              :key="button.name">
                        <PedalButton
                                :style="{ 'order': index < 5 ? index + 6 : index - 6 }"
                                :button="button"
                                @click="handleButtonClick(index)"
                        ></PedalButton>
                    </template>
                </div>
            </div>

        </template>
    </MainLayout>
</template>

<style scoped>
</style>
