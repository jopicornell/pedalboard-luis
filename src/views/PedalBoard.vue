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
} = await useMidi()
const {
    banks,
    hasDirectBank
} = useFcbPedal(pedalMidiInput as Ref<Input | null>, pedalMidiOutput as Ref<Output | null>)

const selectedBankIndex = ref(1)

const selectedBank = computed(() => {
    return banks[selectedBankIndex.value]
})

const activeSweeps = ref<(Sweep | undefined)[]>([])

const selectedBankButtons = computed<Button[]>((): Button[] => {
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
    const hasDirectBank = banks[0].name === "Direct Bank"
    if (selectedBankIndex.value < banks.length - 1) {
        selectedBankIndex.value++
    } else {
        selectedBankIndex.value = hasDirectBank ? 1 : 0
    }
    pedalMidiOutput.value?.channels[16].sendProgramChange(15)
}

const handleBankDown = () => {
    const hasDirectBank = banks[0].name === "Direct Bank"
    if (selectedBankIndex.value > 1 && hasDirectBank) {
        selectedBankIndex.value--
    } else if (selectedBankIndex.value > 0 && !hasDirectBank) {
        selectedBankIndex.value--
    } else {
        selectedBankIndex.value = banks.length - 1
    }
    pedalMidiOutput.value?.channels[16].sendProgramChange(14)
}

const handleButtonPressedFromPedal = (button: Button, event: MessageEvent) => {
    if (button.type === "effect" && event.rawValue !== undefined) {
        button.enabled = event.rawValue > 0
        console.log(`Button ${button.name} is now ${event.rawValue > 0 ? "enabled" : "disabled"}`, event)
        if (!button.onMessages || !button.offMessages) {
            console.log(`Button has no on/off messages, sending CC message to daw output controller ${button.controller} with value ${event.rawValue}`)
            dawMidiOutput.value?.channels[button.channel].sendControlChange(button.controller, event.rawValue)
        }
        if (button.onMessages && button.enabled) {
            console.log("Sending on messages", button.onMessages)
            button.onMessages.forEach((message) => {
                dawMidiOutput.value?.channels[button.channel].send(getRawMidiMessage(message))
            })
        }
        if (button.offMessages && !button.enabled) {
            console.log("Sending off messages", button.offMessages)
            button.offMessages.forEach((message) => {
                dawMidiOutput.value?.channels[button.channel].send(getRawMidiMessage(message))
            })
        }
        if (button.sweeps) {
            button.sweeps.forEach((sweep) => {
                activeSweeps.value[sweep.pedal - 1] = button.enabled ? sweep : undefined
            })
        }
    }
    if (button.type === "trigger" && event.rawValue !== undefined) {
        button.enabled = event.rawValue > 0
        if (button.controller && typeof (event.value) === "number") {
            dawMidiOutput.value?.channels[button.channel].sendControlChange(button.controller, event.value)
        }
        if (button.onMessages) {
            button.onMessages.forEach((message) => {
                dawMidiOutput.value?.channels[button.channel].send(getRawMidiMessage(message))
            })
        }
        if (button.offMessages) {
            button.offMessages.forEach((message) => {
                dawMidiOutput.value?.channels[button.channel].send(getRawMidiMessage(message))
            })
        }
    }
    if (button.type === "program") {
        banks[selectedBankIndex.value].buttons.forEach((buttonFiltered, index) => {
            if (buttonFiltered.type === 'program') {
                banks[selectedBankIndex.value].buttons[index].enabled = button === buttonFiltered
            }
        })
        dawMidiOutput.value?.channels[button.channel].sendControlChange(button.controller, 127)
        if (button.messages) {
            button.messages.forEach((message) => {
                dawMidiOutput.value?.channels[button.channel].send(getRawMidiMessage(message))
            })
        }
    }
}

function findBankIndexFromPedal(controller: number, channel: number, buttonTypes: Button['type'][] = ['effect', 'trigger', 'program']) {
    return banks.findIndex(bank =>
        bank.buttons.find(button =>
            buttonTypes.includes(button.type) &&
            "controller" in button && button.controller === controller && button.channel === channel
        ) ||
        bank.buttons.find(button => button.sweeps && button.sweeps.find(sweep => sweep.controller === controller && sweep.channel === channel))
    )
}

interface InfoFromDaw {
    bankIndex: number
    buttonIndex: number
    enableButton: boolean
}

function getInfoFromDawByButtonController(controller: number, channel: number, value: number): InfoFromDaw | null {
    let foundButtonIndex = -1
    const foundBankByButtonControllerIndex = banks.findIndex(bank => {
        const buttonIndex = bank.buttons.findIndex(button =>
            ((button.type === 'effect' || button.type === 'trigger') && (button.controller === controller && button.channel === channel))
        )
        if (buttonIndex > -1) {
            foundButtonIndex = buttonIndex
            return true
        }
    })
    if (foundBankByButtonControllerIndex > -1) {
        return {
            bankIndex: foundBankByButtonControllerIndex,
            buttonIndex: foundButtonIndex,
            enableButton: value > 0
        }
    }
    return null
}

function getInfoFromDawByOnMessages(controller: number, channel: number, value: number): InfoFromDaw | null {
    let foundButtonIndex = -1
    const foundBankByOnMessagesIndex = banks.findIndex(bank => {
        const buttonIndex = bank.buttons.findIndex(button =>
            ((button.type === 'effect' || button.type === 'trigger') && button.onMessages && button.onMessages.find(message => message.controller === controller && message.channel === channel))
        )
        if (buttonIndex > -1) {
            foundButtonIndex = buttonIndex
            return true
        }
    })
    if (foundBankByOnMessagesIndex > -1) {
        return {
            bankIndex: foundBankByOnMessagesIndex,
            buttonIndex: foundButtonIndex,
            enableButton: true
        }
    }
    return null
}

function getInfoFromDawByOffMessages(controller: number, channel: number, value: number): InfoFromDaw | null {
    let foundButtonIndex = -1
    const foundBankByOffMessagesIndex = banks.findIndex(bank => {
        const buttonIndex = bank.buttons.findIndex(button =>
            ((button.type === 'effect' || button.type === 'trigger') && button.offMessages && button.offMessages.find(message => message.controller === controller && message.channel === channel))
        )
        if (buttonIndex > -1) {
            foundButtonIndex = buttonIndex
            return true
        }
    })
    if (foundBankByOffMessagesIndex > -1) {
        return {
            bankIndex: foundBankByOffMessagesIndex,
            buttonIndex: foundButtonIndex,
            enableButton: false
        }
    }
    return null
}

function getInfoFromDaw(controller: number, channel: number, value: number): InfoFromDaw | null {
    const infoFromDawByButtonController = getInfoFromDawByButtonController(controller, channel, value)
    if (infoFromDawByButtonController) {
        return infoFromDawByButtonController
    }
    const infoFromDawByOnMessages = getInfoFromDawByOnMessages(controller, channel, value)
    if (infoFromDawByOnMessages) {
        return infoFromDawByOnMessages
    }
    const infoFromDawByOffMessages = getInfoFromDawByOffMessages(controller, channel, value)
    if (infoFromDawByOffMessages) {
        return infoFromDawByOffMessages
    }
    return null
}

onPedalEvent((event) => {
    const controller = event.message.dataBytes[0]
    const foundBankIndex = findBankIndexFromPedal(controller, event.message.channel)
    console.log(`event with ${controller} on channel ${event.message.channel} with value ${event.message.dataBytes[1]}`)
    if (event.message.channel === 15) {
        selectedBankIndex.value = event.message.dataBytes[0]
    }
    if (event.message.type === 'programchange' && foundBankIndex > -1) {
        const button = banks[foundBankIndex].buttons
            .find(button =>
                button.type === 'program' && button.controller === controller && button.channel === event.message.channel
            )
        if (button) {
            handleButtonPressedFromPedal(button, event)
        }
    }
    if (event.message.type === 'controlchange' && foundBankIndex > -1) {
        const controller = event.message.dataBytes[0]
        const foundBankIndex = findBankIndexFromPedal(controller, event.message.channel, ['effect', 'trigger'])
        const button = banks[foundBankIndex].buttons.find(button =>
            (button.type === 'effect' || button.type === 'trigger') &&
            button.controller === controller && button.channel === event.message.channel
        )

        const sweep = banks[foundBankIndex].buttons
            .flatMap(button =>
                button.sweeps
            ).find(sweep =>
                sweep?.controller === controller && sweep.channel === event.message.channel
            )

        if (button) {
            console.log('found button')
            handleButtonPressedFromPedal(button, event)
        }
        if (sweep) {
            sweep.value = event.message.dataBytes[1]
        }
        if (!button && !sweep) {
            console.log(`No handler for midi. Sending control change ${controller} with value ${event.message.dataBytes[1]} to DAW`)
            dawMidiOutput.value?.channels[event.message.channel].sendControlChange(controller, event.message.dataBytes[1])
        }
    }

})

function updateButtonStatusByMessage(message: Message) {

}

function findButtonByMessage(message: Message) {

}

onDawEvent((event) => {
    console.log(`DAW sent ${event.message.type} on channel ${event.message.channel} for controller ${event.message.dataBytes[0]} with value ${event.message.dataBytes[1]}`)
    if (event.message.type === 'controlchange') {
        const controller = event.message.dataBytes[0]
        const { bankIndex, buttonIndex, enableButton } = getInfoFromDaw(controller, event.message.channel, event.message.dataBytes[1])

        const button = banks[bankIndex].buttons[buttonIndex]
        if (button) {
            if (selectedBankIndex.value === bankIndex) {
                const effectEnabled = event.message.dataBytes[1] > 0
                if (button.type === "effect" && button.enabled !== effectEnabled) {
                    pedalMidiOutput.value?.channels[16].sendProgramChange(buttonIndex)
                }

            } else {
                button.enabled = enableButton
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
    <MainLayout>
        <template v-slot:top-bar>
            <div class="preset-bar grid grid-cols-[1fr_auto]">
                <span class="text-4xl justify-self-center">{{ selectedBank.name }}</span>
            </div>
        </template>

        <template v-slot:buttons>
            <div class="h-full grid grid-cols-[1fr_auto] gap-4">
                <div class="h-full grid-layout grid grid-cols-6 gap-4 p-4">
                    <template v-for="(button, index) in selectedBankButtons"
                              :key="button.name">
                        <PedalButton
                                :style="{ 'order': index < 5 ? index + 6 : index - 6 }"
                                :button="button"
                                @click="handleButtonClick(index)"
                        ></PedalButton>

                        <PedalButton
                                v-if="index === 4 || index === 9"
                                :style="{ 'order': index+1 }"
                                @click="index === 4 ? handleBankUp() : handleBankDown()"
                        >
                            {{ index === 4 ? 'Up' : 'Down' }}
                        </PedalButton>
                    </template>
                </div>

                <div class="h-full grid-layout grid grid-cols-2 gap-4 p-4">
                    <SweepPedal :sweep="activeSweeps[0]"></SweepPedal>
                    <SweepPedal :sweep="activeSweeps[1]"></SweepPedal>
                </div>
            </div>

        </template>
    </MainLayout>
</template>

<style scoped>
</style>
