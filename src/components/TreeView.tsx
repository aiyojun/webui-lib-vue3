import {defineComponent, reactive} from "vue";
import {exists, clone} from "../utils/jlib.ts";
import SvgOf from "../ui/SvgOf.vue";

export default defineComponent({
    props: ['root'],
    setup(props) {

        const root = reactive(clone(props.root))

        const clickItem = (node, depth) => {
            node['fold'] = !node['fold']
        }

        const item = (node, depth, isFolder=false) => <div
            class="state-hover" style={`height: 2rem; width: 100%; box-sizing: border-box; padding-left: ${(depth + 1) * 8}px; border-radius: 6px; cursor: pointer; display: flex; align-items: center;`} onClick={() => clickItem(node, depth)}>
            <div style="width: 10px; height: 10px; display: flex; justify-content: center; align-items: center;">
                {isFolder ? <SvgOf name="arrow-right" style={`transform: rotate(${node['fold'] ? 0 : 90 }deg);`} width={8} height={8} color="#ddd"/> : null}
            </div>
            <div style="margin-left: .5rem;">{node.name || ''}</div>
        </div>

        const branch = (node, depth=0) => {
            if (!exists(node, 'fold'))
                node['fold'] = true

            if (exists(node, 'children')
                && node.children instanceof Array
                && node.children.length > 0) {
                return <div>
                    {item(node, depth, true)}
                    {node['fold'] ? null : node.children.map(child => branch(child, depth + 1))}
                </div>
            } else {
                return item(node, depth)
            }
        }

        return () => <div style="width: 100%; height: 10rem; overflow: auto; box-sizing: border-box; padding: 0 .75rem; color: #ddd; background-color: var(--secondary-background-color);">
            {root.map(node => branch(node))}
        </div>
    }
})