import express, {Express} from "express"
import {invoke} from "./git.runtime.ts"

const app: Express = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/rpc', async (request, response) => {
    const method: string = request.body.method
    const args: Array<any> = request.body.args

    try {
        response.send(await (invoke(method, args)))
        return
    } catch (e) {
        console.error(e)
        response.send({error: e.toString()})
        return
    }
    // response.send({success: true})
})


app.listen(8080)
