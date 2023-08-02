export function notify(d: Record<string, any>) {
    const container = (s: string) => `<div class="theme-dark" style="animation: bounceInRight .8s; position: fixed; z-index: 1000; top: 3rem; right: 1rem; border-radius: 6px; box-sizing: border-box; padding: .5rem .75rem; font-family: Inter, 'Microsoft YaHei', sans-serif; font-size: .75rem;">${s}</div>`
    document.body.insertAdjacentHTML('beforeend', container(d.message))
    const el = document.body.lastElementChild as HTMLDivElement
    setTimeout(() => {
        el.style.animation = 'bounceOutRight .8s'
        setTimeout(() => el.remove(), 750)
    }, 5000)
}