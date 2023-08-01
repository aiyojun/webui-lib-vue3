<script setup lang="ts">

import {GitChange} from "./git.generic.ts";
import GitChangedPlace from "./GitChangedPlace.vue";
import SvgOf from "./ui/SvgOf.vue";

const props = defineProps<{change: GitChange}>()
const emit = defineEmits<{(event: 'close'): void}>()

</script>

<template>
  <div class="container">
    <div class="bg-sec" style="display: flex; justify-content: space-between; align-items: center; height: calc(2rem - 1px); margin-bottom: 1px; box-sizing: border-box;">
      <div style="box-sizing: border-box; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding-left: .75rem;">{{change.file}}</div>
      <div class="close-page fc state-hover" @click="() => {emit('close')}">
        <SvgOf name="close" :width="18" :height="18" color="#fff" />
      </div>
    </div>
    <div style="position: relative; overflow: auto;">
      <GitChangedPlace v-for="(place, pi) in change.places" :key="`${pi}${place.text}`" :location="place.location" :text="place.text" />
    </div>
  </div>
</template>

<style scoped>

.container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.container>div {
  width: 100%;
}

.close-page {
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}


</style>