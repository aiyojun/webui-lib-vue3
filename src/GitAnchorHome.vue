<script setup lang="ts">

import {reactive} from "vue";
import SvgOf from "./ui/SvgOf.vue";
import GitGraph from "./GitGraph.vue";

const widget = reactive({
  repo: 'widget-frontend',
  branch: 'qa',
  local: [
    {name: 'master'},
    {name: 'qa'},
    {name: 'dev'},
  ],
  remote: [
    {name: 'origin', branches: ['master', 'qa', 'dev'], href: 'http://172.16.1.236/jun.dai/widget-frontend.git'},
    {name: 'se', branches: ['qa'], href: 'http://172.16.1.236/jqs-common/frontend/widget-frontend.git'},
  ],
  tags: [
    {name: 'feature-new'}
  ],
  changes: [
    {stage: false, flag: 'M', file: 'packages/widget-frontend-beta/src/widgets-base/element-ui.tsx'},
    {stage: false, flag: 'M', file: 'packages/widget-frontend-core/package.json'},
    {stage: true, flag: 'M', file: 'pub.js'},
  ],
  commits: [
    {
      id: "6bb5145d751811f9106eb37a85d73525d02068fa",
      idTree: "d116b5b167b548676424b49f76c0ed9ae5a2bb7d",
      idParent: "e88a041bf5ca4240d9c1412dbe4a54cf5d973edf",
      author: {name: "jun.dai", mail: "1608450902@qq.com"},
      date: 1689816865000,
      message: "add deprecated for x-widget.required"
    },
    {
      id: "e88a041bf5ca4240d9c1412dbe4a54cf5d973edf",
      idTree: "89a9776df1fc3bdac106d09f7f862f39f2f870c4",
      idParent: "df41d8e3638c7e3896a327a99121402e49d6d2cf",
      author: {name: "jun.dai", mail: "1608450902@qq.com"},
      date: 1689816348000,
      message: "add IComponent 'required' support"
    },
    {
      id: "df41d8e3638c7e3896a327a99121402e49d6d2cf",
      idTree: "fdc0804fa6824b227ec64c92ec764f7ce6231df5",
      idParent: "a0d44a2708fc1fe68f400a4745f33e0c51c7a01a",
      author: {name: "jun.dai", mail: "1608450902@qq.com"},
      date: 1689753692000,
      message: "add publish script"
    },
    {
      id: "a0d44a2708fc1fe68f400a4745f33e0c51c7a01a",
      idTree: "7f16b21c278a57fd6e92e3e09bd364e6118f8701",
      idParent: "9d5665eb84d1a50ebd7b4de454728c8fc43f73ac",
      author: {name: "jun.dai", mail: "1608450902@qq.com"},
      date: 1689735168000,
      message: "add probe function and event arguments passing"
    },
    {
      id: "9d5665eb84d1a50ebd7b4de454728c8fc43f73ac",
      idTree: "c26ef6eb3aef8f4be2c4be47794b832c26b7067c",
      idParent: "bee84df4ab874fb285c6fdf3a4637b466b5ecca5",
      author: {name: "jun.dai", mail: "1608450902@qq.com"},
      date: 1689320317000,
      message: "remove useless file"
    },
    {
      id: "bee84df4ab874fb285c6fdf3a4637b466b5ecca5",
      idTree: "3fbae2b7662e0c5890bf445f4a11542c02eac7fd",
      idParent: "ba0e3e4f755d75425be380b1313a77bc0c9df70f",
      author: {name: "jun.dai", mail: "1608450902@qq.com"},
      date: 1689320205000,
      message: "add guide demo"
    },
    {
      id: "ba0e3e4f755d75425be380b1313a77bc0c9df70f",
      idTree: "34d04e26c2592cf5090b153ab0e8d2cfdae41d32",
      idParent: "c619301227a54b5d940a28ecae35392e595def91",
      author: {name: "jun.dai", mail: "1608450902@qq.com"},
      date: 1689317152000,
      message: "openapi parsing optimization"
    },
    {
      id: "c619301227a54b5d940a28ecae35392e595def91",
      idTree: "39df69e8fdc9f3caf95351f67124d37fd4f77def",
      idParent: "09fc5065b58773697aba2999f20bd8d94ba7b133",
      author: {name: "jun.dai", mail: "1608450902@qq.com"},
      date: 1689313274000,
      message: "fixed a bug about data validation"
    },
    {
      id: "09fc5065b58773697aba2999f20bd8d94ba7b133",
      idTree: "f38f9ec5276c1dfeae3da84553f2c2f0a23f3292",
      idParent: "",
      author: {name: "jun.dai", mail: "1608450902@qq.com"},
      date: 1689305465000,
      message: "rebuild widget-frontend based on workspaces"
    }
  ],
})

function mapColor(flag: string) {
  const handles = [
    {satisfy: () => flag === 'M', entry: () => 'orange'},
    {satisfy: () => flag === 'D', entry: () => 'red'},
    {satisfy: () => flag === 'A', entry: () => 'blue'},
    {satisfy: () => flag === 'R', entry: () => 'green'},
    {satisfy: () => flag === 'C', entry: () => 'grey'},
    {satisfy: () => flag === 'U', entry: () => 'purple'},
    {satisfy: () => flag === 'T', entry: () => 'indigo'},
  ]
  for (let i = 0; i < handles.length; i++) {
    const hd = handles[i]
    if (hd.satisfy()) {
      return hd.entry()
    }
  }
  return 'white'
}

</script>

<template>

  <div class="overlay home" style="display: flex; flex-direction: column;">

    <div class="home-head">
      <div style="display: flex; flex-grow: 1;">
        <div class="head-button">
          <span>Repository</span>
          <span class="large">{{ widget.repo }}</span>
        </div>
        <div
            style="height: 100%; box-sizing: border-box; padding: 0 .5rem; display: flex; justify-content: center; align-items: center;">
          <SvgOf name="arrow-right" :width="16" :height="16"/>
        </div>
        <div class="head-button">
          <span>Branch</span>
          <span class="large">{{ widget.branch }}</span>
        </div>
      </div>
      <div style="display: flex; flex-grow: 1;">
        <div class="head-operation">
          <div style="margin-bottom: .25rem;">Pull</div>
          <SvgOf name="download" :width="16" :height="16"/>
        </div>
        <div class="head-operation">
          <div style="margin-bottom: .25rem;">Push</div>
          <SvgOf name="upload" :width="16" :height="16"/>
        </div>
      </div>
      <div style="display: flex; flex-grow: 1; flex-direction: row-reverse;">
        <div class="head-operation" style="width: unset; padding: 0 1rem;">
          <div style="margin-bottom: .25rem;">Profile</div>
          <div>aiyojun</div>
<!--          <SvgOf name="user" :width="16" :height="16"/>-->
        </div>
        <div class="head-operation">
          <div style="margin-bottom: .25rem;">Settings</div>
          <SvgOf name="settings" :width="18" :height="18"/>
        </div>
        <div class="head-operation">
          <div style="margin-bottom: .25rem;">Search</div>
          <SvgOf name="search" :width="18" :height="18"/>
        </div>
      </div>
      <div>

      </div>
    </div>
    <div class="home-body">
      <div class="sidebar">
        <div class="nav-widget">
          <span class="middle" style="margin-left: 1rem;">LOCAL</span>
          <div style="width: 100%;">
            <div v-for="(localItem, localIndex) in widget.local"
                 class="branch-nav"
            >
<!--                 :style="{backgroundColor: localItem.name === widget.branch ? 'rgba(190,255,190,0.25)' : 'none'}"-->
              <div style="width: 3.5rem; display: flex; justify-content: center; align-items: center;">
                <div style="width: 1.75rem; height: 100%; display: flex; justify-content: center; align-items: center;">
                  <SvgOf v-if="localItem.name === widget.branch" name="tag" :width="16" :height="16" :fill="'yellow'"/>
                </div>
                <div style="width: 1.75rem; height: 100%; display: flex; justify-content: center; align-items: center;">
                  <SvgOf name="branch" :width="16" :height="16" fill="#888"/>
                </div>
              </div>
              <div style="">{{ localItem.name }}</div>
            </div>
          </div>
        </div>

        <div class="nav-widget">
          <span class="middle" style="margin-left: 1rem;">REMOTE</span>
          <div style="width: 100%;">
            <div v-for="(remoteItem, remoteIndex) in widget.remote">
              <div class="branch-nav">
                <div style="width: 1.75rem; display: flex; justify-content: center; align-items: center;">
<!--                  <div style="width: 1.75rem; height: 100%; display: flex; justify-content: center; align-items: center;">-->
<!--                  </div>-->
                  <div style="width: 1.75rem; height: 100%; display: flex; justify-content: center; align-items: center;">
                    <SvgOf name="cloud" :width="16" :height="16" fill="#888"/>
                  </div>
                </div>
                <div style="">{{ remoteItem.name }}</div>
              </div>
              <div>
                <div v-for="(branch, branchIndex) in remoteItem.branches"
                     class="branch-nav">
                  <div style="width: 3.5rem; display: flex; justify-content: center; align-items: center;">
                    <div style="width: 1.75rem; height: 100%; display: flex; justify-content: center; align-items: center;">
                    </div>
                    <div style="width: 1.75rem; height: 100%; display: flex; justify-content: center; align-items: center;">
                      <SvgOf name="branch" :width="16" :height="16" fill="#888"/>
                    </div>
                  </div>
                  <div style="">{{ branch }}</div>
                </div>
              </div>
            </div>
          </div>
<!--          <ul>-->
<!--            <li v-for="(remoteItem, remoteIndex) in widget.remote" :key="remoteItem.name">{{ remoteItem.name }}</li>-->
<!--          </ul>-->
        </div>
      </div>
      <div class="main-area-1">

<!--        <div style="width: 100%; overflow: auto; white-space: nowrap;">-->
<!--          <div v-for="(commit) in widget.commits">{{ new Date(commit.date).toISOString() }} | {{ commit.message }}</div>-->
<!--        </div>-->

        <GitGraph />

      </div>
      <div class="main-area-2">
        <div style="height: calc(100% - 10rem); width: 100%">
          <span class="middle">Unstaged Files ({{ widget.changes.filter(x => !x.stage).length }})</span>
          <div style="width: 100%; height: 15rem; overflow: auto;">
            <div v-for="(change) in widget.changes.filter(x => !x.stage)" :key="change.file"
                 :style="{color: mapColor(change.flag)}" style="white-space: nowrap;">
            <span v-for="(filename) in change.file.split('/')">
              <span class="max">{{filename}}</span>
              <span>/</span>
            </span>
            </div>
          </div>
          <span class="middle">Staged Files ({{ widget.changes.filter(x => x.stage).length }})</span>
          <div style="width: 100%; height: 15rem; overflow: auto;">
            <div v-for="(change) in widget.changes.filter(x => x.stage)" :key="change.file"
                 :style="{color: mapColor(change.flag)}" style="white-space: nowrap;">{{ change.file }}
            </div>
          </div>
        </div>


        <div style="height: 10rem; width: 100%; box-sizing: border-box; padding: .5rem;">
          <span class="middle">Commit Message</span>
          <textarea class="commit-message" maxlength="80"></textarea>
          <div class="button">Commit changes to {{ widget.changes.filter(x => x.stage).length }} files</div>
        </div>
      </div>
    </div>
    <div class="home-foot">
      <div></div>
      <div style="height: 100%; display: flex;">
        <div class="foot-button"><a href="">Support</a></div>
        <div class="foot-button">Version 0.0.1</div>
      </div>
    </div>

  </div>

</template>

<style scoped>

ul, li {
  margin: 0;
//padding: 0;
}

.home > div {
  font-size: .75rem;
  width: 100%;
  box-sizing: border-box;
  color: var(--main-color);
}

span.large {
  color: #eee;
}

span.max {
  max-width: 100px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

span.middle {
  font-size: 1rem;
  font-weight: bold;
  color: #ddd;
  padding: .25rem 0;
}

.home-head {
  height: 4rem;
  display: flex;
}

.home-body {
  height: calc(100% - 6rem);
  display: flex;
}

.home-body > div {
  height: 100%;
}

.sidebar {
  width: 280px;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background-color: var(--third-background-color);
}

.main-area-1 {
  width: calc(100% - 280px - 320px);
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  position: relative;
}


.main-area-2 {
  width: 320px;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  background-color: var(--third-background-color);
}

.nav-widget {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  //padding: 0 1rem;
}

.nav-widget-title {
  height: 2rem;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.nav-widget-icon {
  width: 12px;
  height: 12px;
  margin-right: .5rem;
}

.home-foot {
  height: 2rem;
  background-color: var(--secondary-background-color);
  display: flex;
  justify-content: space-between;
}

.head-button {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  box-sizing: border-box;
  padding: 0 1rem;
  cursor: pointer;
}

.head-button:hover {
  background-color: rgba(0, 0, 0, .1);
}

.head-operation {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  width: 4rem;
  height: 100%;
  cursor: pointer;
}

.head-operation:hover {
  background-color: rgba(0, 0, 0, .1);
}

.button {
  box-sizing: border-box;
  width: 100%;
  height: 2rem;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  border: 1px solid #599459;
  background-color: rgba(143, 188, 143, 0.25);
  cursor: pointer;
}

.button:hover {
  background-color: #599459;
}


.commit-message {
  box-sizing: border-box;
  background-color: var(--primary-background-color);
  border: 1px solid rgba(255, 255, 255, .25);
  border-radius: 6px;
  height: 4rem;
  width: 100%;
  resize: none;
  outline: none;
  margin: .5rem 0;
  font-family: Roboto, system-ui, Avenir, Helvetica, Arial, sans-serif;
}


.branch-nav {
  position: relative;
  width: 100%;
  height: 1.75rem;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 0 1rem;
  cursor: default;
}

.branch-nav:hover {
  background-color: rgba(135, 206, 250, 0.25);
}

.round-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  cursor: pointer;
}

.round-icon:hover {
  background-color: rgba(255,255,255,.1);
}

.foot-button {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  padding: 0 .5rem;
  cursor: pointer;
}

.foot-button:hover {
  background-color: rgba(255,255,255,.1);
}

</style>