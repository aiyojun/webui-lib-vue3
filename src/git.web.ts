import {invoke} from "./utils/rpc.ts";
import {GitChange, GitCommit} from "./git.generic.ts";

export class GitRepository {
    name: string;
    branches: Array<string> = [];
}

export class FileChange {
    filepath: string;
    changeType: string;
    staged: boolean;
}

export class GitProject {
    name: string;
    currentBranch: string;
    localBranches: Array<string> = [];
    remoteRepositories: Array<GitRepository> = [];
    tags: Array<string> = [];
    history: Array<GitCommit> = [];
    changes: Array<GitChange> = [];

    currentChanges: Array<FileChange> = [];

    getCommit(id: string) {
        for (let i = 0; i < this.history.length; i++) {
            if (this.history[i].id === id)
                return this.history[i]
        }
        return null
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
        await invoke('git_pull')
    }
    async push() {
        await invoke('git_push')
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
        project.history = resp['history'].map(his => GitCommit.build(his))
        project.changes = resp['changes'].map(chg => new GitChange(chg['flag'], chg['file']).setStaged(chg['staged']).setPlaces(chg['places']))
        return this
    }

    static async build() {
        return new GitProject().init()
    }
}