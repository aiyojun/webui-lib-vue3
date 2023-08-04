<script setup lang="ts">

import {onMounted, reactive, ref} from "vue";
import {GitProject} from "./git.web.ts";
import SvgOf from "./ui/SvgOf.vue";
import GitGraph from "./GitGraph.vue";
import {hash, kvexchange} from "./utils/jlib.ts";
import GitStage from "./GitStage.vue";
import GitRecord from "./GitRecord.vue";
import {notify} from "./utils/libxdom.ts";
import HeadMenu from "./HeadMenu.vue";
import GitFileChange from "./GitFileChange.vue";
import {GitChange} from "./git.generic.ts";
import SvgPos from "./assets/location.svg"
import GitRecent from "./GitRecent.vue";

const info = reactive<{ g: GitProject }>({g: null})
const xGui = reactive<{ md5: string, showTrack: boolean, record: any, changedFile: any }>(
    {md5: '', showTrack: false, record: null, changedFile: null,})
const xTargetFormGroup = reactive({show: false, type: 'pull'})
const xTargetForm = ref<HTMLDivElement>()
const xTargetFormRemote = ref<HTMLSelectElement>()
const xTargetFormBranch = ref<HTMLInputElement>()
const recentRepositories = reactive([])
function convertRemote(gp: GitProject) {
  return gp.remoteRepositories.map(repo => ({
    name: repo.name, children: repo.branches.map(br => ({name: br}))}))
}

function convertRemoteMenu(remotes) {
  return remotes.map(repo => ({
    name: repo.name,
    children: repo.branches.map(br => ({name: br, children: [
        {name: "Pull"},
      ]})),
  }))
}

async function selectCommit(id) {
  xGui.record = {commit: info.g.getCommit(id), changes: await (info.g.showCommit(id))}
  console.info(`select commit ${id.substring(0, 4)}`)
}

async function reload() {
  await info.g.init()
  notify({message: 'Refresh success!'})
}

function showFileChange(xfc: GitChange) {
  xGui.changedFile = xfc
}

async function init() {
  info.g = reactive(await GitProject.build())
}

async function pull() {
  xTargetFormGroup.type = 'pull'
  xTargetFormBranch.value.value = ''
  if (!info.g.hasUpstream()) {
    xTargetFormGroup.show = true
    xTargetForm.value.style.left = '0'
    xTargetForm.value.style.animation = 'bounceInLeft .8s'
  } else {
    await info.g.pull();
    notify({message: 'Pull success!'})
  }
}

async function push() {
  xTargetFormGroup.type = 'push'
  xTargetFormBranch.value.value = ''
  if (!info.g.hasUpstream()) {
    xTargetFormGroup.show = true
    xTargetForm.value.style.left = '0'
    xTargetForm.value.style.animation = 'bounceInLeft .8s'
  } else {
    await info.g.push();
    notify({message: 'Push success!'})
  }
}

async function targetConfirm() {
  console.info(`-- confirm : ${xTargetFormGroup.type} remote : ${xTargetFormRemote.value.value} branch : ${xTargetFormBranch.value.value}`)
  if (xTargetFormGroup.type === 'pull') {
    await info.g.pull()
  } else if (xTargetFormGroup.type === 'push') {
    await info.g.push()
  }
  notify({message: `${xTargetFormGroup.type} success!`})
  xTargetForm.value.style.animation = 'bounceOutRight .8s'
  setTimeout(() => xTargetFormGroup.show = false, 750)
}

function targetCancel() {
  xTargetForm.value.style.animation = 'bounceOutLeft .8s'
  setTimeout(() => xTargetFormGroup.show = false, 750)
}

onMounted(async () => {
  (await GitProject.getRecent()).forEach(repo => recentRepositories.push(repo))

  window.addEventListener('resize', () => {
    xGui.md5 = `${new Date().getTime()}`
  })
})


</script>

<template>
  <div class="home" :key="info.g?.name || 'nothing'">
    <div class="header">
      <div v-if="!xTargetFormGroup.show" style="width: 100%;">
        <div class="header-btn fc" @click="async () => {await GitProject.openAndEnter(); await init()}">
          <SvgOf name="folder" :width="20" :height="20" color="var(--text-primary-color)"/>
        </div>
        <div v-if="info.g !== null" style="height: 100%; display: flex;">
          <div class="header-btn fc" style="background-color: rgba(255,255,255,.1);">
<!--            <SvgOf name="close" :width="16" :height="16" color="var(--text-third-color)" hover="white"/>-->
            <div style="margin: 0 .5rem; color: var(--text-primary-color); font-size: 1.25rem; font-weight: bold;">{{info.g.name}}</div>
<!--            <SvgOf name="small-arrow-down" :width="10" :height="10" color="var(--text-third-color)"/>-->
          </div>
          <HeadMenu :items="info.g.localBranches" @clickMenu="(br) => {info.g.checkout(br); info.g.currentBranch = br;}">
            <SvgOf name="branch" :width="18" :height="18" color="var(--text-third-color)"/>
            <div style="margin-left: .5rem; margin-right: .5rem;">{{ info.g.currentBranch }}</div>
            <SvgOf name="small-arrow-down" :width="10" :height="10" color="var(--text-third-color)"/>
          </HeadMenu>
          <div class="header-btn fc" @click="pull">
            <SvgOf name="download" :width="14" :height="14" color="var(--text-third-color)"/>
            <div style="margin-left: .5rem; margin-right: .5rem;">Pull</div>
          </div>
          <div class="header-btn fc" @click="push">
            <SvgOf name="upload" :width="14" :height="14" color="var(--text-third-color)"/>
            <div style="margin-left: .5rem; margin-right: .5rem;">Push</div>
          </div>


          <HeadMenu :items="convertRemoteMenu(info.g.remoteRepositories)" @clickMenu="(rr) => {}">
            <SvgOf name="cloud" :width="18" :height="18" color="var(--text-third-color)"/>
            <div style="margin-left: .5rem; margin-right: .5rem;">Remote</div>
            <SvgOf name="small-arrow-down" :width="10" :height="10" color="var(--text-third-color)"/>
          </HeadMenu>

          <div class="header-btn fc" @click="() => {xGui.showTrack = !xGui.showTrack; notify({message: xGui.showTrack ? 'Whole commits!' : 'Current branch commits!'})}">
            <SvgOf name="branch-child" :width="14" :height="14" color="var(--text-third-color)"/>
            <div style="margin-left: .5rem; margin-right: .5rem;">{{xGui.showTrack ? 'Branch' : 'History'}}</div>
          </div>
        </div>
        <div style="height: 100%; width: 100%; -webkit-app-region: drag;"></div>
      </div>

      <div style="margin-right: 140px;">
        <div v-if="info.g !== null" class="header-btn fc" @click="() => {reload()}">
          <SvgOf name="reload" :width="18" :height="18" color="var(--text-third-color)"/>
        </div>
        <div class="header-btn fc">
          <SvgOf name="search" :width="18" :height="18" color="var(--text-third-color)"/>
        </div>
        <div class="header-btn fc">
          <SvgOf name="settings" :width="18" :height="18" color="var(--text-third-color)"/>
        </div>
      </div>


      <div v-if="info.g !== null" ref="xTargetForm" class="git-target fc" :style="{left: xTargetFormGroup.show ? '0' : '100%'}">
        <div style="margin-right: .5rem;">Which remote/branch {{xTargetFormGroup.type}} {{xTargetFormGroup.type === 'pull' ? 'from' : 'to'}}?</div>
        <select style="width: 8rem;" ref="xTargetFormRemote">
          <option v-for="remote in [{name: 'origin'}, {name: 'dev'}]" :value="remote.name">{{remote.name}}</option>
        </select>
        <div style="margin: 0 .5rem;">/</div>
        <input style="width: 8rem; margin-right: .5rem;" ref="xTargetFormBranch">
        <div style="margin-right: .5rem;" class="git-target-button confirm" @click="() => {targetConfirm()}">Confirm</div>
        <div class="git-target-button cancel" @click="targetCancel">Cancel</div>
      </div>
    </div>
    <div class="main">
      <div v-if="info.g !== null" class="sidebar">
<!--        <div class="nav-header">Remote</div>-->
<!--        <TreeView :root="convertRemote(info.g)"/>-->
        <GitRecord v-if="xGui.record !== null"
                   :commit="xGui.record.commit" :changes="xGui.record.changes"
                   @showFileChange="showFileChange" @close="() => xGui.record = null"/>
        <GitStage v-else :key="hash(info.g.changes.map(c => c.dump()))" :project="info.g"
                  @clickStage="filepath => {info.g.stage(filepath)}"
                  @clickUnstage="filepath => {info.g.unstage(filepath)}"
                  @clickIgnore="filepath => {info.g.ignore(filepath)}"
                  @clickCommit="message => {info.g.commit(message)}"
                  @clickCommitWithPush="message => {info.g.commit(message); info.g.push();}"
                  @showFileChange="showFileChange"/>
      </div>
      <div v-if="info.g !== null" class="main-body" style="position: relative;">

        <GitFileChange v-if="xGui.changedFile !== null"
                       :change="xGui.changedFile"
                       @close="() => {xGui.changedFile = null}" />
        <GitGraph v-else-if="!xGui.showTrack" :key="hash(info.g.history) + xGui.md5"
                  :history="info.g.history" :heads="kvexchange(info.g.heads)"
                  @select="selectCommit"/>
        <GitGraph v-else-if="xGui.showTrack" :key="hash(info.g.track) + xGui.md5"
                  :history="info.g.track" :heads="kvexchange(info.g.heads)"
                  @select="selectCommit"/>

      </div>

      <div v-if="info.g === null" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex;">
        <div style="width: 40%; height: 100%; position: relative;">
          <GitRecent :repos="recentRepositories" @openRepo="async (repo) => {await GitProject.enter(repo); await init()}"/>
        </div>
        <div style="width: 60%; height: 100%; position: relative;" class="fc">
          <img alt="" :src="SvgPos" width="200" height="200"/>
        </div>
      </div>

    </div>
    <div class="footer">
      <div>
        <div class="header-btn fc" style="background-color: rgba(255,255,255,.1);">GitGuard</div>
      </div>
      <div style="display: flex;">
        <div class="header-btn fc"><a @click="() => GitProject.jump('https://starspicking.com')">Support</a></div>
        <div class="header-btn fc">Version 0.0.1</div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.header {
  position: relative;
  z-index: 10;
  height: calc(3rem - 1px);
  margin-bottom: 1px;
  background-color: var(--third-background-color);
  display: flex;
  justify-content: space-between;
}

.header > div {
  height: 100%;
  display: flex;
  align-items: center;
}

.main {
  position: relative;
  height: calc(100% - 5rem);
  display: flex;
}

.main > div {
  height: 100%;
}

.sidebar {
  width: calc(24rem - 1px);
  margin-right: 1px;
  display: flex;
  flex-direction: column;
}

.sidebar>div {
  width: 100%;
}

.main-body {
  position: relative;
  width: calc(100% - 24rem);
  overflow: auto;
}

.footer {
  height: calc(2rem - 1px);
  margin-top: 1px;
  color: var(--text-comment-color);
  background-color: var(--third-background-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.25rem;
  font-weight: bold;
  cursor: default;
  padding: 0 .75rem;
}

.header-btn {
  position: relative;
  height: 100%;
  padding: 0 .75rem;
  cursor: pointer;
  font-weight: bold;
  color: var(--text-third-color);
  white-space: nowrap;
}

.header-btn:hover {
  background-color: rgba(255, 255, 255, .1);
}

.footer .header-btn {
  font-weight: normal;
}

.btn-menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 100%;
  box-sizing: border-box;
  background-color: var(--third-background-color);
}

.btn-menu-item {

  height: 2rem;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 .75rem;
}

.git-target {
  position: absolute;
  top: 0;
  left: 100%;
  height: 100%;
  width: 100%;
  color: #fff;
  background-color: #2468a2;
}

input, select {
  outline: none;
  box-sizing: border-box;
  padding: 0 .5rem;
  border: none;
  border-radius: 4px;
  height: 2rem;
  background-color: #205686;
  font-family: Roboto, system-ui, Avenir, Helvetica, Arial, "Microsoft YaHei", sans-serif;
  font-size: .75rem;
}

select {
  cursor: pointer;
}

.git-target-button {
  height: 2rem;
  line-height: 2rem;
  padding: 0 .5rem;
  color: #fff;
  background-color: rgba(124, 252, 0, 0.5);
  border: 1px solid yellowgreen;
  border-radius: 4px;
  cursor: pointer;
  box-sizing: border-box;
}

.confirm {
  background-color: rgba(124, 252, 0, 0.5);
  border: 1px solid yellowgreen;
}

.confirm:hover {
  background-color: yellowgreen;
}

.cancel {
  background-color: rgba(128, 128, 128, 0.5);
  border: 1px solid darkgrey;
}

.cancel:hover {
  background-color: darkgrey;
}

</style>