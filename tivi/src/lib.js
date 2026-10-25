// Shared playlist loader/parser for Xem tiVi.
// Loaded by scripts; must not load any other file.

var TIVI_PLAYLIST_TABLE = "TIVI_PLAYLISTS";
var TIVI_LEGACY_CACHE_KEY = "tivi_playlist_cache_v2";
var TIVI_PAGE_SIZE = 300;
var TIVI_HOME_GROUP_LIMIT = 20;
var _tiviChannels = null;

function tiviTrim(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/^\s+|\s+$/g, "");
}

function tiviHas(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function tiviLog(message) {
    try {
        if (typeof console !== "undefined" && console.log) console.log(message);
    } catch (error) {
    }
}

var TIVI_ACCENT_MAP = {
    "a": "àáảãạăằắẳẵặâầấẩẫậ",
    "e": "èéẻẽẹêềếểễệ",
    "i": "ìíỉĩị",
    "o": "òóỏõọôồốổỗộơờớởỡợ",
    "u": "ùúủũụưừứửữự",
    "y": "ỳýỷỹỵ",
    "d": "đ"
};
var _tiviAccentLookup = null;

function tiviNormalize(value) {
    if (!_tiviAccentLookup) {
        _tiviAccentLookup = {};
        for (var base in TIVI_ACCENT_MAP) {
            if (!tiviHas(TIVI_ACCENT_MAP, base)) continue;
            var chars = TIVI_ACCENT_MAP[base];
            for (var i = 0; i < chars.length; i++) {
                _tiviAccentLookup[chars.charAt(i)] = base;
            }
        }
    }

    var text = String(value || "").toLowerCase();
    var result = "";
    for (var j = 0; j < text.length; j++) {
        var ch = text.charAt(j);
        result += tiviHas(_tiviAccentLookup, ch) ? _tiviAccentLookup[ch] : ch;
    }
    return result;
}

function tiviHostOf(url) {
    var match = String(url || "").match(/^https?:\/\/([^\/?#]+)/i);
    return match ? match[1] : "";
}

function tiviGetPlaylistUrls() {
    var raw = "";
    try {
        raw = PLAYLIST_URLS;
    } catch (error) {
        raw = "";
    }
    raw = tiviTrim(raw);
    if (!raw) return [];

    var values = null;
    var parsed = false;
    try {
        values = JSON.parse(raw);
        parsed = true;
    } catch (error) {
        values = null;
    }

    if (typeof values === "string") {
        values = [values];
    }
    if (!parsed || !values || typeof values.length !== "number" || typeof values.push !== "function") {
        values = raw.split(/[\r\n]+/);
    }

    var urls = [];
    var seen = {};
    for (var i = 0; i < values.length; i++) {
        var parts = String(values[i] || "").split(/[\r\n]+/);
        for (var j = 0; j < parts.length; j++) {
            var url = tiviTrim(parts[j]);
            if (!url) continue;
            if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) continue;
            var urlKey = "u:" + url;
            if (tiviHas(seen, urlKey)) continue;
            seen[urlKey] = true;
            urls.push(url);
        }
    }
    return urls;
}

function tiviGetPlaylistUa() {
    var value = "";
    try {
        value = PLAYLIST_UA;
    } catch (error) {
        value = "";
    }
    return tiviTrim(value);
}

function tiviGetPlaylistReferer() {
    var value = "";
    try {
        value = PLAYLIST_REFERER;
    } catch (error) {
        value = "";
    }
    return tiviTrim(value);
}

function tiviPlaylistStoreAvailable() {
    try {
        return typeof localDatabase !== "undefined" && localDatabase &&
            typeof localDatabase.list === "function" &&
            typeof localDatabase.upsert === "function";
    } catch (error) {
        return false;
    }
}

function tiviReadPlaylistRows() {
    if (!tiviPlaylistStoreAvailable()) return [];
    try {
        var rows = localDatabase.list("", TIVI_PLAYLIST_TABLE);
        return rows && typeof rows.length === "number" ? rows : [];
    } catch (error) {
        tiviLog("Tivi: không đọc được playlist đã lưu (" + error + ")");
        return [];
    }
}

function tiviPlaylistBaseUrl(key) {
    var value = tiviTrim(key);
    if (/^https?:\/\//i.test(value)) return value;

    var pipe = value.indexOf("|");
    if (pipe >= 0) {
        var candidate = tiviTrim(value.substring(pipe + 1));
        if (/^https?:\/\//i.test(candidate)) return candidate;
    }
    return "";
}

function tiviNormalizeRawPlaylist(value) {
    var text = String(value === null || value === undefined ? "" : value).replace(/^\uFEFF/, "");
    if (text.indexOf("\n") === -1 && text.indexOf("\\n") !== -1) {
        text = text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n");
    }
    return text.replace(/\r\n?/g, "\n");
}

function tiviChannelsFromSavedPlaylists() {
    var rows = tiviReadPlaylistRows();
    var configured = {};
    var urls = tiviGetPlaylistUrls();
    for (var u = 0; u < urls.length; u++) {
        configured["k:" + urls[u]] = true;
    }

    var ordered = [];
    for (var pass = 0; pass < 2; pass++) {
        for (var r = 0; r < rows.length; r++) {
            var downloaded = tiviHas(configured, "k:" + tiviTrim(rows[r].key));
            if ((pass === 0 && !downloaded) || (pass === 1 && downloaded)) {
                ordered.push(rows[r]);
            }
        }
    }

    var channels = [];
    var seen = {};
    var invalid = 0;

    for (var i = 0; i < ordered.length; i++) {
        var row = ordered[i] || {};
        var key = tiviTrim(row.key);
        var text = tiviNormalizeRawPlaylist(row.value);
        if (!tiviTrim(text)) continue;

        var parsed = tiviParseM3U(text, tiviPlaylistBaseUrl(key));
        if (!parsed.length) {
            invalid++;
            tiviLog("Tivi: bỏ qua playlist \"" + key + "\" vì không đọc được M3U.");
            continue;
        }

        for (var j = 0; j < parsed.length; j++) {
            var channel = parsed[j];
            var channelKey = "u:" + channel.url;
            if (tiviHas(seen, channelKey)) continue;
            seen[channelKey] = true;
            channels.push(channel);
        }
    }

    if (invalid) {
        tiviLog("Tivi: " + invalid + " playlist không hợp lệ đã bị bỏ qua.");
    }
    return channels;
}

function tiviSaveDownloadedPlaylist(url, text) {
    if (!tiviPlaylistStoreAvailable()) return false;
    try {
        return !!localDatabase.upsert("", TIVI_PLAYLIST_TABLE, url, text);
    } catch (error) {
        tiviLog("Tivi: không lưu được playlist " + tiviHostOf(url) + " (" + error + ")");
        return false;
    }
}

function tiviClearLegacyCache() {
    try {
        if (typeof cacheStorage !== "undefined" && cacheStorage && typeof cacheStorage.removeItem === "function") {
            cacheStorage.removeItem(TIVI_LEGACY_CACHE_KEY);
        }
    } catch (error) {
    }
    try {
        if (typeof localStorage !== "undefined" && localStorage && typeof localStorage.removeItem === "function") {
            localStorage.removeItem(TIVI_LEGACY_CACHE_KEY);
        }
    } catch (error) {
    }
}

function tiviCanonicalHeader(name) {
    var key = tiviTrim(name).toLowerCase();
    if (!key) return "";
    if (key === "user-agent" || key === "http-user-agent") return "User-Agent";
    if (key === "referer" || key === "referrer" || key === "http-referer" || key === "http-referrer") return "Referer";
    if (key === "origin" || key === "http-origin") return "Origin";
    if (key === "cookie" || key === "http-cookie") return "Cookie";
    return tiviTrim(name);
}

function tiviSetHeader(headers, name, value) {
    var key = tiviCanonicalHeader(name);
    var val = tiviTrim(value);
    if (!key || !val) return;
    headers[key] = val;
}

function tiviDecodePlaylistValue(value) {
    var text = tiviTrim(value);
    if (!text) return "";
    if ((text.charAt(0) === '"' && text.charAt(text.length - 1) === '"') ||
        (text.charAt(0) === "'" && text.charAt(text.length - 1) === "'")) {
        text = tiviTrim(text.substring(1, text.length - 1));
    }
    if (/^%7B/i.test(text)) {
        try {
            text = decodeURIComponent(text);
        } catch (error) {
        }
    }
    return text;
}

function tiviNormalizeManifestType(value) {
    var type = tiviTrim(value).toLowerCase();
    if (type === "mpd" || type === "dash") return "mpd";
    if (type === "hls" || type === "m3u8" || type === "m3u") return "hls";
    if (type === "ism" || type === "smooth" || type === "smoothstreaming") return "ism";
    return type;
}

function tiviNormalizeDrmType(value) {
    var type = tiviTrim(value).toLowerCase();
    if (type === "clearkey" || type === "clear-key" || type === "org.w3.clearkey") return "clearkey";
    if (type.indexOf("widevine") !== -1) return "widevine";
    if (type.indexOf("playready") !== -1) return "playready";
    if (type.indexOf("fairplay") !== -1) return "fairplay";
    return type;
}

function tiviParseHeaderString(value, headers) {
    var text = tiviTrim(value);
    if (!text) return;

    if (/^%7B/i.test(text)) {
        try {
            text = decodeURIComponent(text);
        } catch (error) {
        }
    }

    if (text.charAt(0) === "{") {
        try {
            var obj = JSON.parse(text);
            for (var key in obj) {
                if (tiviHas(obj, key)) tiviSetHeader(headers, key, obj[key]);
            }
            return;
        } catch (error) {
        }
    }

    if (text.indexOf("%3D") !== -1 || text.indexOf("%26") !== -1) {
        try {
            text = decodeURIComponent(text);
        } catch (error) {
        }
    }

    var parts = text.split(/[&|]/);
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var equals = part.indexOf("=");
        if (equals < 1) continue;
        var name = part.substring(0, equals);
        var val = part.substring(equals + 1);
        try {
            val = decodeURIComponent(val);
        } catch (error) {
        }
        tiviSetHeader(headers, name, val);
    }
}

function tiviFindNameSeparator(line) {
    var quote = "";
    for (var i = 0; i < line.length; i++) {
        var ch = line.charAt(i);
        if (quote) {
            if (ch === quote) quote = "";
        } else if (ch === '"' || ch === "'") {
            quote = ch;
        } else if (ch === ",") {
            return i;
        }
    }
    return -1;
}

function tiviParseExtinf(line) {
    var separator = tiviFindNameSeparator(line);
    var head = separator >= 0 ? line.substring(0, separator) : line;
    var attrs = {};
    var patterns = [
        /([a-zA-Z0-9_-]+)\s*=\s*"([^"]*)"/g,
        /([a-zA-Z0-9_-]+)\s*=\s*'([^']*)'/g
    ];
    for (var p = 0; p < patterns.length; p++) {
        var match;
        while ((match = patterns[p].exec(head)) !== null) {
            var key = match[1].toLowerCase();
            if (!tiviHas(attrs, key)) attrs[key] = match[2];
        }
    }

    var unquoted = head.replace(/"[^"]*"|'[^']*'/g, "");
    var loose = /([a-zA-Z0-9_-]+)\s*=\s*([^\s,"']+)/g;
    var looseMatch;
    while ((looseMatch = loose.exec(unquoted)) !== null) {
        var looseKey = looseMatch[1].toLowerCase();
        if (!tiviHas(attrs, looseKey)) attrs[looseKey] = looseMatch[2];
    }

    var name = separator >= 0 ? tiviTrim(line.substring(separator + 1)) : "";
    if (!name) name = tiviTrim(attrs["tvg-name"]);

    var logo = tiviTrim(attrs["tvg-logo"] || attrs["logo"]);
    if (logo === "0" || logo === "1" || logo === "-" || logo.toLowerCase() === "n/a") logo = "";

    var group = tiviTrim(attrs["group-title"] || attrs["group"]);
    return {
        name: name,
        logo: logo,
        group: group,
        groups: tiviSplitGroups(group),
        headers: {}
    };
}

function tiviSplitGroups(value) {
    var raw = tiviTrim(value).replace(/\s+/g, " ");
    if (!raw) return [];
    var parts = raw.split(";");
    var groups = [];
    var seen = {};
    for (var i = 0; i < parts.length; i++) {
        var group = tiviTrim(parts[i]);
        if (!group) continue;
        var key = "g:" + group.toLowerCase();
        if (tiviHas(seen, key)) continue;
        seen[key] = true;
        groups.push(group);
    }
    return groups;
}

function tiviGroupsOf(channel) {
    if (channel && channel.groups && channel.groups.length) return channel.groups;
    var groups = tiviSplitGroups(channel ? channel.group : "");
    return groups.length ? groups : ["Khác"];
}

function tiviNameFromUrl(url) {
    var clean = String(url || "").split("#")[0].split("?")[0];
    var slash = clean.lastIndexOf("/");
    var name = slash >= 0 ? clean.substring(slash + 1) : clean;
    try {
        name = decodeURIComponent(name);
    } catch (error) {
    }
    if (!name) name = tiviHostOf(url) || "Kênh";
    return name;
}

function tiviResolveUrl(url, baseUrl) {
    url = tiviTrim(url);
    if (!url) return "";
    if (/^(https?|data|rtmp|rtsp|udp|mms):/i.test(url)) return url;
    if (url.indexOf("//") === 0) {
        var proto = String(baseUrl || "").match(/^(https?):/i);
        return (proto ? proto[1] + ":" : "https:") + url;
    }

    var originMatch = String(baseUrl || "").match(/^(https?:\/\/[^\/]+)/i);
    if (!originMatch) return url;
    var origin = originMatch[1];
    var cleanBase = String(baseUrl || "").replace(/[?#].*$/, "");
    var basePath = cleanBase.substring(origin.length);
    var dir = basePath.substring(0, basePath.lastIndexOf("/") + 1);
    if (!dir) dir = "/";

    var full = url.charAt(0) === "/" ? url : dir + url;
    var parts = full.split("/");
    var resolved = [];
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part === "" && i === 0) {
            resolved.push("");
            continue;
        }
        if (part === ".") continue;
        if (part === "..") {
            if (resolved.length > 1) resolved.pop();
            continue;
        }
        resolved.push(part);
    }
    var path = resolved.join("/");
    if (path.charAt(0) !== "/") path = "/" + path;
    return origin + path;
}

function tiviLooksLikePlaylist(content) {
    if (content.indexOf("#EXTM3U") !== -1 || content.indexOf("#EXTINF") !== -1) return true;

    var lines = content.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
        var line = tiviTrim(lines[i]);
        if (!line || line.charAt(0) === "#") continue;
        return /^(https?|rtmp|rtsp|udp|mms):\/\//i.test(line) || line.indexOf("//") === 0;
    }
    return false;
}

function tiviParseM3U(text, baseUrl) {
    var channels = [];
    var seen = {};
    var content = String(text || "").replace(/^\uFEFF/, "");
    if (!tiviLooksLikePlaylist(content)) return [];

    if (/^#EXT-X-(TARGETDURATION|MEDIA-SEQUENCE|STREAM-INF)/m.test(content)) {
        return [{
            name: "Luồng trực tiếp",
            url: baseUrl,
            logo: "",
            group: "Khác",
            groups: ["Khác"],
            headers: {},
            manifestType: "",
            licenseType: "",
            licenseKey: ""
        }];
    }

    var lines = content.split(/\r?\n/);
    var pending = null;
    var pendingHeaders = {};
    var pendingMeta = {};
    var lastGroup = "";

    for (var i = 0; i < lines.length; i++) {
        var line = tiviTrim(lines[i]);
        if (!line) continue;

        if (line.indexOf("#EXTINF") === 0) {
            pending = tiviParseExtinf(line);
            for (var pendingKey in pendingHeaders) {
                if (tiviHas(pendingHeaders, pendingKey)) {
                    pending.headers[pendingKey] = pendingHeaders[pendingKey];
                }
            }
            pendingHeaders = {};
            for (var metaKey in pendingMeta) {
                if (tiviHas(pendingMeta, metaKey)) {
                    pending[metaKey] = pendingMeta[metaKey];
                }
            }
            pendingMeta = {};
            continue;
        }

        if (line.indexOf("#EXTGRP:") === 0) {
            lastGroup = tiviTrim(line.substring(8));
            if (pending) {
                pending.group = lastGroup;
                pending.groups = tiviSplitGroups(lastGroup);
            }
            continue;
        }

        if (line.indexOf("#EXTVLCOPT:") === 0) {
            var option = tiviTrim(line.substring(11));
            var optionEquals = option.indexOf("=");
            if (optionEquals > 0) {
                var optionName = option.substring(0, optionEquals);
                var optionValue = option.substring(optionEquals + 1);
                var canonical = tiviCanonicalHeader(optionName);
                if (canonical === "User-Agent" || canonical === "Referer" || canonical === "Origin" || canonical === "Cookie") {
                    if (pending) {
                        tiviSetHeader(pending.headers, optionName, optionValue);
                    } else {
                        tiviSetHeader(pendingHeaders, optionName, optionValue);
                    }
                }
            }
            continue;
        }

        if (line.indexOf("#EXTHTTP:") === 0) {
            if (pending) {
                tiviParseHeaderString(line.substring(9), pending.headers);
            } else {
                tiviParseHeaderString(line.substring(9), pendingHeaders);
            }
            continue;
        }

        if (line.indexOf("#KODIPROP:") === 0) {
            var prop = tiviTrim(line.substring(10));
            var propEquals = prop.indexOf("=");
            if (propEquals > 0) {
                var propName = tiviTrim(prop.substring(0, propEquals)).toLowerCase();
                var propValue = prop.substring(propEquals + 1);
                if (propName === "inputstream.adaptive.stream_headers" || propName === "inputstream.adaptive.manifest_headers") {
                    if (pending) {
                        tiviParseHeaderString(propValue, pending.headers);
                    } else {
                        tiviParseHeaderString(propValue, pendingHeaders);
                    }
                } else if (propName === "inputstream.adaptive.manifest_type") {
                    var manifestType = tiviNormalizeManifestType(propValue);
                    if (pending) {
                        pending.manifestType = manifestType;
                    } else {
                        pendingMeta.manifestType = manifestType;
                    }
                } else if (propName === "inputstream.adaptive.license_type") {
                    var licenseType = tiviNormalizeDrmType(propValue);
                    if (pending) {
                        pending.licenseType = licenseType;
                    } else {
                        pendingMeta.licenseType = licenseType;
                    }
                } else if (propName === "inputstream.adaptive.license_key") {
                    var licenseKey = tiviDecodePlaylistValue(propValue);
                    if (pending) {
                        pending.licenseKey = licenseKey;
                    } else {
                        pendingMeta.licenseKey = licenseKey;
                    }
                }
            }
            continue;
        }

        if (line.charAt(0) === "#") continue;

        var url = line;
        if (!pending && url.indexOf("//") !== 0 && !/^(https?|rtmp|rtsp|udp|mms):/i.test(url)) {
            continue;
        }

        var headers = pending ? pending.headers : pendingHeaders;
        var pipe = url.indexOf("|");
        if (pipe >= 0) {
            tiviParseHeaderString(url.substring(pipe + 1), headers);
            url = url.substring(0, pipe);
        }

        url = tiviResolveUrl(url, baseUrl);
        if (!url) {
            pending = null;
            pendingHeaders = {};
            pendingMeta = {};
            continue;
        }

        var seenKey = "u:" + url;
        if (tiviHas(seen, seenKey)) {
            pending = null;
            pendingHeaders = {};
            pendingMeta = {};
            continue;
        }
        seen[seenKey] = true;

        var name = pending && pending.name ? pending.name : tiviNameFromUrl(url);
        var logo = pending && pending.logo ? tiviResolveUrl(pending.logo, baseUrl) : "";
        var groupValue = pending && pending.group ? pending.group : lastGroup;
        var groups = pending && pending.groups && pending.groups.length ? pending.groups : tiviSplitGroups(groupValue);
        if (!groups.length) groups = ["Khác"];
        var channelHeaders = {};
        for (var headerKey in headers) {
            if (tiviHas(headers, headerKey) && headers[headerKey]) {
                channelHeaders[headerKey] = headers[headerKey];
            }
        }

        channels.push({
            name: name || tiviNameFromUrl(url),
            url: url,
            logo: logo,
            group: groups[0],
            groups: groups,
            headers: channelHeaders,
            manifestType: pending && pending.manifestType ? pending.manifestType : "",
            licenseType: pending && pending.licenseType ? pending.licenseType : "",
            licenseKey: pending && pending.licenseKey ? pending.licenseKey : ""
        });

        pending = null;
        pendingHeaders = {};
        pendingMeta = {};
    }

    return channels;
}

function tiviFetchRawPlaylists(urls) {
    var playlists = [];
    var errors = [];
    var headers = {};
    var ua = tiviGetPlaylistUa();
    var referer = tiviGetPlaylistReferer();
    if (ua) headers["User-Agent"] = ua;
    if (referer) headers["Referer"] = referer;

    for (var i = 0; i < urls.length; i++) {
        var url = urls[i];
        tiviLog("Tivi: tải playlist " + (i + 1) + "/" + urls.length + " (" + tiviHostOf(url) + ")");

        var response;
        try {
            response = fetch(url, { headers: headers, timeout: 60000 });
        } catch (error) {
            errors.push(tiviHostOf(url) + ": " + error);
            tiviLog("Tivi: lỗi request");
            continue;
        }

        if (!response || !response.ok) {
            var status = response ? response.status : "?";
            errors.push(tiviHostOf(url) + ": HTTP " + status);
            tiviLog("Tivi: lỗi HTTP " + status);
            continue;
        }

        var text = "";
        try {
            text = response.text();
        } catch (error) {
            errors.push(tiviHostOf(url) + ": không đọc được nội dung");
            tiviLog("Tivi: lỗi đọc nội dung");
            continue;
        }

        text = tiviNormalizeRawPlaylist(text);
        if (!tiviLooksLikePlaylist(text)) {
            errors.push(tiviHostOf(url) + ": không phải playlist M3U");
            tiviLog("Tivi: nội dung không phải playlist M3U");
            continue;
        }

        var parsed = tiviParseM3U(text, response.url || url);
        if (!parsed.length) {
            errors.push(tiviHostOf(url) + ": playlist rỗng");
            tiviLog("Tivi: playlist rỗng");
            continue;
        }

        playlists.push({
            url: url,
            text: text,
            channels: parsed.length
        });
        tiviLog("Tivi: đã đọc " + parsed.length + " kênh");
    }

    return { playlists: playlists, errors: errors, okCount: playlists.length };
}

function tiviGetChannels() {
    if (_tiviChannels) return _tiviChannels;
    _tiviChannels = tiviChannelsFromSavedPlaylists();
    return _tiviChannels;
}

function tiviGetCategories() {
    var channels = tiviGetChannels();
    var groups = [];
    var seen = {};
    for (var i = 0; i < channels.length; i++) {
        var channelGroups = tiviGroupsOf(channels[i]);
        for (var j = 0; j < channelGroups.length; j++) {
            var group = channelGroups[j];
            var key = "g:" + group.toLowerCase();
            if (tiviHas(seen, key)) continue;
            seen[key] = true;
            groups.push(group);
        }
    }
    return groups;
}

function tiviChannelHasGroup(channel, group, insensitive) {
    var channelGroups = tiviGroupsOf(channel);
    var target = insensitive ? tiviNormalize(group) : group;
    for (var i = 0; i < channelGroups.length; i++) {
        var value = insensitive ? tiviNormalize(channelGroups[i]) : channelGroups[i];
        if (value === target) return true;
    }
    return false;
}

function tiviFindChannel(url) {
    var target = tiviTrim(url);
    var targetNoSlash = target.replace(/\/+$/, "");
    var channels = tiviGetChannels();
    for (var i = 0; i < channels.length; i++) {
        var channelUrl = channels[i].url || "";
        if (channelUrl === target) return channels[i];
        if (channelUrl.replace(/\/+$/, "") === targetNoSlash) return channels[i];
    }
    return null;
}

function tiviGetItems(query, page) {
    var channels = tiviGetChannels();
    var text = tiviTrim(query);
    var filtered = [];

    if (text.indexOf("group:") === 0) {
        var group = text.substring(6);
        if (!group) {
            filtered = channels;
        } else {
            var exact = [];
            var insensitive = [];
            for (var i = 0; i < channels.length; i++) {
                if (tiviChannelHasGroup(channels[i], group, false)) {
                    exact.push(channels[i]);
                } else if (tiviChannelHasGroup(channels[i], group, true)) {
                    insensitive.push(channels[i]);
                }
            }
            filtered = exact.length ? exact : insensitive;
        }
    } else if (!text) {
        filtered = channels;
    } else {
        var keyword = tiviNormalize(text);
        for (var j = 0; j < channels.length; j++) {
            var name = tiviNormalize(channels[j].name);
            var groupName = tiviNormalize(tiviGroupsOf(channels[j]).join(" "));
            if (name.indexOf(keyword) !== -1 || groupName.indexOf(keyword) !== -1) {
                filtered.push(channels[j]);
            }
        }
    }

    var current = parseInt(page || "1", 10);
    if (isNaN(current) || current < 1) current = 1;
    var start = (current - 1) * TIVI_PAGE_SIZE;
    var items = [];

    for (var k = start; k < filtered.length && k < start + TIVI_PAGE_SIZE; k++) {
        var channel = filtered[k];
        items.push({
            name: channel.name,
            link: channel.url,
            cover: channel.logo || "",
            description: tiviGroupsOf(channel).join(", "),
            tag: "LIVE"
        });
    }

    var next = start + TIVI_PAGE_SIZE < filtered.length ? String(current + 1) : "";
    return { items: items, next: next };
}
