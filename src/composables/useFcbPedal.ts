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
        name: 'Luis',
        buttons: [
            {name: 'Play', type: 'trigger', controller: 1, channel: 1},
            {name: 'Stop', type: 'trigger', controller: 2, channel: 1},
            {name: 'Previous', type: 'trigger', controller: 3, channel: 1},
            {name: 'Next', type: 'trigger', controller: 4, channel: 1},
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
