<script setup lang="ts">

import {onMounted, reactive, ref, watch} from "vue";
import SvgOf from "./SvgOf.vue";

interface Meeting {
  beginTime: number;
  endTime: number;
  title: string;
  author: string;
  content: string;
  room: string;
  roomNumber: number;
  hover: boolean;
  tag: boolean;
}
const meetingRoomNames = ['A栋三楼会议室303（靠窗）', 'A栋三楼会议室304（中间）', 'A栋二楼会议室202（外侧）', 'A栋二楼会议室201（中间）', 'A栋二楼大会议室', '', 'A栋一楼洽谈室（大厅）', 'B栋二楼培训室',]
function mapMeetingRoom(roomNumber: number) {return {7: 1, 8: 2, 4: 3, 1: 4, 2: 5, 3: 6, 5: 7, 6: 8 }[roomNumber]}
const dayms = 24 * 60 * 60 * 1000
const props = defineProps<{ meetings: Array<Meeting> }>()
const reactiveMeetings: Array<Meeting> = reactive([])
const tim = reactive({
  now: new Date().getTime(),
  dayBegin: Math.floor(new Date().getTime() / dayms) * dayms - 8 * 60 * 60 * 1000
})
const ganttGraphElement = ref<HTMLDivElement>()
const ganttGraphBodyElement = ref<HTMLDivElement>()
const palette = reactive({scale: 10.0, width: 0, height: 0, coverWidth: 170, rowHeight: 40, itemHeight: 40, widthPerHour: 200})
const stylize_colors = [
    '#8EC5FC', '#E0C3FC', '#80D0C7', '#D9AFD9',
    '#97D9E1', '#FBAB7E', '#F7CE68', '#C850C0',
    '#0093E9']

function translucent(color: string, alpha: number) {
  color = color.toUpperCase()
  const cvt = (s: string, b: number, e: number) => parseInt(s.substring(b, e), 16)
  if (/^#[0-9A-F]{3}$/.test(color))
    return `rgba(${cvt(color, 1, 2)}, ${cvt(color, 2, 3)}, ${cvt(color, 3, 4)}, ${alpha})`;
  else if (/^#[0-9A-F]{6}$/.test(color))
    return `rgba(${cvt(color, 1, 3)}, ${cvt(color, 3, 5)}, ${cvt(color, 5, 7)}, ${alpha})`;
  else
    return `rgba(255, 255, 255, ${alpha})`
}

function computeBeginPosition(ms: number) {
  const delta = ms - tim.dayBegin
  let r = 0;
  if (delta > 0) {
    r = delta / (1000 * 60 * 60) * palette.widthPerHour
  }
  return r
}

function computeDuration(bt: number, et: number) {
  const delta = et - bt
  let r = delta / (1000 * 60 * 60) * palette.widthPerHour
  return r
}

function computeState(bt: number, et: number) {
  const now = tim.now
  if (now < bt) return 0
  else if (now >= et) return 2
  else return 1
}

function handleUpdateState() {
  tim.now = new Date().getTime()
  tim.dayBegin = Math.floor(tim.now / dayms) * dayms - 8 * 60 * 60 * 1000
  reactiveMeetings.forEach((meeting) => meeting['state'] = computeState(meeting.beginTime, meeting.endTime))
}

function handleWheel(e: WheelEvent) {
  if (e.altKey) {
    const ratio = ganttGraphBodyElement.value.scrollLeft / palette.widthPerHour
    if (e.deltaY < 0) {
      palette.widthPerHour += 10
      if (palette.widthPerHour >= 500) palette.widthPerHour = 500
    } else if (e.deltaY > 0) {
      palette.widthPerHour -= 10
      if (palette.widthPerHour <= 50) palette.widthPerHour = 50
    }
    ganttGraphBodyElement.value.scrollLeft = palette.widthPerHour * ratio;
  } else {
    e.preventDefault()
    if (e.deltaY < 0) {
      ganttGraphBodyElement.value.scrollLeft -= 30
      if (ganttGraphBodyElement.value.scrollLeft <= 10) {
        ganttGraphBodyElement.value.scrollLeft = 10
      }
    } else {
      ganttGraphBodyElement.value.scrollLeft += 30
      if (ganttGraphBodyElement.value.scrollLeft >= ganttGraphBodyElement.value.scrollWidth - 10) {
        ganttGraphBodyElement.value.scrollLeft = ganttGraphBodyElement.value.scrollWidth - 10
      }
    }
  }
}

function init(meetings: Array<Meeting>) {
  reactiveMeetings.splice(0, reactiveMeetings.length)
  meetings.forEach(meeting => {
    const m = JSON.parse(JSON.stringify(meeting));
    m['state'] = 0;
    reactiveMeetings.push(m)
  })
  handleUpdateState()
  const rect = ganttGraphElement.value.getBoundingClientRect()
  palette.width = rect.width
  palette.height = rect.height
  // ganttGraphBodyElement.value.scrollLeft = palette.widthPerHour * 8;
  ganttGraphBodyElement.value.scrollLeft = palette.widthPerHour * (new Date().getHours() - 2)
  setInterval(handleUpdateState, 2000)
}

watch(props.meetings, (meeting) => {
  init(meeting)
})

onMounted(() => {
  init(props.meetings)
})

</script>

<template>
  <div class="gantt-graph" ref="ganttGraphElement" :style="{height: `calc(${palette.rowHeight}px * 9.5)`}" @wheel="handleWheel">
    <div class="gantt-cover" :style="{width: `${palette.coverWidth}px`}">
      <div style="width: 100%;" :style="{height: `${palette.rowHeight}px`}"></div>
      <div class="gantt-cover-row" v-for="roomName in meetingRoomNames">
        <span class="meeting-location">{{ roomName }}</span>
      </div>
    </div>
    <div class="gantt-body" :style="{width: `calc(100% - ${palette.coverWidth}px)`}" ref="ganttGraphBodyElement">
      <div v-for="(_, i) in (new Array(24).fill(0))"
           style="position: absolute; width: 0; border-left: 0.05rem dashed #eee;"
           :style="{top: `${palette.rowHeight}px`, left: `${10 + palette.widthPerHour * i}px`, height: `${palette.rowHeight * 8}px`}"></div>
      <div class="gantt-header">
        <div class="header-item" :style="{width: `${palette.widthPerHour}px`}"
             v-for="(_, i) in (new Array(24).fill(0))">{{ i < 10 ? `0${i}` : `${i}` }}:00
        </div>
      </div>
      <div class="gantt-item"
           v-for="(ganttItem, ganttItemIndex) in reactiveMeetings"
           @mouseenter="ganttItem.hover = true" @mouseleave="ganttItem.hover = false"
           :style="{
           top: `${palette.rowHeight * (9.25 - mapMeetingRoom(ganttItem.roomNumber))}px`,
           left: `${10 + computeBeginPosition(ganttItem.beginTime)}px`,
           width: `${computeDuration(ganttItem.beginTime, ganttItem.endTime)}px`,
           backgroundColor: translucent(stylize_colors[ganttItemIndex % stylize_colors.length], .75)
         }">
        <div class="gantt-item-text">{{ ganttItem.author + ": " + ganttItem.title }}</div>
        <div class="gantt-item-avatar">
          <SvgOf v-if="ganttItem['state'] === 0" name="wait"
                 primary-color="white" :width="20" :height="20"/>
          <SvgOf v-else-if="ganttItem['state'] === 2" name="finish"
                 primary-color="white" :width="20" :height="20"/>
          <SvgOf v-else-if="ganttItem['state'] === 1" name="meeting"
                 primary-color="white" :width="28" :height="28"/>
        </div>
        <div v-if="ganttItem.tag" class="gantt-item-tag">
          <SvgOf name="flag-fill-2" :width="24" :height="24" primary-color="pink"/>
        </div>
        <div v-if="ganttItem.hover" class="gantt-hover-menu"
             :style="mapMeetingRoom(ganttItem.roomNumber) < 4 ? {bottom: `calc(100% + 8px)`} : {top: `calc(100% + 8px)`}">
          <div class="gantt-hover-menu-line" style="margin-bottom: 5px;">{{ ganttItem.author }}</div>
          <div class="gantt-hover-menu-line" style="margin-bottom: 5px;">{{ ganttItem.title }}</div>
          <div class="gantt-hover-menu-line" style="margin-bottom: 5px;">{{ ganttItem.room }}</div>
          <div class="gantt-hover-menu-line" style="margin-bottom: 5px;">
            {{ new Date(ganttItem.beginTime).toLocaleTimeString().substring(0, 5) }} -
            {{ new Date(ganttItem.endTime).toLocaleTimeString().substring(0, 5) }}
          </div>
          <pre v-if="ganttItem.content !== ''" style="margin-bottom: 5px; max-width: 320px; overflow: hidden; text-overflow: ellipsis;">{{ganttItem.content}}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

@import "../style_share.css";

.gantt-graph {
  position: relative;
  overflow: hidden;
  background: white;
  display: flex;
  width: 100%;
}

.gantt-body {
  height: 100%;
  overflow: auto;
  position: relative;
  box-sizing: border-box;
}

.gantt-header {
  height: 40px;
  user-select: none;
  box-sizing: border-box;
  padding-left: 10px;
  display: flex;
  align-items: center;
}

.header-item {
  flex-shrink: 0;
  font-size: 12px;
  color: #888;
  text-align: center;
}

.gantt-item {
  position: absolute;
  box-sizing: border-box;
  height: 24px;
  /*height: 40px;*/
  /*border-radius: 20px;*/
  box-shadow: -2px 2px 10px rgba(0, 0, 0, 0.08), 2px 2px 10px rgba(0, 0, 0, 0.08);
  cursor: pointer;

}

.gantt-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /*padding-left: 20px;*/
  padding-left: .5rem;
  padding-right: 6px;
}

.gantt-item:hover {

}

.gantt-item-avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 14px;
  /*background-color: white;*/
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.gantt-item-tag {
  position: absolute;
  left: 0;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  top: -50%;
}

.gantt-item-text {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-family: "Titillium Web", Inter, Helvetica, sans-serif;
  font-size: 12px;
  color: white;
  height: 100%;
  display: flex;
  align-items: center;
}

.gantt-hover-menu {
  position: absolute;
  left: 20px;
  font-family: "Titillium Web", Inter, Helvetica, sans-serif;
  font-size: 12px;
  background: linear-gradient(180deg, #ffffff 0, #f0f0f0 70%, #ffffff 100%);
  box-shadow: -2px 2px 10px rgba(0, 0, 0, 0.08), 2px 2px 10px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  box-sizing: border-box;
  padding: 4px 8px;
  z-index: 1000;
  color: #777;
}

.gantt-hover-menu-line {
  white-space: nowrap;
}

.gantt-cover {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  box-sizing: border-box;
  padding-left: .5rem;
  padding-right: .5rem;
  color: #888;
  font-family: 'Titillium Web', Inter, Helvetica, sans-serif;
  font-size: 12px;
  overflow: hidden;
}

.gantt-cover-row {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  pointer-events: none;
  user-select: none;
}

.meeting-location {
}

</style>