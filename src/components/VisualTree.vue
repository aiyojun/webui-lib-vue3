<script setup lang="ts">

import * as echarts from "echarts";
import {onMounted, ref} from "vue";

const chartTree = ref<HTMLDivElement>()
type JsonNode = {name: string, children: Array<JsonNode>}
const props = defineProps<{root: JsonNode}>();

onMounted(() => {
  const chart = echarts.init(chartTree.value)
  chart.setOption({
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: [
      {
        type: 'tree',
        data: [props.root],
        top: '1%',
        left: '7%',
        bottom: '1%',
        right: '20%',
        symbolSize: 7,
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 9
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left'
          }
        },
        emphasis: {
          focus: 'descendant'
        },
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750
      }
    ]
  })
})

</script>

<template>
  <div ref="chartTree" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
  </div>
</template>

<style scoped>

</style>