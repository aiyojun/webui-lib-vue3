import express, {Express} from "express"
import {git_info} from "./command.ts"

const app: Express = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const rpcHandles = [
    {id: 'git_info', hd: async (...args) => await git_info()},
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
