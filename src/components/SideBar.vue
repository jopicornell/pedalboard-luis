<script setup lang="ts">
</script>

<template>
  <div class="max-w-2xl mx-auto h-full">

    <aside class="w-64 h-full" aria-label="Sidebar">
      <div class="px-3 py-4 overflow-y-auto rounded bg-gray-50 dark:bg-gray-800 h-full">
        <ul class="space-y-2">
            <slot></slot>
        </ul>
      </div>
    </aside>
  </div>
</template>

<style scoped>

</style>