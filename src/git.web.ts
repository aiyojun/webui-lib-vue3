import {invoke} from "./utils/rpc.ts";
import {GitChange, GitCommit} from "./git.generic.ts";
import {exists} from "./utils/jlib.ts";
import {notify} from "./utils/libxdom.ts";

export class GitRepository {
    name: string;
    branches: Array<string> = [];
}

export class FileChange {
    filepath: string;
    changeType: string;
    staged: boolean;
}

export interface IGitUpstream {
    remote: string;
    branch: string;
}

export class GitProject {
    name: string;
    currentBranch: string;
    localBranches: Array<string> = [];
    upstreams: Record<string, IGitUpstream> = {};
    remoteRepositories: Array<GitRepository> = [];
    tags: Array<string> = [];
    history: Array<GitCommit> = [];
    track: Array<GitCommit> = [];
    changes: Array<GitChange> = [];

    currentChanges: Array<FileChange> = [];

    getCommit(id: string) {
        for (let i = 0; i < this.track.length; i++) {
            if (this.track[i].id === id)
                return this.track[i]
        }
        return null
    }

    static jump(url: string) {
        invoke('git_open_external', [url])
    }

    static async openAndEnter() {
        const path = (await invoke('git_open_repo'))[0]
        console.info("open : ", path)
        if (!(await invoke('git_enter_repo', [path]))) {
            notify({message: `Enter repo [${path}] failed!`})
        }
    }

    static async enter(path: string) {
        if (!(await invoke('git_enter_repo', [path]))) {
            notify({message: `Enter repo [${path}] failed!`})
        }
    }

    static async getRecent(): Promise<Array<string>> {
        return await invoke('git_recent')
    }

    async ignore(filepath: string) {
        const resp = await invoke('git_ignore', [filepath])
        if (resp) {
            let index = -1
            for (let i = 0; i < this.changes.length; i++) {
                if (this.changes[i].file === filepath) {
                    index = i
                    break
                }
            }
            if (index > -1)
                this.changes.splice(index, 1)
        }
    }

    async stage(filepath: string) {
        const resp = await invoke('git_add', [filepath])
        if (resp) {
            this.changes.filter(x => {
                if (x.file === filepath)
                    x.staged = true
                return false
            })
        }
    }

    async pull() {
        if (exists(this.upstreams, this.currentBranch))
            await invoke('git_pull')
        else
            console.info(`... git pull --set-upstream remote branch`)
    }
    async push() {
        if (exists(this.upstreams, this.currentBranch))
            await invoke('git_push')
        else
            console.info(`... git push --set-upstream remote branch`)
    }

    async commit(message: string) {
        const resp = await invoke('git_commit', [message])
    }

    async unstage(filepath: string) {
        const resp = await invoke('git_unstage', [filepath])
        if (resp) {
            this.changes.filter(x => {
                if (x.file === filepath)
                    x.staged = false
                return false
            })
        }
    }

    async reset() {
        const resp = await invoke('git_reset')
        if (resp)
            this.changes.forEach(x => x.staged = false)
    }

    private constructor() {}

    async checkout(br: string) {
        if (br === this.currentBranch) return this
        const resp = await invoke('git_checkout', [br])
        console.info(resp)
        return await this.init();
    }

    async showCommit(id: string) {
        const resp = await invoke('git_show', [id])
        console.info(`show commit : ${id}`)
        console.info(resp)
        return resp;
    }

    async init() {
        const project = this
        const resp = await invoke('git_info')
        // console.info(resp)
        project.name = resp['name']
        project.currentBranch = resp['currentBranch']
        project.localBranches = resp['localBranches']
        const rr = resp['remoteRepositories']
        project.remoteRepositories = Object.keys(rr).map(name => {
            const r = new GitRepository()
            r.name = name
            r.branches = rr[name]
            return r
        })
        project.track = resp['track'].map(his => GitCommit.build(his))
        project.history = resp['history'].map(his => GitCommit.build(his))
        project.changes = resp['changes'].map(chg => new GitChange(chg['flag'], chg['file'])
            .setStaged(chg['staged']).setPlaces(chg['places']))
        project.upstreams = resp['upstreams']
        return this
    }

    static async build() {
        return new GitProject().init()
    }
}