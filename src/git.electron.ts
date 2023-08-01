import {
    git_add,
    git_checkout,
    git_commit,
    git_ignore,
    git_info, git_pull, git_push,
    git_reset,
    git_show,
    git_unstage
} from "./git.runtime.ts";

const rpcHandles = [
    {id: 'git_info', hd: async (...args) => await git_info()},
    {id: 'git_checkout', hd: async (...args) => await git_checkout(args[0])},
    {id: 'git_ignore', hd: async (...args) => await git_ignore(args[0])},
    {id: 'git_add', hd: async (...args) => await git_add(args[0])},
    {id: 'git_unstage', hd: async (...args) => await git_unstage(args[0])},
    {id: 'git_reset', hd: async (...args) => await git_reset()},
    {id: 'git_show', hd: async (...args) => await git_show(args[0])},
    {id: 'git_commit', hd: async (...args) => await git_commit(args[0])},
    {id: 'git_push', hd: async (...args) => await git_push()},
    {id: 'git_pull', hd: async (...args) => await git_pull()},
]
