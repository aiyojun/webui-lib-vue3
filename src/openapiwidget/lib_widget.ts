import {async_execute, exists, getDefault, isObject, uuid} from "./functools.ts";
import {Highway} from "./highway.ts";
import {VNodeChild} from "@vue/runtime-core";
import * as lib_openapi from "./lib_openapi.ts";


function hasXWidget(schema) {
    return exists(schema, 'x-widget')
}

export function traverse(schema, callback: (schema) => any, after: (schema) => any = () => {
}) {
    lib_openapi.traverse(schema, (schema) => {
        if (!hasXWidget(schema)) return
        callback(schema)
    }, (schema) => {
        if (!hasXWidget(schema)) return
        after(schema)
    })
}

function checkWidget(schema, xpath = '') {
    if (hasXWidget(schema))
        checkXWidget(schema, xpath)
    const {type} = schema
    if (type === 'object') {
        const {_map} = schema
        for (let key in _map)
            checkWidget(_map[key], `${xpath}/properties/${key}`)
        setRequiredXWidget(schema)
        return
    }
    if (type === 'array') {
        const {_list} = schema
        for (let i = 0; i < _list.length; i++)
            checkWidget(_list[i], `${xpath}/items[${i}]`)
        return
    }
}

function checkLayout(layout, xpath) {
    if (!exists(layout, 'type'))
        throw new Error(`layout lack of type`)
    if (exists(layout, 'children')) {
        const {children} = layout['children']
        if (!Array.isArray(children))
            throw new Error(`layout children must be an array`)
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            checkLayout(child, `${xpath}/children[${i}]`)
        }
    }
}

function checkBindScripts(xWidget, xpath) {
    if (!exists(xWidget, 'bindScripts')) return
    const {bindScripts} = xWidget
    if (!isObject(bindScripts))
        throw new Error(`${xpath}/bindScripts must be an object`)
    for (let key in bindScripts) {
        const events = bindScripts[key]
        if (!isObject(events))
            throw new Error(`${xpath}/bindScripts/${key} : events must be an object`)
        for (let eventName in events) {
            if (!Array.isArray(events[eventName]))
                throw new Error(`${xpath}/bindScripts/${key}/${eventName} : event scripts must be an array`)
        }
    }
}

function checkScripts(xWidget, xpath) {
    if (!exists(xWidget, 'scripts')) return
    const {scripts} = xWidget
    if (!Array.isArray(scripts))
        throw new Error(`${xpath}/scripts must be an array`)
}

function checkXWidget(schema, xpath) {
    schema['x-label'] = getDefault(schema, 'x-label', '')
    schema['x-visible'] = getDefault(schema, 'x-visible', true)
    const xWidget = schema['x-widget']
    if (!exists(xWidget, 'type'))
        throw new Error(`${xpath}/x-widget : widget lack of type`)
    checkScripts(xWidget, `${xpath}/x-widget`)
    checkBindScripts(xWidget, `${xpath}/x-widget`)
    if (exists(xWidget, 'layout'))
        checkLayout(xWidget['layout'], `${xpath}/x-widget/layout`)
    xWidget['editable'] = getDefault(xWidget, 'editable', true)
    xWidget['required'] = false
    xWidget['_uuid'] = uuid()
    // this.widgetViews.set(xWidget['_uuid'], schema)
    // const {type} = xWidget
    // if (!MoS.widgets.map(w => w.name).includes(type))
    //     throw new Error(`${xpath}/x-widget/type : no such widget : ${type}`)
    return true
}

function setRequiredXWidget(schema) {
    const {type} = schema
    if (type !== 'object' || !exists(schema, 'required') || !Array.isArray(schema['required'])) return
    const {_map, required} = schema
    for (let key in _map) {
        const property = _map[key]
        if (!hasXWidget(property))
            continue
        const xWidget = property['x-widget']
        xWidget['required'] = required.includes(key)
    }
}

export const mbus = new Highway()

export interface XWidget {
    name: string;

    render(args: WidgetContext): VNodeChild;
}

export interface XLayout {
    type: string;

    render(layout: any, args: WidgetContext): VNodeChild;
}

export interface XBuiltin {
    name: string;
    handle: (context: WidgetContext, ...args) => any;
}

interface MoSType {
    widgets: Array<XWidget>;
    layouts: Array<XLayout>;
    builtins: Array<XBuiltin>;
}

const MoS: MoSType = {widgets: [], layouts: [], builtins: []}

export function defineWidget(w: XWidget) {
    MoS.widgets.push(w)
}

export function defineLayout(l: XLayout) {
    MoS.layouts.push(l)
}

export function defineBuiltin(b: XBuiltin) {
    MoS.builtins.push(b)
}

export class WidgetObject extends lib_openapi.OpenapiContextObject {
    protected views: Map<string, any> = new Map();

    protected constructor(protected schema: any) {
        super(schema)
        this.prepare()
        checkWidget(this.viewschema)
        traverse(this.viewschema, (schema) => this.views.set(schema['x-widget']['_uuid'], schema))
    }

    static build(schema): WidgetObject {
        return new WidgetObject(schema)
    }

    activate() {
        this.hooks.emit('beforeCreate')
        this.lifecycle(this.viewschema, WidgetContext.build(this, this.viewschema))
        this.hooks.emit('afterCreate')
        return this
    }

    protected buildUserspace(vxiArgs: WidgetContext) {
        const sandbox = MoS.builtins.reduce((prev, curr) =>
            ({
                ...prev, [curr.name]: (...args) => {
                    try {
                        return curr.handle(vxiArgs, ...args)
                    } catch (e) {
                        console.error(e)
                    }
                }
            }), {})
        return {...sandbox, ...this.userspace}
    }

    protected lifecycle(schema, args: WidgetContext) {
        if (hasXWidget(schema)) {
            this.bindEvents(schema, args)
            const scripts = (exists(schema, 'x-lifetime')
                && exists(schema['x-lifetime'], 'afterCreated'))
                ? schema['x-lifetime']['afterCreated'] : []
            if (scripts.length > 0)
                scripts.forEach(async script => await async_execute(this.buildUserspace(args), script))
        }

        const {type} = schema
        if (type === 'object') {
            const {_map} = schema
            for (const key in _map)
                this.lifecycle(_map[key], WidgetContext.next(args, `/${key}`, _map[key]))
        } else if (type === 'array') {
            const {_list} = schema
            for (let i = 0; i < _list.length; i++)
                this.lifecycle(_list[i], WidgetContext.next(args, `[${i}]`, _list[i]))
        }

        if (hasXWidget(schema)) {
            const scripts = (exists(schema, 'x-lifetime')
                && exists(schema['x-lifetime'], 'beforeMount'))
                ? schema['x-lifetime']['beforeMount'] : []
            if (scripts.length > 0)
                scripts.forEach(async script => await async_execute(this.buildUserspace(args), script))
        }
    }

    protected bindEvents(schema, args: WidgetContext) {
        const self = this
        const templatePath = args.getXpath()
            .replaceAll(/\[-?\d+]/g, '')
            .replaceAll('/', '.')
        const xWidget = schema['x-widget']
        const route = args.getRoute()
        for (let i = route.length - 1; i > -1; i--) {
            const container = route[i]['x-widget']
            if (exists(container, 'bindScripts')) {
                const {bindScripts} = container
                for (const rtp /* relative template path */ in bindScripts) {
                    if (!templatePath.endsWith(rtp)) continue
                    const events = bindScripts[rtp]
                    for (const eventName in events) {
                        const scripts = events[eventName]
                        const topic = `uuid:${xWidget['_uuid']};event:${eventName}`
                        console.debug(`-- subscribe ${topic} xpath ${args.getXpath()}`)
                        mbus.subscribe(topic,
                            async () => {
                                for (const script of scripts)
                                    await async_execute(self.buildUserspace(args), script)
                            })
                    }
                }
            }
        }
    }

    linkage(schema, args: WidgetContext) {
        const route = args.getRoute()
        for (let i = route.length - 1; i > -1; i--) {
            const container = route[i]['x-widget']
            if (exists(container, 'scripts')) {
                const {scripts} = container
                for (const script in scripts) {
                    try {
                        async_execute(this.buildUserspace(args), script).then()
                    } catch (e) {
                        console.error(e)
                    }
                }
            }
        }
    }
}

export class WidgetContext {
    protected schema: any;
    protected xpath: string;
    protected route: Array<any>;
    protected widget: WidgetObject;

    private constructor() {
    }

    static build(widgetObject, schema, xpath = '', route = []) {
        const r = new WidgetContext()
        r.widget = widgetObject
        r.schema = schema
        r.xpath = xpath
        r.route = route
        return r
    }

    getXpath() {
        return this.xpath
    }

    getRoute() {
        return this.route
    }

    getXWidget() {
        return this.schema['x-widget']
    }

    getSchema() {
        return this.schema
    }

    getValue(): any {
        return this.schema['_value']
    }

    setValue(data) {
        this.schema['_value'] = lib_openapi.setStdValue(this.schema['type'], data)
        this.widget.linkage(this.schema, this)
    }

    // Privileged attribute
    getPrivilegedAttribute(attr: string) {
        const key = `x-${attr}`
        return exists(this.schema, key) ? this.schema[key] : null
    }

    static next(args: WidgetContext, ipath: string, nextSchema): WidgetContext {
        return WidgetContext.build(args.widget, nextSchema, `${args.xpath}${ipath}`, [...args.route, args.schema])
    }

    static render(args: WidgetContext, layout: any = null) {
        if (layout === null)
            return WidgetContext._render(args)
        if (layout['type'] === 'widget')
            return WidgetContext._render(args)
        for (let i = 0; i < MoS.layouts.length; i++) {
            const layoutImpl = MoS.layouts[i]
            if (layoutImpl.type === layout['type'])
                return layoutImpl.render(layout, args)
        }
        return null
    }

    protected static _render(args: WidgetContext) {
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

    static renderObject(args: WidgetContext): VNodeChild | Array<VNodeChild> {
        const {schema} = args
        const {_map} = schema
        return Object.keys(_map).map(field => WidgetContext.render(WidgetContext.next(args, `/${field}`, _map[field])))
    }

    static renderArray(args: WidgetContext) {
        const {schema} = args;
        const {_list} = schema
        return _list.map((each, i) => WidgetContext.render(WidgetContext.next(args, `[${i}]`, each)))
    }
}