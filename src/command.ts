// use 'deno' as javascript runtime
import * as fs from 'node:fs'
import * as child_process from 'node:child_process'
import {exists} from "./ds-graph.ts";

class GitUser {
    constructor(readonly name: string, readonly mail: string) {
    }
    dump() {
        return {name: this.name, mail: this.mail}
    }
}

class GitCommit {
    id: string;
    idTree: string;
    idParent: string;
    author: GitUser;
    date: number;
    message: string;
    dump() {
        return {
            id: this.id,
            idTree: this.idTree,
            idParent: this.idParent,
            author: this.author.dump(),
            date: this.date,
            message: this.message
        }
    }
}


export function exec(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        child_process.exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error)
                return;
            }
            resolve(stdout)
            console.error(stderr)
        })
    })
}

export async function git_branch() {
    const message = await exec('git branch')
    const branch = {branches: [], currentBranch: null}
    message.split('\n').forEach(line => {
        let br = line.trim()
        if (br.length === 0) return
        if (br.startsWith('*')) {
            br = br.substring(1).trim()
            branch.currentBranch = br
        }
        branch.branches.push(br)
    })
    return branch
}


export async function git_branch_r() {
    const message = await exec('git branch -r')
    const lines = message.split('\n')
    const r = {}//new Map<string, Set<string>>()
    lines.forEach(line => {
        if (line.trim().length === 0)
            return
        if (line.indexOf('->') !== -1) {
            return
        }
        const arr = line.trim().split('/')
        if (!exists(r, arr[0]))
            r[arr[0]] = []
        r[arr[0]].push(arr[1])
        // if (!r.has(arr[0]))
        //     r.set(arr[0], new Set<string>())
        // r.get(arr[0]).add(arr[1])
    })
    return r
}

export async function git_info() {
    const br = await git_branch()
    return {
        "currentBranch": br.currentBranch,
        "localBranches": br.branches,
        "remoteRepositories": await git_branch_r(),
    }
}

export async function git_checkout(branch: string) {
    const message = await exec(`git checkout ${branch}`)
    return message.trim().toLowerCase().startsWith('switched to branch')
}

export async function git_log(): Promise<Array<GitCommit>> {
    const log = await exec(`git log --date=iso --pretty=format:%Creset+++%T%Creset+++%P%Creset+++%H%Creset+++%an%Creset+++%ae%Creset+++%ad%Creset+++%s`)
    if (!log.startsWith('+++')) {
        console.error('error git log : ', log)
        return []
    }
    return log.split('\n').map(line => {
        if (line.trim().length === 0)
            return
        const arr =  line.split('+++').slice(1)
        const commit = new GitCommit()
        commit.idTree = arr[0]
        commit.idParent = arr[1]
        commit.id = arr[2]
        commit.author = new GitUser(arr[3], arr[4])
        commit.date = Date.parse(arr[5]) // date: 2023-07-14T03:31:05.000Z,
        commit.message = arr[6]
        console.info(commit)
        return commit
    })
}



export async function git_status() {
    /*
M packages/widget-frontend-beta/src/widgets-base/element-ui.tsx
M packages/widget-frontend-core/package.json
M pub.js
     */
    const message = await exec('git status --short')
    const lines = message.split('\n').map(m => m.trim()).filter(m => m.length !== 0)
    return lines.map(line => ({flag: line[0], file: line.substring(1).trim()}))
}

export async function git_remote() {
    const message = await exec('git remote -v')
    const lines = message.split('\n').map(m => m.trim()).filter(m => m.length !== 0)
    const remotes = new Map<string, string>()
    lines.forEach(line => {
        const arr = line.split(/[ \t]/).filter(s => s !== '')
        remotes.set(arr[0], arr[1])
    })
    return remotes
}

export async function git_diff(path: string) {
    return await exec(`git diff ${path}`)
}


export async function git_stash() {
    // git stash -m "..."
    // git stash list
    // git stash pop
    // git stash push xxx_file
    // git stash apply stash@{0}
    // git stash show -p stash@{0}
}



class JFile {
    text: string = ''
    constructor(readonly path) {

    }
    append(text: string) {
        this.text += text + "\n"
        return this
    }
    print() {
        console.info(this.text)
    }
    flush() {
        fs.writeFileSync(this.path, this.text)
    }
}


new JFile('log.json')
    .append(JSON.stringify(await git_info()))
    // .append(JSON.stringify(await git_branch()))
    // .append(JSON.stringify(await git_branch_r()))
    // .append(JSON.stringify(await (async () => {
    //     await git_checkout('master')
    //     return (await git_log()).map(gc => gc.dump())
    // })()))
    .print()
    // .append(JSON.stringify(await (async () => {
    //     await git_checkout('qa')
    //     return (await git_log()).map(gc => gc.dump())
    // })()))
    // .flush()

// console.info(await git_branch())
// console.info(await git_branch_r())
// await git_checkout('master')
// console.info((await git_log().then()))
// await git_checkout('dev')
// console.info(await git_log())
// console.info(await git_remote())
// const status = await git_status()
// console.info(status)
// for (let every of status) {
//     if (every.flag === 'M') {
//         console.info('---\nmodify: ')
//         console.info(await git_diff(every.file))
//         console.info('---')
//     }
// }

export async function git_pull() {}
export async function git_push() {}
export async function git_fetch() {}
export async function git_merge() {}
