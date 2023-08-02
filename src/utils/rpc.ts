import axios, {AxiosStatic} from "axios";
import {exists} from "./jlib.ts";
import {notify} from "./libxdom.ts";

interface FakeAxios {
    get: (url: string) => Promise<any>;
    post: (url: string, data: any) => Promise<any>;
    delete: (url: string) => Promise<any>;
}

export async function invoke(method: string, args: Array<any> = []): Promise<any> {
    if (exists(window, 'rpc')) {
        const r = await window['rpc'].invoke(method, args)
        console.info(`[RPC] ::${method}\n  -- args :`, args, ` \n  -- return :`, r)
        if (exists(r, 'error')) {
            notify({title: 'Git', message: r['error']})
        }
        return r
    }
    let axios_ : FakeAxios | AxiosStatic = axios
    if (exists(window, 'fakeAxios'))
        axios_ = window['fakeAxios'] as FakeAxios
    return axios_?.post('/rpc', {method, args}).then(resp => resp.data)
}

