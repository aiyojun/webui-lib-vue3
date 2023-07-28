<script setup lang="ts">

import {GitProject} from "./utils/git.ts";
import SvgOf from "./ui/SvgOf.vue";
import {onMounted, reactive} from "vue";
import {mapChangeColor, mapChangeIcon} from "./git.declare.ts";

const props = defineProps<{ project: GitProject }>()
const rd = reactive({staged: [], unstaged: []})

onMounted(() => {
  rd.staged   = reactive(props.project.changes.filter(c=> c.staged).map(c => ({staged: c.staged, flag: c.flag, file: c.file, hover: false})))
  rd.unstaged = reactive(props.project.changes.filter(c=>!c.staged).map(c => ({staged: c.staged, flag: c.flag, file: c.file, hover: false})))
})

</script>

<template>
  <div style="height: calc(100% - 10rem); box-sizing: border-box;">
    <div style="height: calc(50% - 1px); margin-bottom: 1px;">
      <div class="bg-sec nav-header">Unstaged Changes</div>
      <div class="bg-sec" style="width: 100%; height: calc(100% - 2rem); box-sizing: border-box; padding: .75rem; overflow: auto;">
        <div v-for="(change, ci) in rd.unstaged"
             class="git-change state-hover"
             @mouseenter="() => {rd.unstaged[ci].hover = true;}"
             @mouseleave="() => {rd.unstaged[ci].hover = false;}">
          <div style="width: 18px; height: 18px;" class="fc">
            <SvgOf :name="mapChangeIcon(change.flag)" :width="18" :height="18" :fill="mapChangeColor(change.flag)" />
          </div>
          <div style="margin-left: .75rem;">{{change.file}}</div>
          <div v-if="rd.unstaged[ci].hover" style="position: absolute; top: 0; right: 0; height: 100%; display: flex; align-items: center;">
            <div class="btn-stage" style="margin-right: .5rem;">Stage</div>
            <div class="btn-stage" style="background-color: #555555;">Ignore</div>
          </div>
        </div>
      </div>
    </div>
    <div style="height: calc(50% - 1px); margin-bottom: 1px;">
      <div class="bg-sec nav-header">Staged Changes</div>
      <div class="bg-sec" style="width: 100%; height: calc(100% - 2rem); box-sizing: border-box; padding: .75rem; overflow: auto;">
        <div v-for="(change, ci) in rd.staged" class="git-change state-hover"
             @mouseenter="() => {rd.staged[ci].hover = true;}"
             @mouseleave="() => {rd.staged[ci].hover = false;}">
          <div style="width: 18px; height: 18px;" class="fc">
            <SvgOf :name="mapChangeIcon(change.flag)" :width="18" :height="18" :fill="mapChangeColor(change.flag)" />
          </div>
          <div style="margin-left: .75rem;">{{change.file}}</div>
          <div v-if="rd.staged[ci].hover" style="position: absolute; top: 0; right: 0; height: 100%; display: flex; align-items: center;">
            <div class="btn-stage" style="background-color: red;">Unstage</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div style="height: 10rem;">
    <div class="bg-sec nav-header">Commit Message</div>
    <div class="bg-sec" style="width: 100%; height: calc(100% - 2rem); box-sizing: border-box; padding: 0 .75rem;">
      <textarea></textarea>
      <div style="display: flex;">
        <div class="btn-pretty fc" style="width: calc(45% - 4px); margin-right: 4px;">Commit</div>
        <div class="btn-pretty fc" style="width: calc(55%);">Commit and Push</div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.git-change {
  position: relative;
  height: 2rem;
  width: 100%;
  box-sizing: border-box;
  padding: 0 .75rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


.btn-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0 .5rem;
  background-color: green;
  border-radius: 4px;
  height: 1.75rem;
}

.btn-stage:hover {
  opacity: .9;
}


</style>