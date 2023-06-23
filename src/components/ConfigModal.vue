<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useMidi} from "../composables/useMidi";

const dialog = ref<HTMLDialogElement | null>(null)

const {
    dawMidiOutput,
    midiOutputs,
    dawMidiInput,
    pedalMidiOutput,
    pedalMidiInput,
    midiInputs,
} = useMidi()

const open = async () => {
    dialog.value?.showModal()
}

onMounted(() => {
    dialog.value?.addEventListener('click', function (event) {
        if (event.target === dialog.value) {
            dialog.value?.close();
        }
    });
})

const close = () => {
    dialog.value?.close()
}

interface Expose {
    open: () => void
    close: () => void
}

defineExpose<Expose>({
    open,
    close
})
</script>

<template>
    <dialog ref="dialog" class="w-2/3 h-full overflow-y-hidden backdrop:backdrop-blur-md bg-transparent p-0">
        <div class="config-modal h-full rounded-lg border dark:border-gray-600 shadow-xl bg-transparent">

            <div
                    class="flex flex-row justify-between p-6 dark:bg-gray-800 border-b dark:text-gray-100 dark:border-gray-700 rounded-tl-lg rounded-tr-lg"
            >
                <p class="font-semibold">Add a step</p>
                <svg
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                    ></path>
                </svg>
            </div>
            <div class="flex flex-col px-6 py-5 dark:bg-gray-900 overflow-y-auto">
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

                <hr />

                <div class="flex items-center mt-5 mb-3 space-x-4">
                    <input
                            class="inline-flex rounded-full"
                            type="checkbox"
                            id="check1"
                            name="check1"
                    />
                    <label class="inline-flex font-semibold dark:text-white" for="check1">
                        Add a crew</label
                    ><br />
                    <input
                            class="inline-flex"
                            type="checkbox"
                            id="check2"
                            name="check2"
                            checked
                    />
                    <label class="inline-flex font-semibold text-blue-300" for="check2">
                        Add a specific agent</label
                    ><br />
                </div>
                <div
                        class="flex flex-row items-center justify-between p-5 dark:bg-gray-800 border border-gray-200 rounded shadow-sm"
                >
                    <div class="flex flex-row items-center">
                        <img
                                class="w-10 h-10 mr-3 rounded-full"
                                src="https://randomuser.me/api/portraits/lego/7.jpg"
                                alt=""
                        />
                        <div class="flex flex-col">
                            <p class="font-semibold dark:text-gray-100">Xu Lin Bashir</p>
                            <p class="text-gray-200">table.co</p>
                        </div>
                    </div>
                    <h1 class="font-semibold text-red-300">Remove</h1>
                </div>
            </div>
            <div
                    class="flex flex-row items-center justify-between p-5 dark:bg-gray-800 border-t dark:border-gray-700 rounded-bl-lg rounded-br-lg"
            >
                <p class="font-semibold dark:text-gray-200">Cancel</p>
                <button class="px-4 py-2 text-white font-semibold bg-blue-500 rounded">
                    Save
                </button>
            </div>
        </div>
    </dialog>

</template>

<style scoped>
.config-modal {
    display: grid;
    grid-template-rows: auto max(1fr) auto;
}
</style>