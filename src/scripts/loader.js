(async () => {
    const hostname = window.location.hostname;

    if (hostname === 'act.hoyolab.com') {
        await import(chrome.runtime.getURL('src/scripts/content/hoyolab-genshin.js'));
    }
    else if (hostname === 'frzyc.github.io') {
        await import(chrome.runtime.getURL('src/scripts/content/genshin-optimizer.js'));
    }
})();