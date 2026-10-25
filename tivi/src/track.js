load('lib.js');

function tiviBuildHeaders(channelHeaders) {
    var headers = {};
    var userAgent = "";

    for (var key in channelHeaders) {
        if (!tiviHas(channelHeaders, key)) continue;
        var value = channelHeaders[key];
        if (!value) continue;
        var canonical = tiviCanonicalHeader(key);
        if (!canonical) continue;
        if (canonical === "User-Agent") {
            userAgent = value;
        } else {
            headers[canonical] = value;
        }
    }

    var playlistUa = tiviGetPlaylistUa();
    var playlistReferer = tiviGetPlaylistReferer();
    if (!userAgent && playlistUa) userAgent = playlistUa;
    headers["User-Agent"] = userAgent || UserAgent.system();

    if (playlistReferer && !tiviHas(headers, "Referer")) {
        headers["Referer"] = playlistReferer;
    }
    return headers;
}

function tiviExtension(url) {
    var clean = String(url || "").split("#")[0].split("?")[0];
    var slash = clean.lastIndexOf("/");
    var name = slash >= 0 ? clean.substring(slash + 1) : clean;
    var dot = name.lastIndexOf(".");
    if (dot < 0) return "";
    return name.substring(dot + 1).toLowerCase();
}

function tiviSetHlsExtension(url) {
    var hash = "";
    var hashIndex = url.indexOf("#");
    if (hashIndex >= 0) {
        hash = url.substring(hashIndex);
        url = url.substring(0, hashIndex);
    }

    if (/[?&]extension=/i.test(url)) {
        url = url.replace(/([?&]extension=)[^&]*/i, "$1m3u8");
    } else {
        url += (url.indexOf("?") >= 0 ? "&" : "?") + "extension=m3u8";
    }

    return url + hash;
}

function tiviClearKeyKeys(value) {
    var text = tiviTrim(value);
    if (!text) return "";

    if ((text.charAt(0) === '"' && text.charAt(text.length - 1) === '"') ||
        (text.charAt(0) === "'" && text.charAt(text.length - 1) === "'")) {
        try {
            text = JSON.parse(text);
        } catch (error) {
            text = tiviTrim(text.substring(1, text.length - 1));
        }
    }

    if (/^%7B/i.test(text)) {
        try {
            text = decodeURIComponent(text);
        } catch (error) {
        }
    }

    if (text.charAt(0) === "{") {
        try {
            var obj = JSON.parse(text);
            if (obj && obj.keys && typeof obj.keys.length === "number" && obj.keys.length) {
                return JSON.stringify({ keys: obj.keys });
            }
        } catch (error) {
        }
        return "";
    }

    if (/^[0-9a-fA-F]+:[0-9a-fA-F]+(?:[,\s;]+[0-9a-fA-F]+:[0-9a-fA-F]+)*$/.test(text)) {
        return text;
    }
    return "";
}

function tiviDrmLabel(type) {
    if (type === "widevine") return "Widevine";
    if (type === "playready") return "PlayReady";
    if (type === "fairplay") return "FairPlay";
    return type || "không rõ";
}

function tiviBuildDrm(channel) {
    if (!channel) return {};

    var licenseType = tiviNormalizeDrmType(channel.licenseType || "");
    if ((licenseType === "widevine" || licenseType === "playready" || licenseType === "fairplay") && channel.licenseKey) {
        return {
            error: "Kênh dùng DRM " + tiviDrmLabel(licenseType) + " — vBook chỉ hỗ trợ ClearKey."
        };
    }

    var keys = tiviClearKeyKeys(channel.licenseKey);
    if (keys) {
        return {
            value: {
                scheme: "clearkey",
                keys: keys
            }
        };
    }

    if (licenseType === "clearkey" && channel.licenseKey) {
        return {
            error: "Kênh dùng ClearKey nhưng license_key không phải khóa tĩnh hợp lệ."
        };
    }

    return {};
}

function tiviPlayback(channel, type, url, mimeType, headers) {
    var drm = tiviBuildDrm(channel);
    if (drm.error) return Response.error(drm.error);

    var payload = {
        type: type,
        data: url,
        headers: headers
    };
    if (mimeType) payload.mimeType = mimeType;
    if (drm.value) payload.drm = drm.value;
    return Response.success(payload);
}

function tiviNative(channel, url, mimeType, headers) {
    return tiviPlayback(channel, "native", url, mimeType, headers);
}

function execute(data) {
    var url = tiviTrim(data);
    if (!url) return Response.error("Thiếu URL luồng phát.");

    if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
        try {
            var payload = JSON.parse(url);
            if (payload && payload.url) url = tiviTrim(payload.url);
        } catch (error) {
        }
    }

    if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
        var schemeMatch = url.match(/^([a-z][a-z0-9+.-]*):/i);
        if (schemeMatch) {
            return Response.error("Định dạng " + schemeMatch[1] + " chưa được hỗ trợ.");
        }
        return Response.error("URL luồng phát không hợp lệ.");
    }

    var channel = tiviFindChannel(url);
    var headers = tiviBuildHeaders(channel && channel.headers ? channel.headers : {});
    var lower = url.toLowerCase();
    var manifestType = channel && channel.manifestType ? tiviNormalizeManifestType(channel.manifestType) : "";

    if (manifestType === "mpd") {
        return tiviNative(channel, url, "application/dash+xml", headers);
    }

    if (manifestType === "hls") {
        var hlsUrl = lower.indexOf("play/live.php") !== -1 ? tiviSetHlsExtension(url) : url;
        return tiviNative(channel, hlsUrl, "application/x-mpegURL", headers);
    }

    if (lower.indexOf("play/live.php") !== -1) {
        return tiviNative(channel, tiviSetHlsExtension(url), "application/x-mpegURL", headers);
    }

    if (/^https?:\/\/[^\/]+\/[^\/]+\/[^\/]+\/\d+(?:[?#].*)?$/i.test(url)) {
        return tiviNative(channel, url, "video/mp2t", headers);
    }

    var extension = tiviExtension(url);
    if (extension === "m3u8") return tiviNative(channel, url, "application/x-mpegURL", headers);
    if (extension === "mpd") return tiviNative(channel, url, "application/dash+xml", headers);
    if (extension === "mp4") return tiviNative(channel, url, "video/mp4", headers);
    if (extension === "mkv") return tiviNative(channel, url, "video/x-matroska", headers);
    if (extension === "webm") return tiviNative(channel, url, "video/webm", headers);
    if (extension === "ts") return tiviNative(channel, url, "video/mp2t", headers);

    return tiviPlayback(channel, "auto", url, "", headers);
}
