<script setup lang="ts">

import {onMounted, reactive} from "vue";
import {GitProject} from "./git.web.ts";
import SvgOf from "./ui/SvgOf.vue";
import GitGraph from "./GitGraph.vue";
import {hash} from "./utils/jlib.ts";
import GitStage from "./GitStage.vue";
import GitRecord from "./GitRecord.vue";
import {notify} from "./utils/libxdom.ts";
import HeadMenu from "./HeadMenu.vue";
import GitFileChange from "./GitFileChange.vue";
import {GitChange} from "./git.generic.ts";
import SvgPos from "./assets/location.svg"
import GitRecent from "./GitRecent.vue";

const info = reactive<{ g: GitProject }>({g: null})
const menu = reactive({currentBranch: false, remoteRepositories: false})
const xGui = reactive<{ md5: string, showTrack: boolean, record: any, changedFile: any }>(
    {md5: '', showTrack: false, record: null, changedFile: null})
const recentRepositories = reactive([])
function convertRemote(gp: GitProject) {
  return gp.remoteRepositories.map(repo => ({
    name: repo.name, children: repo.branches.map(br => ({name: br}))}))
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
      <div style="width: 100%;">
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
          <div class="header-btn fc" @click="async () => {await info.g.pull(); notify({message: 'Pull success!'})}">
            <SvgOf name="download" :width="14" :height="14" color="var(--text-third-color)"/>
            <div style="margin-left: .5rem; margin-right: .5rem;">Pull</div>
          </div>
          <div class="header-btn fc" @click="async () => {await info.g.push(); notify({message: 'Push success!'})}">
            <SvgOf name="upload" :width="14" :height="14" color="var(--text-third-color)"/>
            <div style="margin-left: .5rem; margin-right: .5rem;">Push</div>
          </div>


          <HeadMenu :items="info.g.remoteRepositories.map(rr => rr.name)" @clickMenu="(rr) => {}">
            <SvgOf name="cloud" :width="18" :height="18" color="var(--text-third-color)"/>
            <div style="margin-left: .5rem; margin-right: .5rem;">Remote</div>
            <SvgOf name="small-arrow-down" :width="10" :height="10" color="var(--text-third-color)"/>
          </HeadMenu>

<!--          <div class="header-btn fc" @click="() => menu.remoteRepositories = !menu.remoteRepositories">-->
<!--            <SvgOf name="cloud" :width="18" :height="18" color="var(&#45;&#45;text-third-color)"/>-->
<!--            <div style="margin-left: .5rem; margin-right: .5rem;">Remote</div>-->
<!--            <SvgOf name="small-arrow-down" :width="10" :height="10" color="var(&#45;&#45;text-third-color)"/>-->
<!--            <div class="btn-menu" v-if="menu.remoteRepositories">-->
<!--              <div v-for="(repo) in info.g.remoteRepositories"-->
<!--                   class="btn-menu-item state-hover">{{repo.name}}</div>-->
<!--            </div>-->
<!--          </div>-->
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
                  :history="info.g.history"
                  @select="selectCommit"/>
        <GitGraph v-else-if="xGui.showTrack" :key="hash(info.g.track) + xGui.md5"
                  :history="info.g.track"
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


</style>