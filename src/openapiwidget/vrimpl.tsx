import {defineComponent, onMounted} from "vue"
import {VNodeChild} from "@vue/runtime-core";
import {exists, getDefault, hash, hasXWidget} from "./fwimpl";


export interface XWidget {
    name: string;
    render(args: VxiArgs): VNodeChild;
}

export interface XLayout {
    type: string;
}

export interface XBuiltin {
    name: string;
}

interface MoSType {
    widgets: Array<XWidget>;
    layouts: Array<XLayout>;
    builtins: Array<XBuiltin>;
}

// module space
const MoS: MoSType = {widgets: [], layouts: [], builtins: []}


export function defineWidget(w: XWidget) {
    MoS.widgets.push(w)
}

export function defineLayout(l: XLayout) {
}

export function defineBuiltin(b: XBuiltin) {
}

// WidgetProperty WidgetView
//
export class VxiArgs {
    protected schema: any;
    private xpath: string;
    private route: Array<any>;
    getXWidget() {
        return this.schema['x-widget']
    }
    getPriorityProperty(prop: string) {
        const key = `x-${prop}`
        return exists(this.schema, key) ? this.schema[key] : null
    }
    private constructor() {
    }
    static build(schema, xpath, route) {
        const r = new VxiArgs()
        r.schema = schema
        r.xpath  = xpath
        r.route  = route
        return r
    }
    private static next(args: VxiArgs, ipath: string, nextSchema): VxiArgs {
        return VxiArgs.build(nextSchema, `${args.xpath}${ipath}`, [...args.route, args.schema])
    }
    static vxiRender(args: VxiArgs) {
        const {schema} = args
        if (!exists(schema))
            return null
        if (!hasXWidget(schema))
            throw new Error(`x-widget undefined`)
        const xWidget = schema['x-widget']
        for (let i = 0; i < MoS.widgets.length; i++) {
            const widget = MoS.widgets[i]
            if (widget.name === xWidget['type'])
                return widget.render(args)
        }
        return null
    }
    static vxiRenderObject(args: VxiArgs): VNodeChild | Array<VNodeChild> {
        const {schema} = args; const {_map} = schema
        return Object.keys(_map).map(field => VxiArgs.vxiRender(VxiArgs.next(args, `/${field}`, _map[field])))
    }
    static vxiRenderArray(args: VxiArgs) {
        const {schema} = args; const {_list} = schema
        return _list.map((each, i) => VxiArgs.vxiRender(VxiArgs.next(args, `[${i}]`, each)
        ))
    }
}


defineWidget({
    name: 'input',
    render(args: VxiArgs) {
        return <div>
            <label>{args.getPriorityProperty('label')}</label>
            <el-input></el-input>
        </div>
    }
})

defineWidget({
    name: 'form',
    render(args: VxiArgs) {
        return <div class="form">{VxiArgs.vxiRenderObject(args)}</div>
    }
})

defineWidget({
    name: 'page',
    render(args: VxiArgs) {
        return <div class="page">{VxiArgs.vxiRenderObject(args)}</div>
    }
})


export const VoaWidget = defineComponent({
    props: ['schema'],
    setup(props, emits) {
        console.info(`VoaWidget :`, props.schema)
        onMounted(() => {
        })
        return () => <div key={hash(props.schema)} class="VoaWidget">{VxiArgs.vxiRender(
            VxiArgs.build(props.schema, '', [])
        )}</div>
    }
})