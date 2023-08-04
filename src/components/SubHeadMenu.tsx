import {defineComponent} from "vue";
import {exists} from "../utils/jlib.ts";
import "./SubHeadMenu.css"

export default defineComponent({
    props: ['items'],
    emits: ['clickSubMenu'],
    setup(props, emits) {
        const parseItem = (item, parent: Array<string>=[]) => {
            console.info("parent :", parent)
            if (!exists(item, 'children'))
                return <div class="head-menu-block state-hover"
                            onClick={(e) => {e.stopPropagation();emits.emit('clickSubMenu', [...parent, item['name']].join('/'))}}>
                    {item['name']}</div>
            else
                return <div class="head-menu-block state-hover"
                            onMouseenter={() => setTimeout(() => item.fold = true, 100)}
                            onMouseleave={() => item.fold = false}
                >{item['name']}
                    {item.fold ? null : <div class="head-menu-wrapper">{item['children'].map((i) => parseItem(i, [...parent, item['name']]))}</div>}
                </div>
        }

        return () => <div class="head-menu-wrapper">{props.items.map((x) => parseItem(x))}</div>
    }
})