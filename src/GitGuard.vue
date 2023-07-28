<script setup lang="ts">

import {onMounted, reactive} from "vue";
import {GitProject} from "./utils/git.ts";
import SvgOf from "./ui/SvgOf.vue";
import TreeView from "./components/TreeView.tsx";
import GitGraph from "./GitGraph.vue";
import {preset} from "./ds-graph.ts";
import {hash} from "./utils/jlib.ts";
import GitStage from "./GitStage.vue";
import GitRecord from "./GitRecord.vue";


const info = reactive<{ g: GitProject }>({g: null})
const menu = reactive({currentBranch: false, remoteRepositories: false})
const xGui = reactive<{ graphMD5: string, record: any }>({graphMD5: '', record: null})
function convertRemote(gp: GitProject) {
  return gp.remoteRepositories.map(repo => ({
    name: repo.name, children: repo.branches.map(br => ({name: br}))}))
}

async function selectCommit(id) {
  xGui.record = {commit: info.g.getCommit(id), changes: await (info.g.showCommit(id))}
  console.info(`select commit ${id.substring(0, 4)}`)
}


onMounted(async () => {
  const git = reactive(await GitProject.build())
  info.g = git
  console.info(git)

  window.addEventListener('resize', () => {
    console.info(`window.resize ...`)
    xGui.graphMD5 = `${new Date().getTime()}`
  })
})


</script>

<template>
  <div class="home" v-if="info.g !== null">
    <div class="header">
      <div>
        <div class="header-btn fc">
          <div style="margin-right: .5rem; color: #fff; font-size: 1.25rem; font-weight: bold;">{{info.g.name}}</div>
          <SvgOf name="small-arrow-down" :width="10" :height="10" fill="#aaa"/>
        </div>
        <div class="header-btn fc" @click="() => menu.currentBranch = !menu.currentBranch">
          <SvgOf name="branch" :width="18" :height="18" fill="#aaa"/>
          <div style="margin-left: .5rem; margin-right: .5rem;">{{ info.g.currentBranch }}</div>
          <SvgOf name="small-arrow-down" :width="10" :height="10" fill="#aaa"/>
          <div class="btn-menu" v-if="menu.currentBranch">
            <div v-for="(branch) in info.g.localBranches" class="btn-menu-item state-hover" @click="() => {info.g.checkout(branch);}">{{branch}}</div>
          </div>
        </div>
        <div class="header-btn fc">
          <SvgOf name="download" :width="14" :height="14" fill="#aaa"/>
          <div style="margin-left: .5rem; margin-right: .5rem;">Pull</div>

        </div>
        <div class="header-btn fc">
          <SvgOf name="upload" :width="14" :height="14" fill="#aaa"/>
          <div style="margin-left: .5rem; margin-right: .5rem;">Push</div>
        </div>
        <div class="header-btn fc" @click="() => menu.remoteRepositories = !menu.remoteRepositories">
          <SvgOf name="cloud" :width="18" :height="18" fill="#aaa"/>
          <div style="margin-left: .5rem; margin-right: .5rem;">Remote</div>
          <SvgOf name="small-arrow-down" :width="10" :height="10" fill="#aaa"/>
          <div class="btn-menu" v-if="menu.remoteRepositories">
            <div v-for="(repo) in info.g.remoteRepositories"
                 class="btn-menu-item state-hover">{{repo.name}}</div>
          </div>
        </div>
      </div>
      <div>
        <div class="header-btn fc">
          <SvgOf name="reload" :width="18" :height="18" fill="#aaa"/>
        </div>
        <div class="header-btn fc">
          <SvgOf name="search" :width="18" :height="18" fill="#aaa"/>
        </div>
        <div class="header-btn fc">
          <SvgOf name="settings" :width="18" :height="18" fill="#aaa"/>
        </div>
      </div>
    </div>
    <div class="main">
<!--      <div class="dock"></div>-->
      <div class="sidebar">
<!--        <div class="nav-header">Remote</div>-->
<!--        <TreeView :root="convertRemote(info.g)"/>-->
        <GitRecord v-if="xGui.record !== null" :commit="xGui.record.commit" :changes="xGui.record.changes" />
        <GitStage v-else :key="hash(info.g.changes.map(c => c.dump()))" :project="info.g" />
      </div>
      <div class="main-body" style="position: relative;">

        <GitGraph :key="hash(info.g.history) + xGui.graphMD5"
                  :history="info.g.history"
                  @select="selectCommit"/>

      </div>
    </div>
    <div class="footer">
      <div></div>
      <div style="display: flex;">
        <div class="header-btn fc"><a href="">Support</a></div>
        <div class="header-btn fc">Version 0.0.1</div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.home {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--primary-background-color);
  font-family: Roboto, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

.home > div {
  width: 100%;
}

.header {
  position: relative;
  z-index: 10;
  height: calc(3rem - 1px);
  margin-bottom: 1px;
  background-color: var(--secondary-background-color);
  display: flex;
  justify-content: space-between;
}

.header > div {
  height: 100%;
  display: flex;
  align-items: center;
}

.main {
  height: calc(100% - 5rem);
  display: flex;
}

.main > div {
  height: 100%;
}

.dock {
  width: calc(3rem - 1px);
  margin-right: 1px;
  background-color: var(--secondary-background-color);
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
  background-color: var(--secondary-background-color);
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
  color: #aaa;
  white-space: nowrap;
}

.header-btn:hover {
  background-color: rgba(255, 255, 255, .1);
}

.footer .header-btn {
  font-weight: normal;
  color: #888;
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