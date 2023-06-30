<script setup lang="ts">
import {ref} from "vue";
import ConfigModal from "../components/ConfigModal.vue";
import SideBar from "../components/SideBar.vue";
import SideBarOption from "../components/SideBarOption.vue";
import {useFcbPedal} from "../composables/useFcbPedal";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import {Button} from "../types/Button";
import {useRouter} from "vue-router";

const {
    exportFcb,
    banks,
    hasDirectBank
} = useFcbPedal(ref(null), ref(null))
const router = useRouter()

const configModal = ref<InstanceType<typeof ConfigModal> | null>(null)

const openedSideBar = ref(false)

const pedalBoardClasses = ref({
    'pedal-board--side-bar-open': openedSideBar
})

function goToSimulator() {
    router.push({name: "PedalSimulator"})
}

function toggleSideBar() {
    openedSideBar.value = !openedSideBar.value
}
</script>

<template>
    <div class="pedal-board" :class="pedalBoardClasses">
        <div class="preset-bar grid grid-cols-[1fr_auto] p-8">
            <slot name="top-bar"></slot>
            <button class="config-icon justify-self-end self-start" @click="toggleSideBar">
                <font-awesome-icon size="xl" icon="fa-solid fa-bars"/>
            </button>
        </div>
        <div class="buttons">
            <slot name="buttons"></slot>
        </div>
        <SideBar class="side-bar" v-if="openedSideBar">
            <SideBarOption icon="grip">
                Pedal Board
            </SideBarOption>
            <SideBarOption icon="vial-circle-check" @click="goToSimulator">
                Simulator
            </SideBarOption>
            <SideBarOption icon="clipboard" @click="exportFcb">
                UnO2 to clipboard
            </SideBarOption>
            <hr class="border-gray-400"/>
            <SideBarOption icon="cog" @click="configModal?.open()">
                Config
            </SideBarOption>
        </SideBar>
    </div>

    <ConfigModal
            ref="configModal"
    />
</template>

<style scoped>
.pedal-board {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas:
            "preset-bar"
            "buttons";
    width: 100vw;
    height: 100vh;
}

.pedal-board--side-bar-open {
    grid-template-columns: 1fr auto;
    grid-template-areas:
            "preset-bar side-bar"
            "buttons side-bar";
}

.buttons {
    grid-area: buttons;
}

.preset-bar {
    grid-area: preset-bar;
}

.side-bar {
    grid-area: side-bar;
}
</style>
