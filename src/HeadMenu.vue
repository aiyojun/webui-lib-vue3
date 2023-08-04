<script setup lang="ts">

import {reactive} from "vue";
import {exists} from "./utils/jlib.ts";
import SubHeadMenu from "./components/SubHeadMenu.tsx"


function bindState(item) {
  if (exists(item, 'name') && exists(item, 'children')) {
    return {name: item['name'], fold: true, children: item['children'].map(i => bindState(i))}
  } else {
    return {name: item, fold: true}
  }
}

const props = defineProps<{ items: Array<string> }>()
const items2 = reactive(props.items.map(i => bindState(i)))
const emit = defineEmits<{(event: 'clickMenu', value: string): void}>()
const menuState = reactive({isOpen: false})


function autoClose() {menuState.isOpen = false;console.info(`menu auto close ... ${menuState.isOpen}`)}
function open(e) {
  if (menuState.isOpen) return
  menuState.isOpen = true
  e?.stopPropagation()
  window.addEventListener('click', autoClose)
  console.info(`menu open ... ${menuState.isOpen}`)
}

function close(e) {
  e?.stopPropagation()
  try {
    window.removeEventListener('click', autoClose)
  } catch (e) {

  }
  menuState.isOpen = false
  console.info(`menu close ... ${menuState.isOpen}`)
}

function clickMenu(e, id: string) {
  console.info('click menu :', id)
  emit('clickMenu', id)
  close(e)
}


</script>

<template>
  <div class="header-btn fc" @click="(e) => menuState.isOpen ? close(e) : open(e)">
    <slot></slot>
    <div class="btn-menu" v-if="menuState.isOpen && items2.length > 0">
      <div v-for="(item) in items2" class="btn-menu-item state-hover" @mouseenter="() => item['fold'] = false" @mouseleave="() => item['fold'] = true" @click="(e) => {clickMenu(e, item['name']);}">
        {{item['name']}}
        <SubHeadMenu v-if="exists(item, 'children') && !item['fold']" :items="item['children']" @clickSubMenu="(uri) => {clickMenu(null, `${item['name']}/${uri}`)}"/>
      </div>
    </div>
  </div>
</template>

<style scoped>

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

.btn-menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 100%;
  box-sizing: border-box;
  background-color: var(--third-background-color);
}

.btn-menu-item {
  position: relative;
  height: 2rem;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 .75rem;
}

.secondary-menu {
  position: absolute;
  top: 0;
  left: 100%;
  min-width: 100%;
  height: 2rem;
  display: flex;
  flex-direction: column;
}

</style>