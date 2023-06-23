<script setup lang="ts">
import {Button} from "../types/Button";

interface Emits {
  (event: 'click', button: Button | undefined): void
}

interface Props {
  button?: Button
}

const emit = defineEmits<Emits>()
const props = defineProps<Props>()

</script>

<template>
  <button
      class="text-white focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:focus:ring-gray-700 dark:border-gray-700"

      @click="emit('click', props.button ?? undefined)"
      :class="{ 'bg-cyan-800 hover:bg-cyan-900': props.button?.enabled, 'bg-gray-700 hover:bg-gray-800': !props.button?.enabled }"
  >{{ props.button?.name }}
    <template v-if="$slots.default">
      <slot/>
    </template>
  </button>
</template>

<style scoped>

</style>