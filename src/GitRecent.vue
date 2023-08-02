<script setup lang="ts">

import {basename} from "./utils/jlib.ts";

defineProps<{repos: Array<string>}>()
const emit = defineEmits<{
  (event: 'openRepo', value: string): void,
}>()

</script>

<template>
  <div class="recent-repo">
    <div class="inner-cover">
      <div class="recent-title">Recent Access</div>
      <div style="height: calc(100% - 3rem); width: 100%; overflow: auto;">
        <div class="one-repo" v-for="(repo, ir) in repos" :key="repo + ir" @click="() => {emit('openRepo', repo)}">
          <div style="font-size: 1rem; font-weight: bold; white-space: nowrap;">{{basename(repo)}}</div>
          <div style="font-size: .75rem; color: var(--text-comment-color); white-space: nowrap;">{{repo}}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.recent-repo {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color: var(--text-primary-color);
  box-sizing: border-box;
  padding: 2rem;
}

.recent-title {
  font-size: 1.25rem;
  font-weight: bold;
  height: 3rem;
  width: 100%;
  padding-left: 2rem;
  //box-sizing: border-box;
  //padding: 0 2rem;
}

.inner-cover {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding-top: 1rem;
  background-color: rgba(255,255,255,.05);
}

.one-repo {
  width: 100%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  margin-top: .5rem;
  box-sizing: border-box;
  padding: .5rem 2rem;
}

.one-repo:hover {
  background-color: rgba(24, 144, 255, 0.1);
}

</style>