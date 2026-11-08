let BASE_URL = "https://huangguoai.com";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (error) {
}

function normalizeUrl(url) {
    return String(url || "").replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
}

function absUrl(url) {
    url = String(url || "").replace(/^\s+|\s+$/g, "");
    if (!url) return "";
    if (url.indexOf("data:") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("http") === 0) return url;
    if (url.charAt(0) !== "/") url = "/" + url;
    return BASE_URL + url;
}

// The CDN stores covers AES-encrypted, so the app cannot decode them. Returning
// those URLs only makes it download files that fail; drop them and let the app
// draw its own placeholder.
let ENCRYPTED_COVER_HOSTS = ["pic.drleao.cn", "new.drleao.cn", "new2.drleao.cn", "image.drleao.cn", "pic.aluxvl.cn"];

function imgUrl(url) {
    url = absUrl(url);
    if (!url) return "";
    if (url.indexOf("data:") === 0) return url;
    // CDN paths carry a short-lived auth_key that the origin does not require.
    url = url.replace(/\?.*$/, "");
    let host = url.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
    for (let i = 0; i < ENCRYPTED_COVER_HOSTS.length; i++) {
        if (host === ENCRYPTED_COVER_HOSTS[i]) return "";
    }
    // The site's own "no cover" graphic is replaced by the app's placeholder.
    if (url.indexOf("/static/web/images/cover-placeholder") !== -1) return "";
    return url;
}

function videoInfo(url) {
    url = normalizeUrl(url);
    if (url.indexOf("http") !== 0) url = absUrl(url);
    let match = url.match(/\/video\/(\d+)(?:\/ep-(\d+))?/);
    if (!match) return null;
    return {
        id: match[1],
        ep: match[2] ? match[2] : "1",
        page: url
    };
}

function cardItems(root) {
    let items = [];
    root.select(".hg-drama-card").forEach(function (el) {
        let linkEl = el.select(".hg-drama-card__cover-link").first();
        if (!linkEl) linkEl = el.select(".hg-drama-card__title a").first();
        if (!linkEl) return;
        let link = absUrl(linkEl.attr("href"));
        if (!link) return;

        let titleEl = el.select(".hg-drama-card__title a").first();
        let name = titleEl ? titleEl.text().replace(/全集在线观看/g, "") : "";
        if (!name) name = el.select(".hg-drama-card__title").text().replace(/全集在线观看/g, "");
        name = name.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");

        let img = el.select("img").first();
        let cover = img ? (img.attr("data-src") || img.attr("src")) : "";

        let ep = el.select(".hg-drama-card__episode").first();
        let tag = ep ? (ep.attr("data-ep-base") || ep.text()) : "";

        items.push({
            name: name,
            cover: imgUrl(cover),
            link: link,
            description: el.select(".hg-drama-card__desc").text(),
            tag: tag
        });
    });
    return items;
}

function rankItems(doc) {
    let items = [];
    doc.select(".hg-rank-item").forEach(function (el) {
        let linkEl = el.select(".hg-rank-item__title a").first();
        if (!linkEl) return;
        let img = el.select(".hg-rank-item__cover img").first();
        items.push({
            name: linkEl.text(),
            cover: imgUrl(img ? (img.attr("data-src") || img.attr("src")) : ""),
            link: absUrl(linkEl.attr("href")),
            description: el.select(".hg-rank-item__desc").text(),
            tag: el.select(".hg-rank-item__tags").text()
        });
    });
    return items;
}
