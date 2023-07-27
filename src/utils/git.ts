import {invoke} from "./rpc.ts";

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

    currentChanges: Array<FileChange> = [];

    private constructor() {}

    static async build() {
        const resp = await invoke('git_info')
        console.info(resp)
        const project = new GitProject()
        project.currentBranch = resp['currentBranch']
        project.localBranches = resp['localBranches']
        const rr = resp['remoteRepositories']
        project.remoteRepositories = Object.keys(rr).map(name => {
            const r = new GitRepository()
            r.name = name
            r.branches = rr[name]
            return r
        })
        return project
    }
}