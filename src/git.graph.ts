import {exists} from "./utils/jlib.ts";

export class Node {
    prev: Array<Node> = [];
    post: Array<Node> = [];
    id: string;
    ref: any;

    constructor() {
        this.prev = []
        this.post = []
    }

    setRef(ref: any) {
        this.ref = ref
        return this
    }

    setId(id: string) {
        this.id = id
        return this
    }
}


export class SignalChannel {
    private channels: Array<boolean> = []
    private maxValue: number = -1

    clear() {
        this.channels = []
    }

    getMax() {
        return this.maxValue
    }

    apply() {
        for (let i = 0; i < this.channels.length; i++) {
            const occupied = this.channels[i]
            if (occupied) continue
            this.channels[i] = true
            return i
        }
        this.channels.push(true)
        this.maxValue = this.channels.length - 1
        // console.info(`signal channel expand : ${this.channels.length - 1}, channel: ${this.channels.toString()}`)
        return this.channels.length - 1
    }

    release(channelNumber: number, node: Node) {
        if (this.channels.length <= channelNumber) {
            printNode(node)
            throw new Error(`Error channel number : ${channelNumber}, channel : ${this.channels.toString()}`)
        }
        this.channels[channelNumber] = false
        // console.info(`release channel : ${channelNumber}`)
        return this
    }
}

export function transparent(c: string, opacity: number) {
    let color = c.toLowerCase().replaceAll(' ', '')
    let r = 0, g = 0, b = 0;
    if (/^#[0-9a-f]{6}/.test(color)) {
        r = parseInt(color.substring(1, 2), 16)
        g = parseInt(color.substring(3, 2), 16)
        b = parseInt(color.substring(5, 2), 16)
    } else if (/^rgb\([0-9]+(,[0-9]+){2}\)$/.test(color)) {
        const arr = color.substring(4, color.length - 1).split(',').filter(s => s !== '')
        r = parseInt(arr[0])
        g = parseInt(arr[1])
        b = parseInt(arr[2])
    } else if (/^rgba\([0-9]+(,[0-9]+){2}(,([0-9]*\.)?[0-9]+)\)$/.test(color)) {
        const arr = color.substring(5, color.length - 1).split(',').filter(s => s !== '')
        r = parseInt(arr[0])
        g = parseInt(arr[1])
        b = parseInt(arr[2])
    } else {
        throw new Error(`Unknown color string : ${c}`)
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export class UnreachableBranch extends Error {
}

export class UndefinedBranch extends Error {
}


export const preset = {
    colors: [
        'rgb(30,196,196)',
        'rgba(0,89,255,1)',
        'rgba(161,0,255,1)',
        'rgba(255,0,213,1)',
        'rgba(255,54,146,1)',
        'rgba(255,0,8,1)',
        'rgba(255,98,0,1)',
        'rgb(255,252,4)',
        'rgb(173, 255, 47)',
    ],
    rowGutter: 24,
    colGutter: 30,
    colStart: 120,
    strokeWidth: 1.8,
    lineRadius: 10,
    graphMinWidth: 200,
    headWidth: 80,
}

function printNode(n: Node) {
    // console.info(`node: ${n.id.substring(0, 12) + `[${getChan(n)}]`}; prev: ${n.prev.map(p => p.id.substring(0, 6) + `[${getChan(p)}]`).join(' ')}; post: ${n.post.map(p => p.id.substring(0, 6) + `[${getChan(p)}]`).join(' ')}; `)
}

const ch2x = (ch: number) => preset.colStart + ch * preset.colGutter
const colorNode = (node: Node) => preset.colors[getChan(node) % preset.colors.length]
const setChan = (node: Node, ch: number) => {
    node.ref['channel'] = ch
}
const getChan = (node: Node) => node.ref['channel']
const unsetChan = (_node: Node) => {delete _node.ref['channel']}
const hasChan = (node: Node) => exists(node.ref, 'channel')
const getRank = (node: Node, refs: Array<Node>) => {
    for (let i = 0; i < refs.length; i++) {
        if (refs[i].id === node.id) {
            return i
        }
    }
    throw new UnreachableBranch()
}
function path2d(pb, pe) {
    const r = preset.lineRadius
    if (pb.x === pe.x) {
        return `M${pb.x} ${pb.y} L${pe.x} ${pe.y}`
    } else if (pb.x < pe.x) {
        return `M${pb.x} ${pb.y} L${pe.x - r} ${pb.y} A${r} ${r} 0 0 0 ${pe.x} ${pb.y - r} L${pe.x} ${pe.y}`
    } else {
        return `M${pb.x} ${pb.y} L${pe.x + r} ${pb.y} A${r} ${r} 0 0 1 ${pe.x} ${pb.y - r} L${pe.x} ${pe.y}`
    }
}

function path2d_merge(pb, pe) {
    const r = preset.lineRadius
    if (pb.x === pe.x) {
        return `M${pb.x} ${pb.y} L${pe.x} ${pe.y}`
    } else if (pb.x < pe.x) {
        return `M${pb.x} ${pb.y} L${pb.x} ${pe.y + r} A${r} ${r} 0 0 1 ${pb.x + r} ${pe.y} L${pe.x} ${pe.y}`
    } else {
        return `M${pb.x} ${pb.y} L${pb.x} ${pe.y + r} A${r} ${r} 0 0 0 ${pb.x - r} ${pe.y} L${pe.x} ${pe.y}`
    }
}

export class Path2d {
    d: string;
    stroke: string = '#fff';
    strokeWidth: number = 2.4;
    channel: number = 0;

    private constructor() {
        this.strokeWidth = preset.strokeWidth
    }

    static build(d: string) {
        const path = new Path2d()
        path.d = d
        return path
    }
    setStroke(stroke: string) {
        this.stroke = stroke;
        return this
    }
    setChannel(channel: number) {
        this.channel = channel
        return this
    }
}

export class Node2d {
    id: string;
    x: number;
    y: number;
    type: string;
    message: string;
    fill: string;

    private constructor() {
    }

    static build(x: number, y: number, id: string) {
        const r = new Node2d()
        r.id=id;
        r.x = x;
        r.y = y;
        return r
    }

    setType(type: string) {
        this.type = type
        return this
    }

    setMessage(message: string) {
        this.message = message
        return this
    }

    setFill(fill: string) {
        this.fill = fill
        return this
    }
}


export class Graph {
    private cache: Map<string, Node> = new Map();
    private signalChannel: SignalChannel = new SignalChannel();
    private paths: Array<Path2d> = [];
    private nodes: Array<Node2d> = [];

    clear() {
        this.cache.clear()
        this.signalChannel.clear()
        this.paths = []
        this.nodes = []
    }

    getOrigin(id: string) {
        return this.cache.get(id).ref
    }

    getTextStart() {
        return Math.max(ch2x(this.signalChannel.getMax() + 1), preset.graphMinWidth)
    }

    getGraphStart() {
        return preset.colStart
    }

    getPaths() {
        return this.paths
    }

    getNodes() {
        return this.nodes
    }

    preload(node: Node) {
        this.cache.set(node.id, node)
        return this
    }

    add(idsPrev: Array<string>, node: Node) {
        for (let i = 0; i < idsPrev.length; i++) {
            const idPrev = idsPrev[i]
            if (!this.cache.has(idPrev))
                throw new Error(`No such prev node : ${idPrev}`)
            const parent = this.cache.get(idPrev)
            parent.post.push(node)
            node.prev.push(parent)
        }
        // this.cache.set(node.id, node)
        return this
    }

    build() {
        const self = this
        // console.info(`graph build ...`)

        Array.from(this.cache.values())
            .sort((a, b) => (a.ref['date'] - b.ref['date']))
            .forEach((node, i) => {unsetChan(node);node.ref['i'] = i})

        const fnRecycle = (node: Node) => {
            const postRefs: Array<Node> = node.post
            for (let i = 0; i < postRefs.length; i++) {
                const postRef = postRefs[i]
                if (postRef.prev.length === 1 && getChan(postRef) !== getChan(node))
                    this.signalChannel.release(getChan(postRef), postRef)
                if (postRef.prev.length === 2 && getChan(postRef) !== getChan(postRef.prev[0]) && getChan(postRef) !== getChan(postRef.prev[1]))
                    this.signalChannel.release(getChan(postRef), postRef)
            }
        }

        const findExtAndSet = (node: Node) => {
            if (hasChan(node)) return
            const postRefs: Array<Node> = node.post
            let hasExt = false
            for (let i = 0; i < postRefs.length; i++) {
                const postRef = postRefs[i]
                if (postRef.prev.length === 1) {
                    setChan(node, getChan(postRef))
                    hasExt = true
                    break
                }
            }
            if (!hasExt)
                setChan(node, self.signalChannel.apply())
        }

        const fnNegative = (node: Node) => {
            // Todo:
            //  这边遵循的原则是：
            //  1. 优先设置最后的断点
            //  2. 然后到哪个点，就设置他的前置节点
            if (node.post.length === 0)
                setChan(node, self.signalChannel.apply())
            const refs = node.prev
            if (hasChan(node) && refs.length > 0) {
                const ch = getChan(node)
                /**
                 * release channel here!
                 */
                fnRecycle(node)

                if (!hasChan(refs[0]))
                    setChan(refs[0], ch)
                // if (refs.length === 2 && refs[1].post.length === 1)
                //     setChan(refs[1], self.signalChannel.apply())
                if (refs.length > 1) {
                    for (let i = 1; i < refs.length; i++) {
                        findExtAndSet(refs[i])
                    }
                }
            }
        }

        const fnPath2d = (node: Node) => {
            if (node.prev.length === 1) {
                this.paths.push(this.processNode(node.prev[0], node)
                    .setChannel(getChan(node))
                    .setStroke(colorNode(node)))
            } else if (node.prev.length > 1) {
                this.paths = [...this.paths, ...this.processMergeNode(node.prev, node)]
            }
        }

        const fnNode2d = (node: Node) => {
            this.nodes.push(
                Node2d.build(ch2x(getChan(node)), this.row2y(node.ref['i']), node.id)
                    .setMessage(node.ref['message'])
                    .setType(node.prev.length > 1 ? 'merge' : 'normal')
                    .setFill(colorNode(node))
            )
        }

        let seq = Array.from(this.cache.values()).sort((a, b) => (a.ref['date'] - b.ref['date'])).reverse()
        for (let i = 0; i < seq.length; i++) {
            const node = seq[i]
            fnNegative(node)
            fnPath2d(node)
            fnNode2d(node)
        }
        return this
    }

    check() {
        Array.from(this.cache.values()).forEach(n => {
            // console.info(`node channel : ${getChan(n)}; node: ${n.id.substring(0, 12)}; prev: ${n.prev.map(p => p.id.substring(0, 6)).join(' ')}; post: ${n.post.map(p => p.id.substring(0, 6)).join(' ')}; `)
        })
        return this
    }

    private row2y(i: number) {
        return this.cache.size * preset.rowGutter - i * preset.rowGutter + preset.rowGutter * .5
    }

    getHeight() {
        return (this.cache.size + 1) * preset.rowGutter
    }


    private processNode(start: Node, end: Node, isMerge = false): Path2d {
        const pb = {x: ch2x(getChan(start)), y: this.row2y(start.ref['i'])}
        const pe = {x: ch2x(getChan(end)), y: this.row2y(end.ref['i'])}
        return Path2d.build(isMerge ? path2d_merge(pb, pe) : path2d(pb, pe))
    }

    private processMergeNode(prev: Array<Node>, end: Node): Array<Path2d> {
        const che = getChan(end)
        const ch0 = getChan(prev[0])
        const ch1 = getChan(prev[1])
        const rs = []
        if ((che < ch0 && che < ch1) || (che > ch0 && che > ch1)) {
            if (prev.length > 2)
                throw new UndefinedBranch()
            const pe  = {x: ch2x(che), y: this.row2y(end.ref['i'])}
            const pb0 = {x: ch2x(ch0), y: this.row2y(prev[0].ref['i'])}
            const pb1 = {x: ch2x(ch1), y: this.row2y(prev[1].ref['i'])}
            rs.push(Path2d.build(path2d(pb0, pe)).setChannel(che).setStroke(colorNode(end)))
            rs.push(Path2d.build(path2d_merge(pb1, pe)).setChannel(ch1).setStroke(colorNode(prev[1])))
        } else if (ch0 < che && che < ch1) {
            if (prev.length > 2)
                throw new UndefinedBranch()
            const pe  = {x: ch2x(che), y: this.row2y(end.ref['i'])}
            const pb0 = {x: ch2x(ch0), y: this.row2y(prev[0].ref['i'])}
            const pb1 = {x: ch2x(ch1), y: this.row2y(prev[1].ref['i'])}
            rs.push(Path2d.build(path2d_merge(pb0, pe)).setChannel(ch1).setStroke(colorNode(prev[0])))
            rs.push(Path2d.build(path2d(pb1, pe)).setChannel(che).setStroke(colorNode(end)))
        } else if (ch1 < che && che < ch0) {
            if (prev.length > 2)
                throw new UndefinedBranch()
            const pe  = {x: ch2x(che), y: this.row2y(end.ref['i'])}
            const pb0 = {x: ch2x(ch0), y: this.row2y(prev[0].ref['i'])}
            const pb1 = {x: ch2x(ch1), y: this.row2y(prev[1].ref['i'])}
            rs.push(Path2d.build(path2d_merge(pb1, pe)).setChannel(ch1).setStroke(colorNode(prev[1])))
            rs.push(Path2d.build(path2d(pb0, pe)).setChannel(che).setStroke(colorNode(end)))
        } else {
            for (let i = 0; i < prev.length; i++) {
                rs.push(this.processNode(prev[i], end, true)
                    .setChannel(getChan(prev[i]))
                    .setStroke(colorNode(prev[i])))
            }
        }
        return rs
    }
}
