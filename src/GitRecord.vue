<script setup lang="ts">

import {GitChange, GitCommit, mapChangeColor, mapChangeIcon} from "./git.declare.ts";
import SvgOf from "./ui/SvgOf.vue";
import {onMounted, reactive} from "vue";

const props = defineProps<{commit: GitCommit, changes: Array<GitChange>}>()

// const rd = reactive({changes: []})
//
// onMounted(() => {
//   rd.changes = reactive(props.changes.filter(c=> c.staged).map(c => ({staged: c.staged, flag: c.flag, file: c.file, hover: false})))
// })

</script>

<template>
  <div style="height: 100%; box-sizing: border-box;">
    <div class="bg-sec nav-header">Commit Record</div>
    <div class="bg-sec" style="height: calc(14rem - 1px); margin-bottom: 1px; box-sizing: border-box; padding: 0 1.5rem;">
      <div class="record-detail">
        <div>ID</div><div>{{commit.id.substring(0, 6)}}</div>
      </div>
      <div class="record-detail">
        <div>Parent ID</div><div>{{commit.idParent.substring(0, 6)}}</div>
      </div>
      <div class="record-detail">
        <div>Author</div><div>{{commit.author.name}}</div>
      </div>
      <div class="record-detail">
        <div>Email</div><div>{{commit.author.mail}}</div>
      </div>
      <div class="record-detail">
        <div>Date</div><div>{{new Date(commit.date).toISOString().substring(0, 19).replace('T', ' ')}}</div>
      </div>
      <div class="record-detail" style="height: 4rem; align-items: flex-start; flex-direction: column;">
<!--        <div style="height: 4rem; width: 100%;">{{commit.message}}</div>-->
        <textarea>
          {{commit.message}}
        </textarea>
      </div>
    </div>

    <div class="bg-sec nav-header">Changes ({{changes.length}})</div>
    <div class="bg-sec" style="height: calc(100% - 16rem); width: 100%; box-sizing: border-box; padding: .75rem; overflow: auto;">
      <div v-for="(change, ci) in changes"
           class="git-change state-hover">
        <div style="width: 18px; height: 18px;" class="fc">
          <SvgOf :name="mapChangeIcon(change.flag)" :width="18" :height="18" :fill="mapChangeColor(change.flag)" />
        </div>
        <div style="margin-left: .75rem;">{{change.file}}</div>
<!--        <div v-if="rd.changes[ci].hover" style="position: absolute; top: 0; right: 0; height: 100%; display: flex; align-items: center;">-->
<!--          <div class="btn-stage" style="margin-right: .5rem;">Stage</div>-->
<!--          <div class="btn-stage" style="background-color: #555555;">Ignore</div>-->
<!--        </div>-->
      </div>
    </div>



  </div>
</template>

<style scoped>

.record-detail {
  height: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

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

</style>