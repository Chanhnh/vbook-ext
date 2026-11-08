// Shared image-link metadata for Fanqie comic chapters.
// The reader may drop a URL fragment, so keys are also cached by base URL.

var FQ_IMAGE_KEY_STORE = "fqweb_comic_image_keys_v1";
var FQ_IMAGE_KEY_LIMIT = 400;

function fqImageJson(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

function fqImageMapLoad() {
    var text = null;
    try {
        text = localStorage.getItem(FQ_IMAGE_KEY_STORE);
    } catch (e) {
        text = null;
    }
    var map = fqImageJson(text);
    if (!map || typeof map !== "object") return {};
    return map;
}

function fqImageMapSave(map) {
    var keys = [];
    var key;
    for (key in map) {
        if (Object.prototype.hasOwnProperty.call(map, key)) keys.push(key);
    }
    while (keys.length > FQ_IMAGE_KEY_LIMIT) {
        delete map[keys.shift()];
    }
    try {
        localStorage.setItem(FQ_IMAGE_KEY_STORE, JSON.stringify(map));
    } catch (e) {
        // The fragment on each image link remains the primary key carrier.
    }
}

function fqImageMapKey(url) {
    return fqMd5Hex(String(url || ""));
}

function fqComicSaveImageKeys(entries) {
    if (!entries || !entries.length) return;
    var map = fqImageMapLoad();
    var i;
    for (i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (!entry || !entry.url || !entry.key) continue;
        map[fqImageMapKey(entry.url)] = { k: String(entry.key), m: String(entry.md5 || "") };
    }
    fqImageMapSave(map);
}

function fqComicLoadImageKey(url) {
    var map = fqImageMapLoad();
    var item = map[fqImageMapKey(url)];
    if (!item || !item.k) return null;
    return { key: String(item.k), md5: String(item.m || "") };
}

function fqComicImageLink(url, key, md5) {
    var base = String(url || "").split("#")[0];
    if (!key) return base;
    return base + "#fqkey=" + String(key) + (md5 ? "&fqmd5=" + String(md5) : "");
}

function fqComicImageInfo(link) {
    var text = String(link || "");
    var hash = text.indexOf("#");
    var base = hash >= 0 ? text.substring(0, hash) : text;
    var fragment = hash >= 0 ? text.substring(hash + 1) : "";
    var key = fqQueryParam(fragment, "fqkey");
    var md5 = fqQueryParam(fragment, "fqmd5");
    if (!key) key = fqQueryParam(text, "fqkey");
    if (!md5) md5 = fqQueryParam(text, "fqmd5");
    if (!key) {
        var saved = fqComicLoadImageKey(base);
        if (saved) {
            key = saved.key;
            md5 = saved.md5;
        }
    }
    return { url: base, key: key, md5: md5 };
}
