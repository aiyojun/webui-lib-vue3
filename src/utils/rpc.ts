import axios, {AxiosStatic} from "axios";
import {exists} from "./jlib.ts";

interface FakeAxios {
    get: (url: string) => Promise<any>;
    post: (url: string, data: any) => Promise<any>;
    delete: (url: string) => Promise<any>;
}

export async function invoke(method: string, args: Array<any> = []): Promise<any> {
    console.info("-- window['rpc'] :", window['rpc'])
    if (exists(window, 'rpc')) {
        const r = await window['rpc'].invoke(method, args)
        console.info(`[rpc] run : ${method}; return : `, r)
        return r
    }
    let axios_ : FakeAxios | AxiosStatic = axios
    if (exists(window, 'fakeAxios'))
        axios_ = window['fakeAxios'] as FakeAxios
    return axios_?.post('/rpc', {method, args}).then(resp => resp.data)
}

