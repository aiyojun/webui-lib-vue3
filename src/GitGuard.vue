<script setup lang="ts">

import {onMounted, reactive} from "vue";
import {GitProject} from "./utils/git.ts";
import SvgOf from "./ui/SvgOf.vue";


const info = reactive<{g: GitProject}>({g: null})

onMounted(async () => {
  const git = await GitProject.build()
  info.g = git
  console.info(git)
})


</script>

<template>
  <div class="home" v-if="info.g !== null">
    <div class="header">
      <div>
        <div class="logo">widget-frontend</div>
        <div class="header-btn fc">
          <SvgOf name="branch" :width="18" :height="18" fill="yellow"/>
          <div style="margin-left: .5rem; margin-right: .5rem;">{{info.g.currentBranch}}</div>
          <SvgOf name="small-arrow-down" :width="12" :height="12" fill="#fff"/>
        </div>
      </div>
      <div>
        <div class="header-btn fc">
          <SvgOf name="search" :width="18" :height="18" fill="#aaa"/>
        </div>
        <div class="header-btn fc">
          <SvgOf name="settings" :width="18" :height="18" fill="#aaa"/>
        </div>
      </div>
    </div>
    <div class="main">

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
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: var(--primary-background-color);
}
.home>div {width: 100%;}

.header {
  height: 3rem;
  background-color: var(--secondary-background-color);
  display: flex;
  justify-content: space-between;
}

.header>div {
  height: 100%;
  display: flex;
  align-items: center;
}

.main {
  height: calc(100% - 5rem);
}

.footer {
  height: 2rem;
  background-color: var(--secondary-background-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-family: Roboto, system-ui, Avenir, Helvetica, Arial, sans-serif;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: default;
  padding: 0 .5rem;
}

.fc {
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-btn {
  height: 100%;
  padding: 0 .5rem;
  cursor: pointer;
  font-weight: bold;
  color: #aaa;
}

.header-btn:hover {
  background-color: rgba(255,255,255,.1);
}

.footer .header-btn {
  font-weight: normal;
  color: #888;
}

</style>