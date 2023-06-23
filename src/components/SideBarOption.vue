<script setup lang="ts">

import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import {IconProp} from "@fortawesome/fontawesome-svg-core";

interface Props {
    icon: IconProp
}

const props = defineProps<Props>()
</script>x

<template>
    <li>
        <a href="#"
           class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
            <FontAwesomeIcon :icon="props.icon" class="w-5 h-5 dark:text-gray-400"/>
            <span class="ml-3"><slot></slot></span>
        </a>
    </li>
</template>

<style scoped>

</style>