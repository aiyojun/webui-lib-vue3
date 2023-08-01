<script setup lang="ts">

import {GitChange, GitCommit, mapChangeColor, mapChangeIcon} from "./git.generic.ts";
import SvgOf from "./ui/SvgOf.vue";
import {onMounted, reactive} from "vue";

const props = defineProps<{commit: GitCommit, changes: Array<GitChange>}>()
const emit = defineEmits<{
  (event: 'showFileChange', value: GitChange): void,
  (event: 'close'): void,
}>()

// const rd = reactive({changes: []})
//
// onMounted(() => {
//   rd.changes = reactive(props.changes.filter(c=> c.staged).map(c => ({staged: c.staged, flag: c.flag, file: c.file, hover: false})))
// })

</script>

<template>
  <div style="height: 100%; box-sizing: border-box;">


    <div class="bg-sec nav-header state-hover" style="justify-content: center; cursor: pointer; color: #85a9ff; font-weight: normal;" @click="() => {emit('close')}">View Changes</div>


    <div class="bg-sec nav-header">Commit Record</div>
    <div class="bg-sec" style="width: 100%; height: 13rem; position: relative; box-sizing: border-box; padding: .25rem .75rem;">

      <div style="width: 100%; height: 2rem; display: flex; align-items: center;">
        <div class="fc" style="justify-content: flex-start; margin-right: 1rem;">
          <SvgOf name="send" :width="16" :height="16" color="#fff" />
          <div style="margin-left: .5rem; color: #fff;">{{commit.id.substring(0, 6)}}</div>
        </div>
      </div>
      <div style="width: 100%; height: 2rem; display: flex; align-items: center;">
        <div class="fc" style="justify-content: flex-start; margin-right: 1rem;">
          <SvgOf name="user" :width="16" :height="16" color="#fff" />
          <div style="margin-left: .5rem; color: #85a9ff;">{{commit.author.name}}</div>
        </div>
        <div class="fc" style="justify-content: flex-start;">
          <SvgOf name="date" :width="16" :height="16" color="#fff" />
          <div style="margin-left: .5rem; color: #85a9ff;">{{new Date(commit.date).toISOString().substring(0, 16)}}</div>
        </div>
      </div>
      <div style="position: relative;">
        <div class="fc" style="justify-content: flex-start; position: absolute;">
          <SvgOf name="message" :width="16" :height="16" color="#fff" />
        </div>
        <pre class="git-message-content">{{commit.message.split('\n')[0]}}
{{commit.message.split('\n')[1] || ''}}</pre>
      </div>
<!--      <div style="width: 100%; height: 2rem; display: flex; align-items: center;">-->
<!--        <div class="fc" style="justify-content: flex-start;">-->
<!--          <SvgOf name="message" :width="16" :height="16" color="#fff" />-->
<!--          <div style="margin-left: .5rem; color: #fff;">{{commit.message.split('\n')[0]}}</div>-->
<!--        </div>-->
<!--      </div>-->

<!--      <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">-->
<!--        <div class="fc" style="justify-content: flex-start;">-->
<!--          <SvgOf name="user" :width="16" :height="16" color="#fff" />-->
<!--          <div style="margin-left: .5rem;">{{commit.author.name}}</div>-->
<!--        </div>-->
<!--        <div>{{commit.id.substring(0, 6)}}</div>-->
<!--      </div>-->
<!--      <div class="fc" style="justify-content: flex-start;">-->
<!--        <SvgOf name="date" :width="16" :height="16" color="#fff" />-->
<!--        <div style="margin-left: .5rem;">{{new Date(commit.date).toISOString().substring(0, 16)}}</div>-->
<!--      </div>-->
    </div>


    <div class="bg-sec nav-header">Changes ({{changes.length}})</div>
    <div class="bg-sec" style="width: 100%; height: calc(100% - 17rem - 2rem); position: relative; box-sizing: border-box; padding: .25rem .75rem; overflow: auto;">
      <div v-for="(change, ci) in changes"
           class="git-change state-hover"
           @click="() => {emit('showFileChange', change)}">
        <div style="width: 18px; height: 18px;" class="fc">
          <SvgOf :name="mapChangeIcon(change.flag)" :width="18" :height="18" :color="mapChangeColor(change.flag)" />
        </div>
        <div style="margin-left: .75rem;">{{change.file}}</div>
      </div>
    </div>



<!--    <div class="bg-sec nav-header">Commit Record</div>-->
<!--    <div class="bg-sec" style="height: calc(14rem - 1px); margin-bottom: 1px; box-sizing: border-box; padding: 0 .75rem;">-->
<!--      <div class="record-detail">-->
<!--        <div>ID</div><div>{{commit.id.substring(0, 6)}}</div>-->
<!--      </div>-->
<!--      <div class="record-detail">-->
<!--        <div>Parent ID</div><div>{{commit.idParent.substring(0, 6)}}</div>-->
<!--      </div>-->
<!--      <div class="record-detail">-->
<!--        <div>Author</div><div>{{commit.author.name}}</div>-->
<!--      </div>-->
<!--      <div class="record-detail">-->
<!--        <div>Email</div><div>{{commit.author.mail}}</div>-->
<!--      </div>-->
<!--      <div class="record-detail">-->
<!--        <div>Date</div><div>{{new Date(commit.date).toISOString().substring(0, 19).replace('T', ' ')}}</div>-->
<!--      </div>-->
<!--      <div class="record-detail" style="height: 4rem; align-items: flex-start; flex-direction: column;">-->
<!--&lt;!&ndash;        <div style="height: 4rem; width: 100%;">{{commit.message}}</div>&ndash;&gt;-->
<!--        <textarea style="height: 100%; border-radius: 0; border: none;" disabled>{{commit.message}}</textarea>-->
<!--      </div>-->
<!--    </div>-->

<!--    <div class="bg-sec nav-header">Changes ({{changes.length}})</div>-->
<!--    <div class="bg-sec" style="height: calc(100% - 16rem); width: 100%; box-sizing: border-box; padding: .75rem; overflow: auto;">-->
<!--      <div v-for="(change, ci) in changes"-->
<!--           class="git-change state-hover">-->
<!--        <div style="width: 18px; height: 18px;" class="fc">-->
<!--          <SvgOf :name="mapChangeIcon(change.flag)" :width="18" :height="18" :color="mapChangeColor(change.flag)" />-->
<!--        </div>-->
<!--        <div style="margin-left: .75rem;">{{change.file}}</div>-->
<!--&lt;!&ndash;        <div v-if="rd.changes[ci].hover" style="position: absolute; top: 0; right: 0; height: 100%; display: flex; align-items: center;">&ndash;&gt;-->
<!--&lt;!&ndash;          <div class="btn-stage" style="margin-right: .5rem;">Stage</div>&ndash;&gt;-->
<!--&lt;!&ndash;          <div class="btn-stage" style="background-color: #555555;">Ignore</div>&ndash;&gt;-->
<!--&lt;!&ndash;        </div>&ndash;&gt;-->
<!--      </div>-->
<!--    </div>-->
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

textarea {
  box-sizing: border-box;
  background-color: var(--primary-background-color);
  border: 1px solid rgba(255, 255, 255, .25);
  border-radius: 6px;
  width: 100%;
  resize: none;
  outline: none;
  font-size: .75rem;
  font-family: Roboto, system-ui, Avenir, Helvetica, Arial, sans-serif;
}


.git-message-content {
  font-family: Roboto, system-ui, Avenir, Helvetica, Arial, "Microsoft YaHei", sans-serif;
  margin: .25rem 0 .25rem 18px;
  width: calc(100% - 12px);
  height: 8rem;
  box-sizing: border-box;
  //display: flex;
  //align-items: center;
  padding-left: 6px;
  overflow: auto;
  background-color: var(--primary-background-color);
}


</style>