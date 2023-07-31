<script setup lang="ts">

import {onMounted, reactive, ref} from "vue";
// import gitTest from "./data/git-test.json"
import {Graph, Node as GNode, Node2d, Path2d, preset, transparent} from "./ds-graph.ts";
import {GitCommit} from "./git.generic.ts";

const props = defineProps<{history: Array<GitCommit>}>()
const emit = defineEmits<{(event: 'select', value: string)}>()

const graph = new Graph()
const blank = reactive<{
  paths: Array<Path2d>;
  nodes: Array<Node2d>;
  messageBegin: number;
  authorBegin: number;
  timeBegin: number;
  graphBegin: number;
  rowHeight: number;
  select: string;
}>({paths: [], nodes: [], messageBegin: 200, graphBegin: 100, authorBegin: 200, timeBegin: 0, rowHeight: 32, select: ''})
const layout = reactive({
  width: 1024, height: 1024,
  branchWidth: 180, graphWidth: 80,
})
function selectCommit(id: string) {
  blank.select = id
  emit('select', id)
}

function processCommits(commits, graph) {
  graph.clear()
  blank.rowHeight = preset.rowGutter
  for (let i = 0; i < commits.length; i++) {
    const comm = commits[i]
    graph.add(
        comm.idParent.trim().split(/[ \t]/).filter(s => s !== ''),
        new GNode().setId(comm.id).setRef(comm))
  }
  graph.build()
  graph.getPaths()
      .sort((a, b) => a.channel - b.channel)
      .forEach(p => blank.paths.push(p))
  graph.getNodes()
      .forEach(n => blank.nodes.push(n))
  blank.messageBegin = graph.getTextStart()
  blank.graphBegin = graph.getGraphStart()
  return commits
}

function getAuthor(id: string) { return graph.getOrigin(id)['author']['name'] }
function getTime(id: string) { return new Date(graph.getOrigin(id)['date']).toISOString().replaceAll('-', '/').replace('T', ' ').substring(0, 16)}

// async function sleep(wait: number): Promise<any>
// { return new Promise((resolve) => setTimeout(() => resolve(), wait)) }

const container = ref<HTMLDivElement>()
onMounted(async () => {

  processCommits(props.history.sort((a, b) => a['date'] - b['date']), graph)

  const rect = container.value.getBoundingClientRect()
  layout.width  = rect.width
  layout.height = graph.getHeight()
})

</script>

<template>
  <div ref="container" class="git-graph">
    <svg xmlns="http://www.w3.org/2000/svg"
         xmlns:xlink="http://www.w3.org/1999/xlink"
         :viewBox="`0 0 ${layout.width} ${layout.height}`"
         :width="layout.width"
         :height="layout.height"
         :style="{width: `${layout.width}px`, height: `${layout.height}px`}">
      <g>
        <rect x="0" y="0" width="100%" :height="blank.rowHeight" fill="rgba(255,255,255,.05)"/>
        <foreignObject
            xmlns="http://www.w3.org/1999/xhtml"
            :x="0" :y="0"
            :height="blank.rowHeight" :width="layout.width">
          <div style="display: flex; justify-content: space-between; align-items: center; height: 100%; width: 100%;">
            <div style="display: flex; align-items: center; height: 100%;">
              <div :style="{width: `${blank.graphBegin - blank.rowHeight * .5}px`}" style="box-sizing: border-box; padding-left: 5px;">Branch</div>
              <div :style="{width: `${blank.messageBegin - blank.graphBegin + blank.rowHeight * .5}px`}">Graph</div>
              <div style="white-space: nowrap;">Commit message</div>
            </div>
            <div style="display: flex; align-items: center; height: 100%;">
              <div style="width: 100px; box-sizing: border-box; padding-left: 5px;">Author</div>
              <div style="width: 120px; box-sizing: border-box; padding-left: 5px;">Date</div>
            </div>
          </div>
        </foreignObject>

      </g>
      <g v-for="(node) in blank.nodes">
        <rect class="git-row" :x="0"
              :y="node.y - blank.rowHeight * 0.5 + 2"
              :height="blank.rowHeight - 4"
              :width="layout.width" @click="() => selectCommit(node.id)"/>
        <rect :x="node.x" :y="node.y - blank.rowHeight * 0.5 + 2"
              :height="blank.rowHeight - 4"
              :width="blank.messageBegin - node.x - 4"
              :fill="transparent(node.fill, blank.select === node.id ? .75: .1)"
              style="pointer-events: none;"/>
        <rect :x="blank.messageBegin - 6" :y="node.y - blank.rowHeight * 0.5 + 2"
              :height="blank.rowHeight - 4"
              :width="2"
              :fill="transparent(node.fill, 1)"
              style="pointer-events: none;"/>
        <rect :x="blank.messageBegin - 4" :y="node.y - blank.rowHeight * 0.5 + 2"
              :height="blank.rowHeight - 4"
              :width="layout.width - blank.messageBegin + 4"
              :fill="blank.select === node.id ? 'rgba(255,255,255,.1)' : 'none'"
              style="pointer-events: none;"/>
      </g>
      <path v-for="(path) in blank.paths"
            :d="path.d" fill="none"
            :stroke="path.stroke"
            :stroke-width="path.strokeWidth"
            style="pointer-events: none;" />
      <g v-for="(node) in blank.nodes">
        <circle v-if="node.type === 'merge'"
                :cx="node.x" :cy="node.y" r="6" :fill="node.fill"
                style="pointer-events: none;" />
        <circle v-else
                :cx="node.x" :cy="node.y" r="8"
                stroke-width="3" :stroke="node.fill"
                fill="var(--primary-background-color)"
                style="pointer-events: none;" />
        <foreignObject
            xmlns="http://www.w3.org/1999/xhtml"
            style="pointer-events: none; user-select: none;"
            :x="blank.messageBegin" :y="node.y - blank.rowHeight * 0.5 + 2"
            :height="blank.rowHeight - 4" :width="layout.width - blank.messageBegin">
          <div :style="{color: node.type === 'merge' ? '#aaa' : '#eee'}" style="display: flex; align-items: center; height: 100%; width: 100%;">
            <div style="width: calc(100% - 220px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{node.message}}</div>
            <div style="box-sizing: border-box; padding-left: 5px; width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{getAuthor(node.id)}}</div>
            <div style="box-sizing: border-box; padding-left: 5px; width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{getTime(node.id)}}</div>
          </div>
        </foreignObject>
      </g>
    </svg>
  </div>
</template>

<style scoped>

.git-graph {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 600px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.git-row {
  cursor: pointer;
  fill: rgba(51, 51, 51, 0);
}

.git-row:hover {
  fill: rgba(51, 51, 51, 0.5);
}

</style>