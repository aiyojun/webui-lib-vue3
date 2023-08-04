// await fetch("").then(response => {response.blob().then(blob => {blob.stream().getReader().read().then(({done, value}) => {console.info(done, value)})})})

async function readStream(url) {
    const response = await fetch(url, {headers: {"Content-Type": "application/octet-stream"}})
    const stream = await response.body
    const reader = stream.getReader()
    const dc = new TextDecoder()
    while (true) {
        const r = await reader.read()
        console.info(r.done, dc.decode(r.value))
        if (r.done)
            break
    }
}


async function readStreamFile(url) {
    const response = await fetch(url, {headers: {"Content-Type": "application/octet-stream"}})
    const blob = await response.blob()
    blob.text()
    // const audio = document.createElement('audio')
    // response.body
    // new MediaSource();
    // URL.createObjectURL()
}