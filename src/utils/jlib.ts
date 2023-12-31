import * as CryptoJS from "crypto-js";

export function exists(o: any, k?: string) {
    if (k === undefined)
        return o !== undefined && o !== null
    return typeof o === 'object' && o !== null
        && !(o instanceof Array) && Object.keys(o).includes(k)
        && o[k] !== undefined && o[k] !== null
}

export function clone(o: any) {
    return JSON.parse(JSON.stringify(o))
}

export function hash(o: any) {
    return CryptoJS.MD5(JSON.stringify(o)).toString()
}

export function dirname(path) {
    path = path.replaceAll('\\', '/')
    const arr = path.split('/').filter((s, i) => i === 0 || s !== '')
    return arr.slice(0, arr.length - 1).join('/')
}

export function basename(path) {
    path = path.replaceAll('\\', '/')
    const arr = path.split('/').filter((s, i) => i === 0 || s !== '')
    return arr.pop()
}

export function kvexchange(o: object) {
    return Object.entries(o).reduce((prev, e) => ({...prev, [e[1]]: e[0]}), {})
}