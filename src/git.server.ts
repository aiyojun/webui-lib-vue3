import express, {Express} from "express"
import {
    git_checkout,
    git_info,
    git_show,
    git_add,
    git_unstage,
    git_reset,
    git_commit,
    git_pull,
    git_push, git_ignore
} from "./git.runtime.ts"

const app: Express = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.post('/rpc', async (request, response) => {
    const method: string = request.body.method
    const args: Array<any> = request.body.args

    for (let i = 0; i < rpcHandles.length; i++) {
        if (method === rpcHandles[i].id) {
            try {
                response.send(await (rpcHandles[i].hd(...args)))
            } catch (e) {
                console.error(e)
                response.send({error: e.toString()})
            }
        }
    }

    response.send({success: true})
})


app.listen(8080)
