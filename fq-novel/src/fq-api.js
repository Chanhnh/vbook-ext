// Fanqie app API: device registration, key registration, chapter fetch/decrypt.

var FQ_DEFAULT_DEVICE_TYPE = "P30";
var FQ_DEFAULT_DEVICE_BRAND = "realme";

var FQ_READING_BASE = "https://reading.snssdk.com";
var FQ_DEVICE_REGISTER_URL = "https://i.snssdk.com/service/2/device_register/";
var FQ_SHARED_KEY = fqHexDecode("ac25c67ddd8f38c1b37a2348828e222e");
var FQ_FIXED_STRING = fqB64Decode("TdTC5rgxYgkOUrPHpnM7pByyRiuCmrWKGWs521cXdST0m69/COjWjSanLjfBqVovHwWlGJKu8pSXMrYqOKrdWA==");

var FQ_DEVICE_STORE = "fqweb_device_v1";
var FQ_KEY_STORE = "fqweb_key_v1";

function fqConfigString(value, fallback) {
    var text = value === undefined || value === null ? "" : String(value);
    text = text.replace(/^"(.*)"$/, "$1").replace(/^\s+|\s+$/g, "");
    return text || fallback || "";
}

function fqError(code, message) {
    var err = new Error(message);
    err.code = code;
    return err;
}

function fqStorageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function fqStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        // Storage is an optimization; the extension still works without it.
    }
}

function fqStorageRemove(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        // ignore
    }
}

function fqParseJson(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

function fqIsNumericId(value) {
    return /^\d+$/.test(String(value || ""));
}

function fqLoadGeneratedDevice() {
    var data = fqParseJson(fqStorageGet(FQ_DEVICE_STORE));
    if (!data) return null;
    if (!fqIsNumericId(data.device_id) || !fqIsNumericId(data.install_id)) {
        fqStorageRemove(FQ_DEVICE_STORE);
        return null;
    }
    return {
        device_id: String(data.device_id),
        install_id: String(data.install_id),
        device_type: String(data.device_type || FQ_DEFAULT_DEVICE_TYPE),
        device_brand: String(data.device_brand || FQ_DEFAULT_DEVICE_BRAND),
        source: "registered"
    };
}

function fqSaveGeneratedDevice(device) {
    fqStorageSet(FQ_DEVICE_STORE, JSON.stringify({
        device_id: String(device.device_id),
        install_id: String(device.install_id),
        device_type: String(device.device_type || FQ_DEFAULT_DEVICE_TYPE),
        device_brand: String(device.device_brand || FQ_DEFAULT_DEVICE_BRAND)
    }));
}

function fqResolveDevice() {
    var generated = fqLoadGeneratedDevice();
    if (generated) return generated;
    throw fqError("NOT_REGISTERED", "Chưa đăng ký device. Mở trang extension → bấm Đăng ký device mới.");
}

function fqLoadCachedKey() {
    var data = fqParseJson(fqStorageGet(FQ_KEY_STORE));
    if (!data || !data.key || !data.device_id || !data.install_id) return null;
    return data;
}

function fqSaveCachedKey(device, keyInfo) {
    fqStorageSet(FQ_KEY_STORE, JSON.stringify({
        device_id: String(device.device_id),
        install_id: String(device.install_id),
        key: fqB64Encode(keyInfo.key),
        keyver: String(keyInfo.keyver)
    }));
}

function fqClearCachedKey() {
    fqStorageRemove(FQ_KEY_STORE);
}

function fqBuildQuery(pairs) {
    var out = [];
    var i;
    for (i = 0; i < pairs.length; i++) {
        out.push(encodeURIComponent(String(pairs[i][0])) + "=" + encodeURIComponent(String(pairs[i][1])));
    }
    return out.join("&");
}

function fqMergeHeaders(base, extra) {
    var out = {};
    var key;
    for (key in base) {
        if (Object.prototype.hasOwnProperty.call(base, key)) out[key] = base[key];
    }
    for (key in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, key)) out[key] = extra[key];
    }
    return out;
}

function fqDeviceIdBytesLE(deviceId) {
    var digits = String(deviceId || "").replace(/\D/g, "");
    if (!digits) digits = "0";
    var out = new Uint8Array(8);
    var i;
    for (i = 0; i < 8; i++) {
        var rem = 0;
        var quotient = [];
        var j;
        for (j = 0; j < digits.length; j++) {
            var cur = rem * 10 + (digits.charCodeAt(j) - 48);
            var q = Math.floor(cur / 256);
            rem = cur % 256;
            if (quotient.length || q) quotient.push(q);
        }
        out[i] = rem;
        if (!quotient.length) {
            digits = "0";
        } else {
            var next = "";
            for (j = 0; j < quotient.length; j++) next += String(quotient[j]);
            digits = next;
        }
    }
    return out;
}

function fqRegisterKey(device) {
    var query = fqBuildQuery([
        ["device_id", device.device_id],
        ["iid", device.install_id],
        ["device_type", device.device_type],
        ["aid", "1967"],
        ["app_name", "novelapp"],
        ["channel", "0"],
        ["device_platform", "android"],
        ["os_version", "0"],
        ["version_code", "6.3.9.32"]
    ]);
    var url = FQ_READING_BASE + "/reading/crypt/registerkey?" + query;
    var iv = fqRandomBytes(16);
    var encrypted = fqAesEncrypt(FQ_SHARED_KEY, iv, fqDeviceIdBytesLE(device.device_id));
    var body = JSON.stringify({ content: fqB64Encode(fqConcat(iv, encrypted)) });
    var headers = fqSignHeaders(url, body);
    headers = fqMergeHeaders(headers, {
        "User-Agent": "com.dragon.read",
        "Content-Type": "application/json; charset=utf-8"
    });
    var response = fetch(url, {
        method: "POST",
        headers: headers,
        body: body,
        timeout: 30000
    });
    if (!response.ok) throw fqError("HTTP", "registerkey HTTP " + response.status);
    var text = response.text();
    var json = fqParseJson(text);
    if (!json || !json.data || !json.data.key) {
        throw fqError("KEY", "registerkey không trả về key: " + String(text).substring(0, 200));
    }
    var buf = fqB64Decode(json.data.key);
    if (buf.length < 17) throw fqError("KEY", "registerkey trả về key không hợp lệ.");
    var key = fqAesDecrypt(FQ_SHARED_KEY, buf.subarray(0, 16), buf.subarray(16));
    return { key: key, keyver: String(json.data.keyver || "") };
}

function fqGetKey(device) {
    var cached = fqLoadCachedKey();
    if (cached && String(cached.device_id) === String(device.device_id) && String(cached.install_id) === String(device.install_id)) {
        try {
            return { key: fqB64Decode(cached.key), keyver: String(cached.keyver || "") };
        } catch (e) {
            fqClearCachedKey();
        }
    }
    var keyInfo = fqRegisterKey(device);
    fqSaveCachedKey(device, keyInfo);
    return keyInfo;
}

function fqDeviceRegisterBody(device) {
    var now = Date.now();
    var cdid = fqUuid();
    var firstInstall = now - 30 * 86400000;
    return {
        magic_tag: "ss_app_log",
        header: {
            display_name: "番茄免费小说",
            aid: 1967,
            channel: "43536163a",
            package: "com.dragon.read",
            sdk_version: "3.7.0-rc.25-fanqie-xiaoshuo",
            sdk_target_version: 29,
            git_hash: "711d1a7",
            density_dpi: 240,
            display_density: "hdpi",
            resolution: "720x1280",
            language: "zh",
            timezone: 8,
            access: "wifi",
            not_request_sender: 0,
            carrier: "CHINA MOBILE",
            mcc_mnc: "46000",
            region: "CN",
            tz_name: "Asia/Shanghai",
            tz_offset: 28800,
            sim_region: "cn",
            sim_serial_number: [],
            oaid_may_support: false,
            device_platform: "android",
            custom: { host_bit: 32, dragon_device_type: 0 },
            pre_installed_channel: "",
            is_system_app: 0,
            sdk_flavor: "china",
            guest_mode: 0,
            os: "Android",
            os_version: "10",
            os_api: 30,
            device_model: device.device_type,
            device_brand: device.device_brand,
            device_manufacturer: device.device_brand,
            cpu_abi: "arm64-v8a",
            release_build: fqRandomHex(7),
            cdid: cdid,
            sig_hash: "a4a27c2633195374c15651ffc3c4a497",
            openudid: fqRandomHex(20),
            clientudid: fqUuid(),
            req_id: fqUuid(),
            rom: fqRandomHex(14).toUpperCase(),
            rom_version: "coloros__" + fqRandomHex(4).toUpperCase() + ".123456.12345678 release-keys",
            apk_first_install_time: firstInstall,
            ipv6_list: [
                { type: "client_anpi", value: "::1" },
                { type: "client_anpi", value: "fd00:1234:5678:9abc:def0:1234:5678:9abc" }
            ]
        },
        _gen_time: now
    };
}

function fqRegisterDevice(deviceType, deviceBrand) {
    var device = {
        device_id: "",
        install_id: "",
        device_type: fqConfigString(deviceType, FQ_DEFAULT_DEVICE_TYPE),
        device_brand: fqConfigString(deviceBrand, FQ_DEFAULT_DEVICE_BRAND)
    };
    var now = Date.now();
    var ts = Math.floor(now / 1000);
    var body = fqDeviceRegisterBody(device);
    var encrypted = fqEncryptTT(fqUtf8Encode(JSON.stringify(body)));
    var query = fqBuildQuery([
        ["tt_data", "a"],
        ["ac", "wifi"],
        ["channel", "43536163a"],
        ["aid", "1967"],
        ["app_name", "novelapp"],
        ["version_code", "70132"],
        ["version_name", "7.0.1.32"],
        ["device_platform", "android"],
        ["os", "android"],
        ["ssmix", "a"],
        ["device_type", device.device_type],
        ["device_brand", device.device_brand],
        ["language", "zh"],
        ["os_api", "30"],
        ["os_version", "10"],
        ["manifest_version_code", "70132"],
        ["resolution", "720*1280"],
        ["dpi", "240"],
        ["update_version_code", "70132"],
        ["_rticket", String(now)],
        ["package", "com.dragon.read"],
        ["mcc_mnc", "46000"],
        ["first_launch_timestamp", String(ts)],
        ["cpu_support64", "true"],
        ["host_abi", "arm64-v8a"],
        ["is_guest_mode", "0"],
        ["app_type", "normal"],
        ["ts", String(ts)],
        ["cdid", body.header.cdid]
    ]);
    var url = FQ_DEVICE_REGISTER_URL + "?" + query;
    var blob;
    try {
        blob = Blob.fromBase64(fqB64Encode(encrypted), "application/octet-stream;tt-data=a");
    } catch (e) {
        throw fqError("REGISTER", "Không tạo được Blob nhị phân: " + (e && e.message ? e.message : e));
    }
    var response = fetch(url, {
        method: "POST",
        headers: {
            "User-Agent": "okhttp/4.10.0",
            "Content-Type": "application/octet-stream;tt-data=a",
            "Accept-Encoding": "gzip",
            "sdk-version": "2",
            "x-ss-dp": "1967"
        },
        body: blob,
        timeout: 30000
    });
    if (!response.ok) throw fqError("HTTP", "device_register HTTP " + response.status);
    var text = response.text();
    var json = fqParseJson(text);
    if (!json || !json.device_id_str || !json.install_id_str) {
        throw fqError("REGISTER", "device_register không trả về device_id/install_id: " + String(text).substring(0, 200));
    }
    return {
        device_id: String(json.device_id_str),
        install_id: String(json.install_id_str),
        device_type: device.device_type,
        device_brand: device.device_brand,
        source: "registered"
    };
}

function fqRegisterAndSaveDevice(deviceType, deviceBrand) {
    var device = fqRegisterDevice(deviceType, deviceBrand);
    fqSaveGeneratedDevice(device);
    fqClearCachedKey();
    var keyInfo = fqRegisterKey(device);
    fqSaveCachedKey(device, keyInfo);
    return { device: device, key: keyInfo };
}

function fqContentQuery(device, itemId) {
    return fqBuildQuery([
        ["iid", device.install_id],
        ["device_id", device.device_id],
        ["ac", "wifi"],
        ["channel", "43536163a"],
        ["aid", "1967"],
        ["app_name", "novelapp"],
        ["version_code", "70132"],
        ["version_name", "7.0.1.32"],
        ["device_platform", "android"],
        ["os", "android"],
        ["ssmix", "a"],
        ["os_version", "10"],
        ["device_type", device.device_type],
        ["device_brand", device.device_brand],
        ["update_version_code", "70132"],
        ["manifest_version_code", "70132"],
        ["pv_player", "70132"],
        ["item_id", itemId],
        ["req_type", "1"]
    ]);
}

function fqFetchChapterData(device, itemId) {
    var url = FQ_READING_BASE + "/reading/reader/full/v?" + fqContentQuery(device, itemId);
    var headers = fqSignHeaders(url);
    headers = fqMergeHeaders(headers, { "User-Agent": "com.dragon.read" });
    var response = fetch(url, { headers: headers, timeout: 30000 });
    if (!response.ok) throw fqError("HTTP", "chapter HTTP " + response.status);
    var text = response.text();
    if (!text) {
        throw fqError("DEVICE_INVALID", "Device hiện tại không đọc được nội dung (có thể đã bị thu hồi).\nMở trang extension → bấm Đăng ký device mới.");
    }
    var json = fqParseJson(text);
    if (!json) throw fqError("API", "Phản hồi chapter không phải JSON.");
    if (json.code !== 0) {
        throw fqError("API", "Fanqie báo lỗi: " + (json.message || json.code));
    }
    var data = json.data;
    if (!data || !data.content) {
        throw fqError("DEVICE_INVALID", "Device hiện tại không đọc được nội dung (có thể đã bị thu hồi).\nMở trang extension → bấm Đăng ký device mới.");
    }
    return data;
}

function fqDecryptChapterData(data, key) {
    var encrypted = fqB64Decode(data.content);
    if (encrypted.length < 17) throw fqError("DECRYPT", "Nội dung chapter quá ngắn.");
    var plain = fqAesDecrypt(key, encrypted.subarray(0, 16), encrypted.subarray(16));
    // fqGunzip returns the input unchanged when the payload is not a gzip stream.
    plain = fqGunzip(plain);
    return fqUtf8Decode(plain);
}

function fqNormalizeChapterText(text) {
    return String(text || "").replace(/[\s\u200b\u200c\u200d\ufeff]+/g, "");
}

function fqStripAttributes(html) {
    return String(html || "")
        .replace(/\s+(?:p_idx|e_idx|e_order)="[^"]*"/gi, "")
        .replace(/\s+(?:p_idx|e_idx|e_order)='[^']*'/gi, "");
}

function fqExtractBookId(url) {
    var text = String(url || "");
    var match = text.match(/[?&]book_id=(\d+)/);
    if (!match) match = text.match(/\/page\/(\d+)/);
    return match ? match[1] : "";
}

function fqFetchParagraphCommentCounts(device, itemId, itemVersion) {
    try {
        var deviceId = device && device.device_id ? String(device.device_id) : "";
        var query = "aid=1967&device_id=" + encodeURIComponent(deviceId) + "&version_code=70132&device_platform=android&version_name=7.0.1.32";
        var url = "https://api5-normal-sinfonlineb.fqnovel.com/novel/commentapi/idea/list/" + encodeURIComponent(String(itemId)) + "/v1/?" + query;
        var body = {
            "comment_source": 3,
            "compliance_status": 0,
            "item_id": String(itemId),
            "item_version": String(itemVersion || ""),
            "server_channel": 7
        };
        var serialized = JSON.stringify(body);
        var headers = fqSignHeaders(url, serialized);
        headers["User-Agent"] = "com.dragon.read";
        headers["Content-Type"] = "application/json; charset=utf-8";

        var response = fetch(url, {
            method: "POST",
            headers: headers,
            body: serialized,
            timeout: 10000
        });
        if (!response.ok) return { data: {}, item_version: "" };
        var text = response.text();
        if (!text) return { data: {}, item_version: "" };
        var json = fqParseJson(text);
        if (!json || !json.data) return { data: {}, item_version: "" };
        return {
            data: json.data.data || {},
            item_version: json.data.item_version ? String(json.data.item_version) : ""
        };
    } catch (e) {
        return { data: {}, item_version: "" };
    }
}

function fqExtractParagraphIndex(attrs, content) {
    var m = String(attrs || "").match(/[\s]idx=["']?(\d+)["']?/i);
    if (m) return m[1];
    if (content) {
        var blk = String(content || "").match(/<blk\b[^>]*[\s](?:p_idx|idx)=["']?(\d+)["']?/i);
        if (blk) return blk[1];
    }
    var p = String(attrs || "").match(/[\s]p_idx=["']?(\d+)["']?/i);
    if (p && p[1] !== "40000") return p[1];
    return null;
}

function fqDecorateChapterParagraphs(html, bookId, itemId, itemVersion, countMap, deviceId) {
    if (!html) return "";
    var res = String(html);
    if (countMap && typeof countMap === "object") {
        res = res.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, function(match, attrs, content) {
            var idx = fqExtractParagraphIndex(attrs, content);
            var clean = content.replace(/<blk\b[^>]*>/gi, "").replace(/<\/blk>/gi, "");
            if (!idx && idx !== "0") return "<p>" + clean + "</p>";
            var info = countMap[idx];
            var count = info ? (info.count || 0) : 0;
            if (count > 0) {
                var input = "book_id=" + encodeURIComponent(String(bookId || "")) +
                            "&item_id=" + encodeURIComponent(String(itemId || "")) +
                            "&item_version=" + encodeURIComponent(String(itemVersion || "")) +
                            "&para_index=" + encodeURIComponent(String(idx)) +
                            (deviceId ? "&device_id=" + encodeURIComponent(String(deviceId)) : "");
                return '<p idx="' + idx + '">' + clean + '<comment count="' + count + '" input="' + input + '" script="para_comment.js"></comment></p>';
            }
            return '<p idx="' + idx + '">' + clean + '</p>';
        });

        res = res.replace(/<blk\b([^>]*)>([\s\S]*?)<\/blk>/gi, function(match, attrs, content) {
            var idx = fqExtractParagraphIndex(attrs, "");
            if (!idx && idx !== "0") return "<p>" + content + "</p>";
            var info = countMap[idx];
            var count = info ? (info.count || 0) : 0;
            if (count > 0) {
                var input = "book_id=" + encodeURIComponent(String(bookId || "")) +
                            "&item_id=" + encodeURIComponent(String(itemId || "")) +
                            "&item_version=" + encodeURIComponent(String(itemVersion || "")) +
                            "&para_index=" + encodeURIComponent(String(idx)) +
                            (deviceId ? "&device_id=" + encodeURIComponent(String(deviceId)) : "");
                return '<p idx="' + idx + '">' + content + '<comment count="' + count + '" input="' + input + '" script="para_comment.js"></comment></p>';
            }
            return '<p idx="' + idx + '">' + content + '</p>';
        });
    }

    res = fqStripAttributes(res);
    res = res.replace(/<blk\b[^>]*>/gi, "").replace(/<\/blk>/gi, "");
    res = res.replace(/<br\s*\/?>/gi, "\n");
    res = res.replace(/>\s*\n\s*</g, "><");
    res = res.replace(/\n+/g, "<br><br>");
    return res.replace(/^\s+|\s+$/g, "");
}

function fqFallbackChapterHtml(raw, title, bookId, itemId, itemVersion, countMap, deviceId) {
    var html = String(raw || "");
    html = html.replace(/<\?xml[^>]*\?>/gi, "");
    html = html.replace(/<!DOCTYPE[^>]*>/gi, "");
    html = html.replace(/<head[\s\S]*?<\/head>/gi, "");
    html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<header[\s\S]*?<\/header>/gi, "");
    var h1 = html.match(/<(?:h1|h2|h3)\b[^>]*>([\s\S]*?)<\/(?:h1|h2|h3)>/i);
    if (!title && h1) title = h1[1].replace(/<[^>]+>/g, "");
    html = html.replace(/<(?:h1|h2|h3)\b[^>]*>[\s\S]*?<\/(?:h1|h2|h3)>/i, "");
    var bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) html = bodyMatch[1];
    html = fqDecorateChapterParagraphs(html, bookId, itemId, itemVersion, countMap, deviceId);
    return { html: html, title: String(title || "").replace(/<[^>]+>/g, "").replace(/^\s+|\s+$/g, "") };
}

function fqParseChapterHtml(raw, title, bookId, itemId, itemVersion, countMap, deviceId) {
    var html = String(raw || "");
    var sourceTitle = String(title || "");
    if (!html.replace(/\s+/g, "")) throw fqError("EMPTY", "Nội dung chương trống.");
    if (html.replace(/^\s+/, "").charAt(0) !== "<") {
        var asJson = fqParseJson(html);
        if (asJson && typeof asJson.content === "string") html = asJson.content;
    }
    var doc = null;
    try {
        doc = Html.parse(html.replace(/<\?xml[^>]*\?>/gi, "").replace(/<!DOCTYPE[^>]*>/gi, ""));
    } catch (e) {
        doc = null;
    }
    if (!doc) return fqFallbackChapterHtml(html, sourceTitle, bookId, itemId, itemVersion, countMap, deviceId);
    try {
        doc.select("style").remove();
        doc.select("script").remove();
        doc.select("link").remove();
        doc.select("div.pageBg").remove();
    } catch (e) {
        // Older jsoup builds may lack one of these selectors; the fallback still applies.
    }
    var heading = null;
    try {
        heading = doc.select("h1, h2, h3").first();
    } catch (e) {
        heading = null;
    }
    if (heading) {
        var headingText = heading.text();
        var cls = heading.attr("class") || "";
        if (!sourceTitle) sourceTitle = headingText;
        if (cls.indexOf("chapterTitle") >= 0 || fqNormalizeChapterText(headingText) === fqNormalizeChapterText(sourceTitle)) {
            heading.remove();
        }
    }
    var body = null;
    try {
        body = doc.select("body").first();
        if (!body) body = doc.select("html").first();
    } catch (e) {
        body = null;
    }
    if (body) html = body.html();

    html = fqDecorateChapterParagraphs(html, bookId, itemId, itemVersion, countMap, deviceId);
    if (!html) throw fqError("EMPTY", "Nội dung chương trống.");
    return {
        html: html,
        title: String(sourceTitle || "").replace(/<[^>]+>/g, "").replace(/^\s+|\s+$/g, "")
    };
}

function fqGetChapter(device, itemId, url) {
    var keyInfo = fqGetKey(device);
    var data;
    try {
        data = fqFetchChapterData(device, itemId);
    } catch (e) {
        if (e && e.code === "DEVICE_INVALID") {
            fqClearCachedKey();
            keyInfo = fqRegisterKey(device);
            fqSaveCachedKey(device, keyInfo);
            data = fqFetchChapterData(device, itemId);
        } else {
            throw e;
        }
    }
    if (data.key_version && String(data.key_version) !== String(keyInfo.keyver)) {
        keyInfo = fqRegisterKey(device);
        fqSaveCachedKey(device, keyInfo);
        data = fqFetchChapterData(device, itemId);
    }
    var plain;
    try {
        plain = fqDecryptChapterData(data, keyInfo.key);
    } catch (e) {
        keyInfo = fqRegisterKey(device);
        fqSaveCachedKey(device, keyInfo);
        data = fqFetchChapterData(device, itemId);
        plain = fqDecryptChapterData(data, keyInfo.key);
    }

    var novelData = data.novel_data || {};
    var bookId = String(novelData.book_id || fqExtractBookId(url) || "");
    var itemVersion = String(novelData.version !== undefined ? novelData.version : (data.item_version !== undefined ? data.item_version : ""));
    var deviceId = device && device.device_id ? String(device.device_id) : "";

    var countResult = fqFetchParagraphCommentCounts(device, itemId, itemVersion);
    if (!itemVersion && countResult.item_version) {
        itemVersion = countResult.item_version;
    }

    return fqParseChapterHtml(plain, data.title, bookId, itemId, itemVersion, countResult.data, deviceId);
}

function fqExtractItemId(url) {
    var text = String(url || "");
    var match = text.match(/[?&]item_id=(\d+)/);
    if (!match) match = text.match(/\/(\d+)(?:[?#]|$)/);
    if (!match) match = text.match(/(\d+)\s*$/);
    return match ? match[1] : "";
}

function fqErrorMessage(error) {
    if (error && error.message) return error.message;
    return String(error || "Lỗi không xác định");
}
