import {hash} from "./functools.ts";
import {defineComponent, onMounted, reactive} from "vue";
import {defineBuiltin, defineWidget, WidgetContext, WidgetObject} from "./lib_widget.ts";
import {dumpsValue, fillValue} from "./lib_openapi.ts";

export const VxiWidget = defineComponent({
    props: ['schema'],
    setup(props, emits) {
        const space: { widgetObject: WidgetObject; viewSchema: any; errorObject: any; md5view: string }
            = reactive({ widgetObject: null, viewSchema: null, errorObject: null, md5view: null })
        const screw = () => {
            space.viewSchema = reactive(space.widgetObject.getViewSchema())
            space.widgetObject.setViewSchema(space.viewSchema)
            space.md5view = hash(space.viewSchema)
        }
        onMounted(() => {
            space.widgetObject = WidgetObject.build(props.schema)
            screw()
            space.widgetObject.addEventListener('structureChange', () => screw())
            space.widgetObject.activate()
            window['probe'] = {viewTree: space.viewSchema}
        })
        return () => <div class="VxiWidget">{
            space.viewSchema !== null
                ? <div class="VxiWidgetRender" key={space.md5view}>{WidgetContext.render(WidgetContext.build(space.widgetObject, space.viewSchema))}</div>
                : null
        }</div>
    }
})


// export const VoaWidget = defineComponent({
//     props: ['schema'],
//     setup(props, emits) {
//         const schema = reactive(props.schema)
//         console.info(`VoaWidget :`, schema)
//         onMounted(() => {window['probe'] = {viewTree: schema}})
//         return () => <div class="VoaWidget">{VxiArgs.vxiRender(VxiArgs.build(schema))}</div>
//     }
// })

defineWidget({
    name: 'input',
    render(args: WidgetContext) {
        return <div>
            <label>{args.getPrivilegedAttribute('label')}</label>
            <el-input
                modelValue={args.getValue()}
                onUpdate:modelValue={x => args.setValue(x)}
            ></el-input>
        </div>
    }
})

defineWidget({
    name: 'form',
    render(args: WidgetContext) {
        return <div class="form">{WidgetContext.renderObject(args)}</div>
    }
})

defineWidget({
    name: 'page',
    render(args: WidgetContext) {
        return <div class="page">{WidgetContext.renderObject(args)}</div>
    }
})


defineBuiltin({
    name: 'dump',
    handle(vxiArgs: WidgetContext) {
        return dumpsValue(vxiArgs.getSchema())
    }
})

defineBuiltin({
    name: 'update',
    handle(vxiArgs: WidgetContext, value) {
        // vxiArgs.setValue(value)
    }
})


defineBuiltin({
    name: 'fill',
    handle(vxiArgs: WidgetContext, data) {
        fillValue(vxiArgs.getSchema(), data)
    }
})