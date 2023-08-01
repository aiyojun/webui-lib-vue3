import * as fs from "node:fs"
import * as path from "node:path"

import {dialog} from "electron"





export function readDirectories(basedir: string) {
    return fs.readdirSync(basedir).map(file => path.join(basedir, file))
}



// let ss = ''
// ss += readDirectories("/").join("\n")
// console.info(ss)




const filepath = await dialog.showOpenDialog({
    title: "haha",
    properties: ['openDirectory']
})
console.info(filepath)



