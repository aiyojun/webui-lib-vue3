// use 'deno' as javascript runtime
import * as fs from 'node:fs'
import * as path from "node:path";
import * as process from "node:process";
import * as child_process from 'node:child_process'
import {exists} from "./utils/jlib.ts";
import {GitChange, GitCommit, GitUser} from "./git.generic.ts";
import {dialog, shell} from "electron"

export function exec(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        child_process.exec(cmd,
            (error, stdout, stderr) => {
                if (error) {reject(error);return;}
                resolve(stdout);console.error(stderr)})
    })
}

export function execi(cmd: string, matches: Array<{question: string, answer: string}> = []): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const child = child_process.exec(cmd)
        const err = {value: ''}
        child.stderr.on('data', (data) => {err.value += data + '\n'})
        child.stdout.on('data', (data) => {
            for (let i = 0; i < matches.length; i++) {
                const match = matches[i]
                if (data.toLowerCase().indexOf(match.question) !== -1) {
                    child.stdin.write(`${match.answer}\n`, 'utf-8')
                    break
                }
            }
        })
        child.on('exit', (code) => {
            code !== 0 ? reject(err.value) : resolve(true)
        })
    })
}

export async function git_open_repo(): Promise<Array<string>> {
    return ((await dialog.showOpenDialog({
        title: "GitGuard",
        properties: ['openDirectory']
    })) || {filePaths: []})['filePaths']
    // // Just for test
    // return ["C:\\jqs\\dataflow"]
}

export function git_open_external(url: string) {
    return shell.openExternal(url)
}

export function git_enter_repo(path) {
    process.chdir(path)
    return process.cwd() === path
}

export async function getBranches() {
    const branch = {branches: [], currentBranch: null};
    (await exec('git branch'))
        .split('\n')
        .filter(s => s.trim() !== '')
        .forEach(line => {
            let br = line.trim()
            if (line.startsWith('*')) {
                br = line.substring(1).trim()
                branch.currentBranch = br
            }
            branch.branches.push(br)
        })
    return branch
}

export async function getFinalCommits() {
    return (await exec('git branch -avv --format="%(refname:short) %(objectname)"'))
        .split('\n')
        .filter(s => s.trim() !== '')
        .map(line => line.split(' '))
        .filter(arr => arr.length === 2)
        .reduce((prev, c) =>
            ({...prev, [c[0]]: c[1]}), {})
}

/**
 * @deprecated
 */
export async function getBranches_r() {
    const message = await exec('git branch -r')
    const lines = message.split('\n')
    const r = {}
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
    })
    return r
}

export function enter(dir: string) {
    process.chdir(dir)
}

export async function git_info() {
    // Just for test
    // enter('C:\\gitlab\\widget-frontend')

    const br = await getBranches()
    const diffs = await git_diff()
    const diffsMap = new Map<string, GitChange>()
    diffs.forEach(df => diffsMap.set(df.file, df))
    const changes = await git_status_v2()
    changes.forEach(df => {
        if (diffsMap.has(df.file))
            df.places = diffsMap.get(df.file).places
    })
    const upstreams = git_parse_config().upstreams
    return {
        "name": path.basename(process.cwd()),
        "currentBranch": br.currentBranch,
        "upstreams": upstreams,
        "localBranches": br.branches,
        "remoteRepositories": await getBranches_r(),
        "history": await git_log(),
        "track": await git_log('--all'),
        "changes": changes,
        "heads": await getFinalCommits(),
    }
}

export async function git_checkout(branch: string) {
    const message = await exec(`git checkout ${branch}`)
    return message.trim().toLowerCase().startsWith('switched to branch')
}

export async function git_add(filepath: string) {
    try {
        const message = await exec(`git add ${filepath}`)
        return true
    } catch (e) {
        return false
    }
}

export async function git_unstage(filepath: string) {
    try {
        const message = await exec(`git restore --staged ${filepath}`)
        return true
    } catch (e) {
        return false
    }
}

export async function git_commit(msg: string) {
    try {
        const message = await exec(`git commit -m ${msg}`)
        return true
    } catch (e) {
        return false
    }
}

export async function git_push(remote: string = '', branch: string = '') {

    return await execi(
        remote !== '' && branch !== '' ? `git push --set-upstream ${remote} ${branch}` : "git push",
        [
            {question: 'username', answer: globalConfig.ref['user']['name']},
            {question: 'password', answer: globalConfig.ref['user']['password']},
            {question: 'mail', answer: globalConfig.ref['user']['mail']},
        ])
}

const globalConfig = {ref: null}

export async function git_pull(remote: string = '', branch: string = '') {
    return await execi(remote !== '' && branch !== '' ? `git pull --set-upstream ${remote} ${branch}` : "git pull",
        [
            {question: 'username', answer: globalConfig.ref['user']['name']},
            {question: 'password', answer: globalConfig.ref['user']['password']},
            {question: 'mail', answer: globalConfig.ref['user']['mail']},
        ])
}

export async function git_reset() {
    try {
        const message = await exec(`git reset`)
        return true
    } catch (e) {
        return false
    }
}

/**
 * @deprecated use git_config_list as replacement
 */
export function git_parse_config() {
    const r = {upstreams: {},}
    const configs = fs.readFileSync(path.join('.git', 'config')).toString()
        .split('\n[').map((s, i) => i === 0 ? s : ('[' + s))
    configs.forEach(config => {
        const lines = config.split('\n')
        const head = lines[0]
        const brCfg = {}
        for (let i = 1; i < lines.length; i++) {
            const kv = lines[i].split('=').map(s => s.trim())
            brCfg[kv[0]] = kv[1]
        }
        if (head.startsWith('[branch') && exists(brCfg, 'remote') && exists(brCfg, 'merge')) {
            const localBranch = head.substring(9, head.length - 2)
            r.upstreams[localBranch] = {remote: brCfg['remote'], branch: brCfg['merge'].split('/').pop()}
        }
    })
    return r
}

export async function git_log(options: string=''): Promise<Array<GitCommit>> {
    const log = await exec(`git log ${options} --date=iso --pretty=format:%Creset+++%T%Creset+++%P%Creset+++%H%Creset+++%an%Creset+++%ae%Creset+++%ad%Creset+++%s`)
    if (!log.startsWith('+++')) {
        // console.error('error git log : ', log)
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
        // console.info(commit)
        return commit
    })
}

export async function git_show(id: string) {
    const message = await exec(`git show ${id}`)
    let i = 0; let count = 0;
    const diffs = []
    while (i < message.length) {
        const p0 = message.substring(i).indexOf('\ndiff ')
        const p1 = message.substring(i + p0 + 1).indexOf('\ndiff ')
        if (p0 === -1) break
        const text = ((p1 === -1) ? message.substring(i + p0 + 1) : message.substring(i + p0 + 1, i + p0 + 1 + p1));
        diffs.push(text)
        i = ((p1 === -1) ? message.length : (i + p0 + 1 + p1))
    }
    return diffs.map(d => GitChange.parse(d))
}


/**
 * @deprecated use git_status_v2 as replacement
 */
export async function git_status() {
    /*
M packages/widget-frontend-beta/src/widgets-base/element-ui.tsx
M packages/widget-frontend-core/package.json
M pub.js
     */
    const message = await exec('git status --short')
    const lines = message.split('\n')
        .map(m => m.trim())
        .filter(m => m.length !== 0)
    return lines.map(line => (new GitChange(line[0], line.substring(1).trim())))
}

/**
 * @deprecated useless
 */
function searchUntil(_lines: Array<string>, _i: number, _option: string, _arr: Array<string>) {
    let intercept = false
    for (let j = _i; j < _lines.length; j++) {
        if (_lines[j].toLowerCase().startsWith(_option)) {
            intercept = true
            continue
        }
        if (intercept) {
            if (_lines[j].trim().startsWith('(use')) continue
            if (_lines[j].trim() === '') return j + 1
            _arr.push(_lines[j])
        }
    }
    return _lines.length
}

export async function git_status_v2(): Promise<Array<GitChange>> {
    const message = await exec('git status')
    const lines = message.split('\n')

    const status = {
        staged: [],
        unstaged: [],
        untracked: [],
    }
    function dumpTo(_lines: Array<string>, _i: number, _option: string, _arr: Array<string>) {
        let intercept = false
        for (let j = _i; j < _lines.length; j++) {
            if (_lines[j].toLowerCase().startsWith(_option)) {
                intercept = true
                continue
            }
            if (intercept) {
                if (_lines[j].trim().startsWith('(use')) continue
                if (_lines[j].trim() === '') return true // j + 1
                _arr.push(_lines[j])
            }
        }
        return false // _lines.length
    }
    if (dumpTo(lines, 0, 'changes to be committed:', status.staged)) {
        status.staged = status.staged.map(s => {
            const pi = s.indexOf(':')
            return new GitChange(s.substring(0, pi).trim(), s.substring(pi + 1).trim()).setStaged(true).dump()
        })
    }
    if (dumpTo(lines, 0, 'changes not staged for commit:', status.unstaged)) {
        status.unstaged = status.unstaged.map(s => {
            const pi = s.indexOf(':')
            return new GitChange(s.substring(0, pi).trim(), s.substring(pi + 1).trim()).setStaged(false).dump()
        })
    }
    if (dumpTo(lines, 0, 'untracked files:', status.untracked)) {
        status.untracked = status.untracked.map(s => {
            return new GitChange('new file', s.trim()).setStaged(false).dump()
        })
    }
    return [...status.staged, ...status.unstaged, ...status.untracked]
}

/**
 * @deprecated use git_config_list as replacement
 */
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

/**
 * Obtain current changing states of all files
 */
export async function git_diff(path?: string) {
    return GitChange.parseDiffs(await exec(`git diff ${path || ''}`))
}


/**
 * Todo: stash implementation
 */
export async function git_stash() {
    // git stash -m "..."
    // git stash list
    // git stash pop
    // git stash push xxx_file
    // git stash apply stash@{0}
    // git stash show -p stash@{0}
}


// whether we need?
export async function git_fetch() {}
export async function git_merge() {}

export async function git_ignore(filepath) {
    const fd = fs.openSync('.gitignore', 'a+')
    fs.appendFileSync(fd, filepath, 'utf8')
    fs.closeSync(fd)
}

export async function git_recent() {
    const cfg = await git_config_list()
    let repos = []
    if (exists(cfg, 'magic') && exists(cfg['magic'], 'recentrepo')) {
        const x = cfg['magic']['recentrepo']
        repos = (x instanceof Array ? x : [x])
    }
    if (exists(cfg, 'gui') && exists(cfg['gui'], 'recentrepo')) {
        const x = cfg['gui']['recentrepo']
        repos = (x instanceof Array ? x : [x])
    }
    if (repos.length > 8)
        repos = repos.slice(0, 8)
    return repos
}

export async function git_config_list() {
    const message = await exec(`git config --list`)
    const cfg = {}
    const setDefault = (_o, _k, _v) => {
        if (!exists(_o, _k))
            _o[_k] = _v
        else if (_o[_k] instanceof Array)
            _o[_k] = [..._o[_k], _v]
        else
            _o[_k] = [_o[_k], _v]
    }
    const set = (_key, _value) => {
        const chain = _key.split('.')
        let k = 0
        let o = cfg
        while (k < chain.length) {
            if (k === chain.length - 1) {
                setDefault(o, chain[k], _value)
                break
            }
            if (!exists(o, chain[k]))
                o[chain[k]] = {}
            o = o[chain[k]]
            k++
        }
    }
    message.split('\n').map(s => s.trim()).filter(s => s !== '').forEach(line => {
        let eqi = line.indexOf('=')
        const key = line.substring(0, eqi)
        const value = line.substring(eqi + 1)
        set(key, value)
    })
    globalConfig.ref = cfg
    return cfg
}

export async function invoke(method: string, args: Array<any>) {
    const rpcHandles = [
        {id: 'git_info', hd: async (...args) => await git_info()},
        {id: 'git_checkout', hd: async (...args) => await git_checkout(args[0])},
        {id: 'git_ignore', hd: async (...args) => await git_ignore(args[0])},
        {id: 'git_add', hd: async (...args) => await git_add(args[0])},
        {id: 'git_unstage', hd: async (...args) => await git_unstage(args[0])},
        {id: 'git_reset', hd: async (...args) => await git_reset()},
        {id: 'git_show', hd: async (...args) => await git_show(args[0])},
        {id: 'git_commit', hd: async (...args) => await git_commit(args[0])},
        {id: 'git_push', hd: async (...args) => await git_push(...args)},
        {id: 'git_pull', hd: async (...args) => await git_pull(...args)},
        {id: 'git_open_repo', hd: async (...args) => await git_open_repo()},
        {id: 'git_enter_repo', hd: async (...args) => git_enter_repo(args[0])},
        {id: 'git_open_external', hd: (...args) => git_open_external(args[0])},
        {id: 'git_recent', hd: async (...args) => git_recent()},
    ]
    for (let i = 0; i < rpcHandles.length; i++) {
        if (method === rpcHandles[i].id) {
            console.info(`[gitx] run : ${method}`)
            try {
                return await (rpcHandles[i].hd(...args))
            } catch (e) {
                console.error(e)
                return {error: e.toString()}
            }
        }
    }
    return {error: `No such method : ${method}`}
}
