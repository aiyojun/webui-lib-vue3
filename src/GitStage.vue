<script setup lang="ts">

import {GitProject} from "./git.web.ts";
import SvgOf from "./ui/SvgOf.vue";
import {onMounted, reactive, ref} from "vue";
import {GitChange, mapChangeColor, mapChangeIcon} from "./git.generic.ts";
import NoData from "./NoData.vue";

const props = defineProps<{ project: GitProject }>()
const rd = reactive({staged: [], unstaged: []})
const message = ref<HTMLTextAreaElement>()

const emit = defineEmits<{
  (event: 'clickStage', value: string): void,
  (event: 'clickIgnore', value: string): void,
  (event: 'clickUnstage', value: string): void,
  (event: 'clickCommit', value: string): void,
  (event: 'clickCommitWithPush', value: string): void,
  (event: 'showFileChange', value: GitChange): void,
}>()

function commit() {emit('clickCommit', message.value.value)}
function commitWithPush() {emit('clickCommitWithPush', message.value.value)}
function convert2origin(c) {
  const x = props.project.changes.filter(_c => _c.file === c.file)[0]
  console.info("x :", x)
  return x
}

onMounted(() => {
  rd.staged   = reactive(props.project.changes.filter(c=> c.staged).map(c => ({staged: c.staged, flag: c.flag, file: c.file, hover: false})).sort((a,b)=>a.file.localeCompare(b.file)))
  rd.unstaged = reactive(props.project.changes.filter(c=>!c.staged).map(c => ({staged: c.staged, flag: c.flag, file: c.file, hover: false})).sort((a,b)=>a.file.localeCompare(b.file)))
})

</script>

<template>
  <div style="height: calc(100% - 10rem); box-sizing: border-box;">
    <div style="height: calc(50% - 1px); margin-bottom: 1px;">
      <div class="bg-sec nav-header">Unstaged Changes</div>
      <div class="bg-sec bg-stage">

        <NoData v-if="rd.unstaged.length === 0" />

        <div v-for="(change, ci) in rd.unstaged"
             class="git-change state-hover"
             @click="() => {emit('showFileChange', convert2origin(change))}"
             @mouseenter="() => {rd.unstaged[ci].hover = true;}"
             @mouseleave="() => {rd.unstaged[ci].hover = false;}">
          <div style="width: 18px; height: 18px;" class="fc">
            <SvgOf :name="mapChangeIcon(change.flag)" :width="18" :height="18" :color="mapChangeColor(change.flag)" />
          </div>
          <div style="margin-left: .75rem;">{{change.file}}</div>
          <div v-if="rd.unstaged[ci].hover" style="position: absolute; top: 0; right: 0; height: 100%; display: flex; align-items: center;">
            <div class="btn-stage" @click="(e) => {e.stopPropagation();emit('clickStage', change.file)}"
                 style="margin-right: .5rem;"
            >Stage</div>
            <div class="btn-stage" @click="(e) => {e.stopPropagation();emit('clickIgnore', change.file)}" style="background-color: #555555;">Ignore</div>
          </div>
        </div>
      </div>
    </div>
    <div style="height: calc(50% - 1px); margin-bottom: 1px;">
      <div class="bg-sec nav-header">Staged Changes</div>
      <div class="bg-sec bg-stage">

        <NoData v-if="rd.staged.length === 0" />

        <div v-for="(change, ci) in rd.staged"
             class="git-change state-hover"
             @click="() => {emit('showFileChange', convert2origin(change))}"
             @mouseenter="() => {rd.staged[ci].hover = true;}"
             @mouseleave="() => {rd.staged[ci].hover = false;}">
          <div style="width: 18px; height: 18px;" class="fc">
            <SvgOf :name="mapChangeIcon(change.flag)" :width="18" :height="18" :color="mapChangeColor(change.flag)" />
          </div>
          <div style="margin-left: .75rem;">{{change.file}}</div>
          <div v-if="rd.staged[ci].hover" style="position: absolute; top: 0; right: 0; height: 100%; display: flex; align-items: center;">
            <div class="btn-stage" @click="() => {emit('clickUnstage', change.file)}" style="background-color: red;">Unstage</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div style="height: 10rem;">
    <div class="bg-sec nav-header">Commit Message</div>
    <div class="bg-sec" style="width: 100%; height: calc(100% - 2rem); box-sizing: border-box; padding: 0 .75rem;">
      <textarea ref="message"></textarea>
      <div style="display: flex;">
        <div class="btn-pretty fc" @click="() => {commit()}" style="width: calc(45% - 4px); margin-right: 4px;">Commit</div>
        <div class="btn-pretty fc" @click="() => {commitWithPush()}" style="width: calc(55%);">Commit and Push</div>
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

textarea {
  box-sizing: border-box;
  background-color: var(--primary-background-color);
  border: 1px solid rgba(255, 255, 255, .25);
  border-radius: 6px;
  height: calc(100% - 3rem);
  width: 100%;
  resize: none;
  outline: none;
  font-size: .75rem;
  font-family: Roboto, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

.bg-stage {
  position: relative;
  //background-color: var(--primary-background-color);
  padding: .75rem;
  box-sizing: border-box;
  width: 100%;
  //width: calc(100% - 1.5rem);
  //margin: .75rem;
  height: calc(100% - 2rem);
  overflow: auto;
}


</style>