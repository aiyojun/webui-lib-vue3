import {clone, exists, formatQuery, getDefault, http_send, isObject} from "./functools.ts";
import {Highway} from "./highway.ts";
import * as lib_schema from "./lib_schema.ts"

export function traverse(schema, callback: (schema) => any = undefined, after: (schema) => any = undefined) {
    if (exists(callback)) callback(schema)
    if (lib_schema.isRef(schema)) return
    if (lib_schema.isOneOf(schema)) {
        const {discriminator} = schema
        const {mapping} = discriminator
        Object.values(mapping).forEach(_schema => traverse(_schema, callback, after))
        return
    }
    const {type} = schema
    if (type === 'object') {
        const {_map} = schema
        Object.values(_map).forEach(_schema => traverse(_schema, callback, after))
        return
    }
    if (type === 'array') {
        const {_list} = schema
        Object.values(_list).forEach(_schema => traverse(_schema, callback, after))
    }
    if (exists(after)) after(schema)
}

function checkHttp(httpschema, xpath: string, schemas: Array<any> = []) {
    if (!isObject(httpschema))
        throw new Error(`${xpath} must be an object`)
    const methodsSupport = ['get', 'post', 'put', 'delete']
    for (let method in httpschema) {
        if (!methodsSupport.includes(method))
            throw new Error(`${xpath}/${method} : only support ${methodsSupport.join('/')}`)
        const httpSchema = httpschema[method]
        if (!exists(httpSchema, 'operationId'))
            throw new Error(`lack of operationId`)
        if (exists(httpSchema, 'requestBody'))
            checkHttpRequestBody(httpSchema, `${xpath}/${method}`, schemas)
        if (exists(httpSchema, 'parameters'))
            checkHttpParameters(httpSchema, `${xpath}/${method}`, schemas)
        if (exists(httpSchema, 'responses'))
            checkHttpResponses(httpSchema, `${xpath}/${method}`, schemas)
    }
}

function checkHttpRequestBody(httpSchema, xpath: string, schemas: Array<any>) {
    const {requestBody} = httpSchema
    if (!exists(requestBody, 'content'))
        throw new Error(`${xpath}/requestBody : lack of content`)
    const {content} = requestBody
    if (exists(content, 'application/json')) {
        if (!exists(content['application/json'], 'schema'))
            throw new Error(`${xpath}/requestBody/content/application/json : lack of schema`)
        const {schema} = content['application/json']
        schemas.push(schema)
        lib_schema.checkGeneric(content['application/json']['schema'], `/paths`)
    }
}

function checkHttpParameters(httpSchema, xpath: string, schemas: Array<any>) {
    const {parameters} = httpSchema
    if (!Array.isArray(parameters))
        throw new Error(`${xpath}/parameters : must be an array`)
    for (let i = 0; i < parameters.length; i++) {
        const param = parameters[i]
        if (!exists(param, 'in'))
            throw new Error(`${xpath}/parameters[${i}] : lack of in`)
        if (!exists(param, 'name'))
            throw new Error(`${xpath}/parameters[${i}] : lack of name`)
        if (!exists(param, 'required'))
            throw new Error(`${xpath}/parameters[${i}] : lack of required`)
        if (!exists(param, 'schema'))
            throw new Error(`${xpath}/parameters[${i}] : lack of schema`)
        param.style = getDefault(param, 'style', '')
        param.explode = getDefault(param, 'explode', false)
        const {schema} = param
        schemas.push(schema)
    }
}

function checkHttpResponses(httpSchema, xpath: string, schemas: Array<any>) {
    const {responses} = httpSchema
    if (!isObject(responses))
        throw new Error(`${xpath}/responses must be an object`)
    for (let code in responses) {
        if (!/[0-9]+/.test(code))
            throw new Error(`${xpath}/responses : http responses' key must be an number string`)
        checkHttpContent(responses[code], `${xpath}/responses/${code}`, schemas)
    }
}

function checkHttpContent(httpSchema, xpath: string, schemas: Array<any>) {
    if (!exists(httpSchema, 'content'))
        throw new Error(`${xpath} : lack of content`)
    const {content} = httpSchema
    if (exists(content, 'application/json')) {
        if (!exists(content['application/json'], 'schema'))
            throw new Error(`${xpath}/content/application/json : lack of schema`)
        const {schema} = content['application/json']
        schemas.push(schema)
        lib_schema.checkGeneric(schema, `${xpath}/content/application/json/schema`)
    }
    return true
}

function buildHttpUrl(url, parameters, args) {
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

export function setStdValue(type, data) {
    if (isObject(data) || Array.isArray(data))
        throw new Error(``)
    const lazyOptions = [
        {tf: () => type === 'number', hd: () => typeof data === type ? data : null},
        {tf: () => type === 'string', hd: () => typeof data === type ? data : null},
        {tf: () => type === 'boolean', hd: () => typeof data === type ? data : null},
        {tf: () => type === 'null', hd: () => null},
    ]
    for (let i = 0; i < lazyOptions.length; i++) {
        if (lazyOptions[i].tf())
            return lazyOptions[i].hd()
    }
    throw new Error(`unknown data type, data : ${data}`)
}

function assignValueRecursive(_schema, _data, _dpath: string) {
    const _route = _dpath.split('.').filter(s => s !== '')
    if (_schema['type'] !== 'object') return
    let i = 0
    let _map = _schema['_map']
    while (i < _route.length) {
        if (!exists(_map, _route[i])) return
        const sch = _map[_route[i]]
        if (i === _route.length - 1) {
            sch['_value'] = setStdValue(sch['type'], _data)
            return
        }
        if (sch['type'] !== 'object') return
        _map = sch['_map']
        ++i
    }
}

function assignNonObjectValue(_schema, _data) {
    _schema['_value'] = setStdValue(_schema['type'], _data)
}

function unfold(_data, _prefix, _d: Map<string, any>) {
    if (!isObject(_data)) return
    Object.keys(_data).forEach(k => {
        const v = _data[k]
        if (isObject(v))
            unfold(v, `${_prefix}.${k}`, _d)
        else
            _d.set(`${_prefix}.${k}`, v)
    })
}

export function fillValue(schema, data, dpath: string = '') {
    if (isObject(data)) {
        const kv = new Map<string, any>()
        unfold(data, '', kv)
        Array.from(kv.keys())
            .map(_k => [`${dpath}.${_k}`.split('.').filter(s => s !== '').join('.'), kv.get(_k)])
            .forEach(_kv => assignValueRecursive(schema, _kv[1], _kv[0]))
        return
    }
    dpath === ''
        ? assignNonObjectValue(schema, data)
        : assignValueRecursive(schema, data, dpath)
}

export function dumpsValue(root): any {
    const {type} = root
    if (type === 'object') {
        const {_map} = root
        const r = {}
        for (const key in _map) {
            r[key] = dumpsValue(_map[key])
        }
        return r
    }
    if (type === 'array') {
        const {_list} = root
        const r = []
        for (const each of _list) {
            r.push(dumpsValue(each))
        }
        return r
    }
    return root['_value']
}

export class OpenapiContextObject {

    protected userspace: Record<string, (...args) => any> = {};
    protected components: Map<string, any> = new Map();
    protected referenced: Array<string> = [];
    protected viewschema: any;
    protected hooks: Highway = new Highway()

    protected constructor(protected schema: any) {}

    static build(schema: any) {
        return new OpenapiContextObject(schema).prepare()
    }

    addEventListener(event, listener: (...args) => any) {
        this.hooks.subscribe(event, listener)
        return this
    }

    getViewSchema() {
        return this.viewschema
    }

    setViewSchema(v) {
        this.viewschema = v
        return this
    }

    createObject(schema, data = undefined) {
        schema = lib_schema.isOneOf(schema)
            ? this.createObjectByOneOf(schema, data)
            : clone(lib_schema.isRef(schema) ? lib_schema.getRef(this.schema, schema) : schema)
        this.walkAssignValue(schema, data)
        return schema
    }

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
        const schema = lib_schema.isRef(mapping[disc]) ? lib_schema.search(this.schema, mapping[disc]['$ref']) : mapping[disc]
        return this.createObject(schema, data)
    }

    alignValue(schema, data) {
        const tree = this.createObject(schema, data)
        return dumpsValue(tree)
    }

    appendArray(schema, data = undefined) {
        const {items, _list} = schema
        _list.push(this.createObject(items, data))
        this.hooks.emit('structureChange')
        return this
    }

    spliceArray(schema, from, size) {
        const {_list} = schema
        _list.splice(from, size)
        this.hooks.emit('structureChange')
        return this
    }

    clearArray(schema) {
        const {_list} = schema
        if (_list.length > 0) {
            schema['_list'] = []
            this.hooks.emit('structureChange')
        }
    }


    protected prepare() {
        /**
         * Functions:
         *   1. structure check(schema)
         *     1.1. entry
         *     1.2. components/schemas
         *     1.3. paths/..../schema
         *   2. check references
         *   3. construct http functions(userspace)
         *   4. construct instance tree
         */
        const openapi = this.schema
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
        lib_schema.checkGeneric(entry, '/entry')
        lib_schema.traverse(entry, s => this.addReference(s))
        for (const name in schemas) {
            lib_schema.checkGeneric(schemas[name], `/components/schemas/${name}`)
            lib_schema.traverse(entry, (schema) => this.addReference(schema))
            this.components.set(`#/components/schemas/${name}`, schemas[name])
        }
        const httpOfSchemas = []
        for (const urlTemplate in paths)
            checkHttp(paths[urlTemplate], `/paths/${urlTemplate}`, httpOfSchemas)
        httpOfSchemas.forEach(_schema => lib_schema.traverse(_schema, s => this.addReference(s)))
        for (const ref of this.referenced) {
            const path = ref.substring(2)
            if (!lib_schema.search(openapi, path))
                throw new Error(`no such reference : ${ref}`)
        }
        for (const urlTemplate in paths)
            this.buildHttpFunction(paths[urlTemplate], urlTemplate)
        this.viewschema = this.createObject(entry)
        return this

    }

    protected addReference(schema) {
        if (lib_schema.isRef(schema))
            this.referenced.push(schema['$ref'])
    }

    protected buildHttpFunction(httpschema, urlTemplate) {
        for (let method in httpschema) {
            const schema = httpschema[method]
            this.buildHttpMethodFunction(schema, urlTemplate, method)
        }
    }

    protected buildHttpMethodFunction(httpschema, urlTemplate, method) {
        const self = this
        const {operationId, parameters, requestBody, responses} = httpschema
        const paramSize = parameters.length + (!exists(requestBody) ? 0 : 1)
        this.userspace[operationId] = async (...args) => {
            if (args.length !== paramSize)
                throw new Error(`http parameters size : ${paramSize}, invoking args size : ${args.length}`)
            let uri = buildHttpUrl(urlTemplate, parameters, args)
            let req = !exists(requestBody) ? {} : args[args.length - 1]
            const resp = await http_send(method, uri, req, {})
            if (exists(responses, '200') && exists(responses['200']['content'], 'application/json'))
                return self.alignValue(responses['200']['content']['application/json']['schema'], resp.data)
            else
                return null
        }
    }

    protected walkAssignValue(_schema, _data = undefined) {
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
        _schema['_value'] = setStdValue(type, _data)
    }

}
