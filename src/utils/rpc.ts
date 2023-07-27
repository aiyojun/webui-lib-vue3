import axios from "axios";

export async function invoke(method: string, args: Array<any> = []): Promise<any> {
    return axios.post('/rpc', {method, args}).then(resp => resp.data)
}

