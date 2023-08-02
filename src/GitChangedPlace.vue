<script setup lang="ts">

import {onMounted, reactive} from "vue";

interface MarkLine {
  type: string;
  text: string;
}

const props = defineProps<{location: string, text: string}>()
const lines = reactive<Array<MarkLine>>([])

function parse(text: string) {
  text.split('\n').map(line => {
    if (line.startsWith('+')) {
      lines.push({type: 'add', text: line})
    } else if (line.startsWith('-')) {
      lines.push({type: 'delete', text: line})
    } else {
      lines.push({type: 'normal', text: line})
    }
  })
}

function mapMarkLineColor(line: MarkLine) {
  if (line.type === 'delete') return 'rgba(255,0,0,0.2)'
  if (line.type === 'add') return 'rgba(0,255,0,0.1)'
  else return 'rgba(0,0,0,0)'
}

onMounted(() => {
  parse(props.text)
})

</script>

<template>

  <div style="width: 100%; display: flex; flex-direction: column; margin-bottom: 2rem;">
    <pre class="raw-code raw-location">@@ {{location}} @@</pre>
    <pre class="raw-code" v-for="(row, ir) in lines" :key="`${ir}.${row.text}`" :style="{backgroundColor: mapMarkLineColor(row)}">{{row.text}}</pre>
  </div>

</template>

<style scoped>

.raw-location {
  box-sizing: border-box;
  border-bottom: 1px solid #555;
  color: yellowgreen;
}

.raw-code {
  height: 2rem;
  line-height: 2rem;
  padding-left: .75rem;
  font-family: Consolas, sans-serif;
  margin: 0;
}

</style>