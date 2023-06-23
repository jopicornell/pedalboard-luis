// Function that exports
import {Bank} from '../types/Bank';
import {useFileSystemAccess} from '@vueuse/core';
import {banksToUno2} from '../utils/uno2-parser';
import {computed, reactive, Ref} from 'vue';
import {Input, Output} from 'webmidi';
import {MidiMessageType} from "../types/MidiMessage";

export async function exportFcb(banks: Bank[]) {
    await navigator.clipboard.writeText(banksToUno2(banks))
    const fileSystem = useFileSystemAccess({
        dataType: 'Text',
    })
    // await fileSystem.create({suggestedName: 'fcb.txt'})
    fileSystem.data.value = banksToUno2(banks)
    // await fileSystem.save()
}


const banks = reactive<Bank[]>([
    {
        name: 'Direct Bank',
        buttons: [
            {name: 'Tap tempo', type: 'trigger', controller: 0, channel: 1},
            {name: 'Looper rec', type: 'trigger', controller: 1, channel: 1},
            {name: 'Looper play', type: 'trigger', controller: 2, channel: 1},
            {name: 'Looper add', type: 'trigger', controller: 3, channel: 1},
            {name: 'Looper stop', type: 'trigger', controller: 4, channel: 1},
            {name: 'Looper clear', type: 'trigger', controller: 5, channel: 1},
            {name: 'Looper reverse', type: 'trigger', controller: 6, channel: 1},
            {name: 'Looper %2', type: 'trigger', controller: 7, channel: 1},
            {
                name: 'Looper x2', type: 'trigger', controller: 8, channel: 1,
                onMessages: [
                    {channel: 1, controller: 22, value: 127, type: MidiMessageType.ControlChange},
                ],
                offMessages: [
                    {channel: 1, controller: 23, value: 127, type: MidiMessageType.ControlChange},
                ],
            },
        ],
    },
    {
        name: 'General Bank',
        buttons: [
            {
                name: 'Overdrive', type: 'effect', controller: 10, channel: 1,
                onMessages: [
                    {channel: 1, controller: 22, value: 127, type: MidiMessageType.ControlChange},
                ],
                offMessages: [
                    {channel: 1, controller: 23, value: 127, type: MidiMessageType.ControlChange},
                ],
            },
            {name: 'Fuzz', type: 'effect', controller: 11, channel: 1},
            {name: 'Screamer', type: 'effect', controller: 12, channel: 1},
            {name: 'Delay', type: 'effect', controller: 13, channel: 1},
            {name: 'Reverb', type: 'effect', controller: 14, channel: 1},
            {
                name: 'Clean Amp',
                type: 'program',
                controller: 15,
                messages: [
                    {channel: 1, controller: 19, value: 127, type: MidiMessageType.ControlChange},
                    {channel: 1, controller: 20, value: 0, type: MidiMessageType.ControlChange},
                    {channel: 1, controller: 21, value: 0, type: MidiMessageType.ControlChange},
                ],
                channel: 1
            },
            {name: 'EdgeBreak Amp', type: 'program', controller: 16, channel: 1},
            {name: 'Cloudy', type: 'program', controller: 17, channel: 1},
            {name: 'Hi gain', type: 'program', controller: 18, channel: 1},
        ],
    },
    {
        name: 'Calabruix',
        buttons: [
            {
                name: 'Overdrive2', type: 'effect', controller: 20, channel: 1,
                sweeps: [
                    {controller: 100, channel: 1, min: 0, max: 127, name: 'Gain', curve: 'linear', pedal: 1},
                    {controller: 101, channel: 1, min: 0, max: 127, name: 'Sustain', curve: 'linear', pedal: 2},
                ]
            },
            {name: 'Delay2', type: 'effect', controller: 21, channel: 1},
            {name: 'Reverb2', type: 'effect', controller: 22, channel: 1},
            {name: 'Freeze2', type: 'effect', controller: 23, channel: 1},
            {name: 'Compressor2', type: 'effect', controller: 24, channel: 1},
            {
                name: 'Preset 1',
                type: 'program',
                controller: 25,
                channel: 1,
            },
            {name: 'Preset 2', type: 'program', controller: 26, channel: 1},
            {
                name: 'Activate Pad', type: 'effect', controller: 27, channel: 1,
                onMessages: [
                    {channel: 1, controller: 29, value: 127, type: MidiMessageType.ControlChange},
                ],
                offMessages: [
                    {channel: 1, controller: 30, value: 127, type: MidiMessageType.ControlChange},
                ],
            },
            {name: 'Activate Voice ', type: 'effect', controller: 28, channel: 1},
        ],
    },
])


export const useFcbPedal = (pedalInput: Ref<Input | null>, pedalOutput: Ref<Output | null>) => {
    const goToBank = (bankNumber: number) => {
        pedalOutput.value?.channels[16].sendControlChange(0, bankNumber)
    }
    const hasDirectBank = computed(() => banks.some(bank => bank.name === 'Direct Bank'))

    return {
        exportFcb: () => exportFcb(banks),
        banks,
        hasDirectBank,
        goToBank,
    }
}
