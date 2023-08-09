// import * as fs from "node:fs"
import * as CryptoJS from "crypto-js";
import qs from "qs";

export function hash(o) {
    return CryptoJS.MD5(JSON.stringify(o)).toString()
}
export const clone = obj => JSON.parse(JSON.stringify(obj))
export function isObject(a) {
    return typeof a === 'object' && !Array.isArray(a)
}
export function exists(o: any, k?: string) {
    if (k === undefined)
        return o !== undefined && o !== null
    return typeof o === 'object' && o !== null
        && !(o instanceof Array) && Object.keys(o).includes(k)
        && o[k] !== undefined && o[k] !== null
}
export function getDefault(data: any, key: string, defaultValue: any) {
    return exists(data, key) ? data[key] : defaultValue
}
async function http_send(method, url, body, headers) {
    return {data: null}
}
function formatQuery(param, data): string {
    if (param.style && param.style === 'form') {
        if(param.explode){
            return Array.isArray(data) ? qs.stringify({[param.name]: data}, {arrayFormat: 'repeat'}) || `${param.name}=` : qs.stringify(data)
        }else{
            return Array.isArray(data) ? `${param.name}=${data.join(',')}` : Object.entries(data).flatMap(ele => ele).join(',')
        }
    } else {
        return `${param.name}=${data}`
    }
}

function CodeSpace(func_space: Record<string, any>, script: string) {
    const sandbox = {window: null, document: null, eval: null, ...func_space}
    const args = Array.from(Object.keys(sandbox))
    const rArgs = args.map(n => sandbox[n])
    return (new Function(...args, script))(...rArgs)
}
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
async function AsyncCodeSpace(func_space: Record<string, any>, script: string) {
    const sandbox = {document: null, eval: null, window: null, ...func_space}
    const args = Array.from(Object.keys(sandbox))
    const rArgs = args.map(n => sandbox[n])
    return await (new AsyncFunction(...args, script))(...rArgs)
}
function execute(func_space: Record<string, any>, script: string) {
    return CodeSpace({...func_space}, script)
}
async function async_execute(func_space: Record<string, any>, script: string) {
    return await AsyncCodeSpace({...func_space, dumpJson: (data: any) => JSON.stringify(data)}, script)
}

const PATTERN_REFERENCE_ID = /^#(\/[a-zA-Z_][a-zA-Z0-9_.-]*)+$/

export class OpenapiObject {
    protected image: any;
    protected sandbox: Record<string, (...args) => any> = {};
    // protected templates: Map<string, TemplateObject> = new Map();
    // protected instances: Map<string, InstanceObject> = new Map();
    // protected tree: InstanceTree = null;
    protected components: Map<string, any> = new Map();
    protected referenced: Array<string> = [];
    protected viewSchema: any = null;
    getImage() {return this.image}
    getViewSchema() {return this.viewSchema}
    search(root, pathSeq) {
        if (pathSeq.length === 0)
            return null
        let _node = root
        let i = 0
        while (i < pathSeq.length) {
            const _key = pathSeq[i]
            if (!exists(_node, _key))
                return null
            _node = _node[_key]
            i++
        }
        return _node
    }
    createObject(schema, data=undefined) {
        schema = this.isOneOf(schema)
            ? this.createObjectByOneOf(schema, data)
            : clone(this.isRef(schema) ? this.getRef(schema) : schema)
        this.walkAssignValue(schema, data)
        return schema
    }
    setStdValue(type, data) {
        const lazyOptions = [
            {tf: () => type === 'number' , hd: () => typeof data === type ? data : null},
            {tf: () => type === 'string' , hd: () => typeof data === type ? data : null},
            {tf: () => type === 'boolean', hd: () => typeof data === type ? data : null},
            {tf: () => type === 'null'   , hd: () => null},
        ]
        for (let i = 0; i < lazyOptions.length; i++) {
            if (lazyOptions[i].tf())
                return lazyOptions[i].hd()
        }
        throw new Error(`unknown data type, data : ${data}`)
    }
    private walkAssignValue(_schema, _data) {
        const {type} = _schema
        if (_data === undefined && exists(_schema, 'x-default'))
            _data = _schema['x-default']
        if (type === 'object') {
            const {properties} = _schema
            const _map = {}
            for (let key in properties) {
                if (exists(_data) && !exists(_data, key))
                    throw new Error(``)
                const iSchema = properties[key]
                _map[key] = this.createObject(iSchema, exists(_data) ? _data[key] : undefined)
            }
            _schema['_map'] = _map
            return
        }
        if (type === 'array') {
            const {items} = _schema
            const _list = []
            if (exists(_data) && !Array.isArray(_data))
                throw new Error(``)
            if (exists(_data))
                for (let i = 0; i < _data.length; i++)
                    _list.push(this.createObject(items, _data[i]))
            _schema['_list'] = _list
            return
        }
        _schema['_value'] = this.setStdValue(type, _data)
    }
    isRef(_schema) { return exists(_schema, '$ref') }
    // getRef(_schema) { return this.components.get(_schema['$ref']) }
    getRef(_schema) { return this.search(this.image, _schema['$ref'].substring(2).split('/')) }
    isOneOf(_schema) { return exists(_schema, 'discriminator') }
    createObjectByOneOf(_schema, data) {
        if (data === undefined)
            throw new Error(``)
        const {discriminator} = _schema
        const {propertyName, mapping} = discriminator
        if (!exists(data, propertyName))
            throw new Error(``)
        const disc = data[propertyName]
        if (!exists(mapping, disc))
            throw new Error(`${Object.keys(mapping).join('/')}`)
        const schema = this.isRef(mapping[disc]) ? this.components.get(mapping[disc]['$ref']) : mapping[disc]
        return this.createObject(schema, data)
    }
    analysis() {
        console.info()
        console.info(`referenced :`)
        this.referenced.forEach(reference => console.info(`  ${reference}`))
        console.info(`components : (${this.components.size})`)
        this.components.forEach((component, name) => console.info(`  ${name} : ${JSON.stringify(component)}`))
        // this.referenced.forEach(reference => {
        //     if (!this.components.has(reference))
        //         throw new Error(`no such reference : ${reference}`)
        // })
        console.info(`APIs : (${Object.keys(this.sandbox).length})`)
        Object.keys(this.sandbox).forEach((name) => console.info(`-- ${name} : \n${this.sandbox[name].toString()}`))
        console.info()
        return this
    }


    parse(openapi) {
        this.image = openapi
        if (!exists(openapi, 'entry'))
            throw new Error(`openapi lack of entry`)
        if (!exists(openapi, 'paths'))
            throw new Error(`openapi lack of paths`)
        if (!exists(openapi, 'components'))
            throw new Error(`openapi lack of components`)
        const {entry, components, paths} = openapi
        if (!exists(components, 'schemas'))
            throw new Error(`openapi lack of components/schemas`)
        const {schemas} = components
        this.checkGeneric(entry, '/entry')
        for (let name in schemas) {
            this.checkGeneric(schemas[name], `/components/schemas/${name}`)
            this.components.set(`#/components/schemas/${name}`, schemas[name])
        }
        // Check reference
        for (let ref of this.referenced) {
            const path = ref.substring(2).split('/')
            if (path.includes('$ref'))
                throw new Error(`openapi disabled recursive reference`) // recursive ref
            if (!this.search(openapi, path))
                throw new Error(`path : ${ref}`)
        }
        for (let url in paths) {
            this.buildHttpFunction(paths[url], url)
        }
        this.viewSchema = this.createObject(entry)
        // fs.writeFileSync('./test.json', JSON.stringify(this.viewSchema, null, 2))
        return this
    }
    
    buildHttpFunction(httpSchema, url) {
        // const methodPost = exists(httpSchema, 'post') ? httpSchema['post'] : null
        // const methodGet  = exists(httpSchema, 'get') ? httpSchema['post'] : null
        const methodsSupport = ['get', 'post', 'put', 'delete']
        for (let method of methodsSupport) {
            if (exists(httpSchema, method))
                this.buildHttpMethod(httpSchema[method], url, method)
        }
    }
    private buildHttpUrl(url, parameters, args) {
        let hasQueryParam = false
        for (let pi = 0; pi < parameters.length; pi++) {
            const param = parameters[pi]
            if (param.in === 'path') {
                url = url.replaceAll(`{${param.name}}`, args[pi])
            } else if (param.in === 'query') {
                url = url + (hasQueryParam ? '&' : '?') + formatQuery(param, args[pi])
                hasQueryParam = true
            }
        }
        return url
    }
    private checkHttpContent(_schema) {
        if (!exists(_schema, 'content'))
            throw new Error(``)
        const {content} = _schema
        if (exists(content, 'application/json')) {
            if (!exists(content['application/json'], 'schema'))
                throw new Error(``)
            const {schema} = content['application/json']
            this.checkGeneric(schema, `/paths`)
        }
        return true
    }
    private buildHttpMethod(httpSchema, url, method) {
        // const methodBody = httpSchema[method]
        if (!exists(httpSchema, 'operationId'))
            throw new Error(`lack of operationId`)
        const {operationId} = httpSchema
        let requestBody = null;
        if (exists(httpSchema, 'requestBody')) {
            requestBody = httpSchema['requestBody']
            if (!exists(requestBody, 'content'))
                throw new Error(``)
            const {content} = requestBody
            if (exists(content, 'application/json')) {
                if (!exists(content['application/json'], 'schema'))
                    throw new Error(``)
                this.checkGeneric(content['application/json']['schema'], `/paths`)
            }
        }
        let parameters  = [];
        if (exists(httpSchema, 'parameters')) {
            parameters = httpSchema['parameters']
            if (!Array.isArray(parameters))
                throw new Error(``)
            for (let i = 0; i < parameters.length; i++) {
                const param = parameters[i]
                if (!exists(param, 'in'))
                    throw new Error(``)
                if (!exists(param, 'name'))
                    throw new Error(``)
                if (!exists(param, 'required'))
                    throw new Error(``)
                if (!exists(param, 'schema'))
                    throw new Error(``)
                param.style = getDefault(param, 'style', '')
                param.explode = getDefault(param, 'explode', false)
            }
        }
        let responses = null;
        if (exists(httpSchema, 'responses')) {
            responses = httpSchema['responses']
            if (!isObject(responses))
                throw new Error(`responses must be an object`)
            for (let code in responses) {
                if (!/[0-9]+/.test(code))
                    throw new Error(`http responses' key must be an number string`)
                this.checkHttpContent(responses[code])
            }
        }
        const paramSize = parameters.length + (requestBody === null ? 0 : 1)
        const self = this
        this.sandbox[operationId] = async (...args) => {
            if (args.length !== paramSize)
                throw new Error(``)
            let uri = self.buildHttpUrl(url, parameters, args)
            let req = requestBody === null ? {} : args[args.length - 1]
            const resp = await http_send(method, uri, req, {})
            if (exists(responses, '200') && exists(responses['200']['content'], 'application/json'))
                return self.alignValue(responses['200']['content']['application/json']['schema'], resp.data)
            else
                return null
        }
        return this
    }


    dumpsValue(root): any {
        const {type} = root
        if (type === 'object') {
            const {_map} = root
            const r = {}
            for (const key in _map) {
                r[key] = this.dumpsValue(_map[key])
            }
            return r
        }
        if (type === 'array') {
            const {_list} = root
            const r = []
            for (const each of _list) {
                r.push(this.dumpsValue(each))
            }
            return r
        }
        return root['_value']
    }

    alignValue(schema, data) {
        const tree = this.createObject(schema, data)
        return this.dumpsValue(tree)
    }


    checkObject(inode, xpath) {
        if (!exists(inode, 'properties'))
            throw new Error(`${xpath} : openapi object must specify properties`)
        const {properties} = inode
        if (!isObject(properties))
            throw new Error(`${xpath} : openapi object's properties must be an object`)
        for (let field in properties)
            this.checkGeneric(properties[field], `${xpath}/properties/${field}`)
        return true
    }

    checkArray(inode, xpath) {
        if (!exists(inode, 'items'))
            throw new Error(`${xpath} : openapi array must specify items`)
        const {items} = inode
        if (!isObject(items))
            throw new Error(`${xpath} : openapi array's items must be an object`)
        this.checkGeneric(items, `${xpath}/items`)
        return true
    }

    checkRef(inode, xpath) {
        const {$ref} = inode
        if (!PATTERN_REFERENCE_ID.test($ref))
            throw new Error(`${xpath} : invalid openapi $ref path`)
        this.referenced.push($ref)
        return true
    }

    checkOneOf(inode, xpath) {
        const {oneOf, discriminator} = inode
        if (!Array.isArray(oneOf))
            throw new Error(`${xpath} : openapi oneOf must be an array`)
        for (let i = 0; i < oneOf.length; i++)
            this.checkGeneric(oneOf[i], `${xpath}/oneOf[${i}]`)
        if (!exists(discriminator, 'propertyName') || !exists(discriminator, 'mapping'))
            throw new Error(``)
        const {propertyName, mapping} = discriminator
        if (!isObject(mapping))
            throw new Error(`${xpath}/discriminator/mapping : openapi discriminator's mapping must be an object`)
        for (let field in mapping)
            this.checkGeneric(mapping[field], `${xpath}/discriminator/mapping`)
        return true
    }

    checkGeneric(inode, xpath) {
        if (exists(inode, '$ref')  && this.checkRef(  inode, xpath)) return
        if (exists(inode, 'oneOf') && this.checkOneOf(inode, xpath)) return
        if (!exists(inode, 'type'))
            throw new Error(`${xpath} : openapi node must specify one of type/$ref/oneOf`)
        const {type} = inode
        if (!['object', 'array', 'string', 'number', 'boolean', 'null'].includes(type))
            throw new Error(`${xpath}/type : openapi type must be one of object/array/number/string/boolean/null`)
        if (type === 'object' && this.checkObject(inode, xpath)) return
        if (type === 'array'  && this.checkArray( inode, xpath)) return
    }

}


export class OpenapiObjectWithArrayOperation extends OpenapiObject {
    appendArray(schema, data=undefined) {
        const {type} = schema
        if (type !== 'array')
            throw new Error(``)
        const {items, _list} = schema
        _list.push(this.createObject(items, data))
        return this
    }

    spliceArray(schema, from, size) {
        const {type} = schema
        if (type !== 'array')
            throw new Error(``)
        const {items, _list} = schema
        _list.splice(from, size)
        return this
    }

    clearArray(schema) {
        const {type} = schema
        if (type !== 'array')
            throw new Error(``)
        schema['_list'] = []
    }

    // private isArraySchema()
}

export function hasXWidget(schema) {
    return exists(schema, 'x-widget')
}

export class VxiRuntime extends OpenapiObjectWithArrayOperation {

    checkWidget(schema, xpath) {
        if (hasXWidget(schema))
            this.checkXWidget(schema, xpath)
        const {type} = schema
        if (type === 'object') {
            const {_map} = schema
            for (let key in _map) {
                this.checkWidget(_map[key], `${xpath}/properties/${key}`)
            }
            return
        }
        if (type === 'array') {
            const {_list} = schema
            for (let i = 0; i < _list.length; i++) {
                this.checkWidget(_list[i], `${xpath}/items[${i}]`)
            }
            return
        }
    }

    protected checkXWidget(schema, xpath) {
        schema['x-label'] = getDefault(schema, 'x-label', '')
        schema['x-visible'] = getDefault(schema, 'x-visible', true)
        const xWidget = schema['x-widget']
        if (!exists(xWidget, 'type'))
            throw new Error(`${xpath}/x-widget : widget lack of type`)
        const {type} = xWidget
        xWidget['editable'] = getDefault(xWidget, 'editable', true)
        // if (!MoS.widgets.map(w => w.name).includes(type))
        //     throw new Error(`${xpath}/x-widget/type : no such widget : ${type}`)
        return true
    }

    lifecycle(schema,
              getPreOrderScripts : (_schema) => Array<string>,
              getPostOrderScripts: (_schema) => Array<string>) {
        const pre = getPreOrderScripts(schema)
        const post = getPostOrderScripts(schema)
        if (pre.length > 0)
            pre.forEach(script => execute(this.sandbox, script))
        const {type} = schema
        if (type === 'object') {
            const {_map} = schema
            for (const key in _map)
                this.lifecycle(_map[key], getPreOrderScripts, getPostOrderScripts)
        } else if (type === 'array') {
            const {_list} = schema
            for (const each in _list)
                this.lifecycle(each, getPreOrderScripts, getPostOrderScripts)
        }
        if (post.length > 0)
            post.forEach(script => execute(this.sandbox, script))
    }

}

class TemplateObject {
    protected image: any; // 镜像
    protected instances: Array<InstanceObject> = [];
}

class InstanceObject {
    protected image: any; // 镜像
    protected template: TemplateObject;
}

class InstanceTree {
    protected root: InstanceObject = null;
}







// function checkObject(inode, xpath) {
//     if (!exists(inode, 'properties'))
//         throw new Error(`${xpath} : openapi object must specify properties`)
//     const {properties} = inode
//     if (!isObject(properties))
//         throw new Error(`${xpath} : openapi object's properties must be an object`)
//     for (let field in properties)
//         checkGeneric(properties[field], `${xpath}/properties/${field}`)
//     return true
// }
//
// function checkArray(inode, xpath) {
//     if (!exists(inode, 'items'))
//         throw new Error(`${xpath} : openapi array must specify items`)
//     const {items} = inode
//     if (!isObject(items))
//         throw new Error(`${xpath} : openapi array's items must be an object`)
//     checkGeneric(items, `${xpath}/items`)
//     return true
// }
//
// function checkRef(inode, xpath) {
//     const {$ref} = inode
//     if (!PATTERN_REFERENCE_ID.test($ref))
//         throw new Error(`${xpath} : invalid openapi $ref path`)
//     return true
// }
//
// function checkOneOf(inode, xpath) {
//     const {oneOf, discriminator} = inode
//     if (!Array.isArray(oneOf))
//         throw new Error(`${xpath} : openapi oneOf must be an array`)
//     for (let i = 0; i < oneOf.length; i++)
//         checkGeneric(oneOf[i], `${xpath}/oneOf[${i}]`)
//     if (!exists(discriminator, 'propertyName') || !exists(discriminator, 'mapping'))
//         throw new Error(``)
//     const {propertyName, mapping} = discriminator
//     if (!isObject(mapping))
//         throw new Error(`${xpath}/discriminator/mapping : openapi discriminator's mapping must be an object`)
//     for (let field in mapping)
//         checkGeneric(mapping[field], `${xpath}/discriminator/mapping`)
//     return true
// }
//
// function checkGeneric(inode, xpath) {
//     if (exists(inode, '$ref')  && checkRef(  inode, xpath)) return
//     if (exists(inode, 'oneOf') && checkOneOf(inode, xpath)) return
//     if (!exists(inode, 'type'))
//         throw new Error(`${xpath} : openapi node must specify one of type/$ref/oneOf`)
//     const {type} = inode
//     if (!['object', 'array', 'string', 'number', 'boolean', 'null'].includes(type))
//         throw new Error(`${xpath}/type : openapi type must be one of object/array/number/string/boolean/null`)
//     if (type === 'object' && checkObject(inode, xpath)) return
//     if (type === 'array'  && checkArray( inode, xpath)) return
// }



// import {demo_01} from "./data.ts"
// const oo = new OpenapiObject()
// oo.parse(demo_01)
// oo.analysis()
//
// const rt = new VxiRuntime()
// rt.check(oo.getSchemaTree(), '/entry')

// 定义widget




































