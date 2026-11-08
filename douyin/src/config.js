var BASE_URL = "https://www.douyin.com";
try {
    if (DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}
var MOBILE_UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
try {
    if (typeof UserAgent !== "undefined" && UserAgent.android) {
        MOBILE_UA = UserAgent.android() || MOBILE_UA;
    }
} catch (e) {
}

function rememberWatchAuthor(item) {
    if (!item || !item.aweme_id || !item.author || !item.author.uid) return;
    var authorId = String(item.author.uid);
    if (!/^\d+$/.test(authorId) || authorId === "0") return;
    try {
        cacheStorage.setItem("douyin.watch.author." + String(item.aweme_id), authorId);
    } catch (e) { }
}

function isDouyinSecUid(value) {
    return /^MS4wLj[A-Za-z0-9_-]+$/.test(String(value || ""));
}

function getSuggestionAuthorId(item, videoId) {
    var author = item && item.author ? item.author : {};
    var secUid = String(author.sec_uid || "").trim();
    if (isDouyinSecUid(secUid)) return secUid;
    var uid = String(author.uid || "").trim();
    if (/^[1-9]\d*$/.test(uid)) return uid;
    try {
        uid = String(cacheStorage.getItem("douyin.watch.author." + videoId) || "");
        if (/^[1-9]\d*$/.test(uid)) return uid;
    } catch (e) { }
    return "";
}

function fetchVideoInfo(videoId) {
    if (!videoId) return null;

    var shareUrl = "https://www.iesdouyin.com/share/video/" + videoId + "/";
    try {
        var res = fetch(shareUrl, {
            headers: {
                "User-Agent": MOBILE_UA,
                "Cookie": getCookie()
            },
            timeout: 30000
        });
        if (!res.ok) return null;

        var html = res.text();
        var match = html.match(/window\._ROUTER_DATA\s*=\s*([\s\S]*?);?\s*<\/script>/);
        if (!match) return null;

        var json = JSON.parse(match[1]);
        var loader = json.loaderData || {};
        for (var key in loader) {
            var page = loader[key];
            if (!page || !page.videoInfoRes) continue;
            var items = page.videoInfoRes.item_list || [];
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item && String(item.aweme_id || "") === String(videoId)) {
                    rememberWatchAuthor(item);
                    return item;
                }
            }
            if (items.length > 0 && items[0]) {
                rememberWatchAuthor(items[0]);
                return items[0];
            }
        }
    } catch (e) {
    }
    return null;
}

// Link rút gọn v.douyin.com không chứa ID số; phải theo redirect để lấy URL cuối.
function resolveShortLink(url) {
    try {
        var res = fetch(url, {
            headers: { "User-Agent": MOBILE_UA },
            timeout: 20000
        });
        var finalUrl = String(res.url || "");
        var match = finalUrl.match(/(\d{15,22})/);
        if (match) return match[1];

        if (res.ok) {
            var body = res.text();
            match = body.match(/"(?:aweme_id|item_id|awemeId)"\s*:\s*"?(\d{15,22})"?/);
            if (match) return match[1];
            match = body.match(/\/video\/(\d{15,22})/);
            if (match) return match[1];
        }
    } catch (e) {
    }
    return "";
}

function resolveVideoId(input) {
    var text = String(input || "").trim();
    var match = text.match(/(\d{15,22})/);
    if (match) return match[1];
    if (/v\.douyin\.com\//i.test(text)) return resolveShortLink(text);
    return "";
}

function getDesktopUA() {
    var ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    try {
        if (typeof UserAgent !== "undefined" && UserAgent.chrome) {
            ua = UserAgent.chrome() || ua;
        }
    } catch (e) {
    }
    return ua;
}

// Link feed có sẵn mix_id khi video thuộc một mix/series.
function getMixIdFromUrl(url) {
    var text = String(url || "");
    var match = text.match(/[?&](?:mix_id|mixId|series_id)=(\d+)/);
    return match ? match[1] : "";
}

function parseCookie(cookie) {
    var result = {};
    var parts = String(cookie || "").split(";");
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i].replace(/^\s+|\s+$/g, "");
        if (!part) continue;
        var at = part.indexOf("=");
        if (at <= 0) continue;
        result[part.substring(0, at)] = part.substring(at + 1);
    }
    return result;
}

// API detail cần uifid và verifyFp lấy từ cookie hiện tại; không hardcode token.
function fetchMixInfoFromDetail(videoId) {
    if (!videoId) return null;

    var cookie = getCookie();
    var cookies = parseCookie(cookie);
    var uifid = cookies.UIFID || cookies.UIFID_TEMP || "";
    var verifyFp = cookies.s_v_web_id || cookies.verifyFp || "";
    if (!uifid || !verifyFp) return null;

    var url = BASE_URL + "/aweme/v1/web/aweme/detail/?" +
        "aweme_id=" + encodeURIComponent(String(videoId)) +
        "&uifid=" + encodeURIComponent(uifid) +
        "&verifyFp=" + encodeURIComponent(verifyFp) +
        "&fp=" + encodeURIComponent(verifyFp) +
        "&device_platform=webapp&aid=6383&channel=channel_pc_web";

    try {
        var res = fetch(url, {
            headers: {
                "User-Agent": getDesktopUA(),
                "Referer": BASE_URL + "/video/" + videoId,
                "Accept": "application/json, text/plain, */*",
                "Cookie": cookie,
                "x-tt-argus": "1",
                "uifid": uifid
            },
            timeout: 30000
        });
        if (!res.ok) return null;

        var json = res.json();
        if (json.status_code !== undefined && String(json.status_code) !== "0") return null;
        var detail = json.aweme_detail;
        if (!detail) return null;
        rememberWatchAuthor(detail);

        var mixId = "";
        if (detail.mix_info && detail.mix_info.mix_id) {
            mixId = String(detail.mix_info.mix_id);
        } else if (detail.series_info && detail.series_info.series_id) {
            mixId = String(detail.series_info.series_id);
        } else if (detail.series_basic_info && detail.series_basic_info.series_id) {
            mixId = String(detail.series_basic_info.series_id);
        }
        return { mixId: mixId };
    } catch (e) {
        return null;
    }
}

// modal_id chính là video ID; chỉ dùng mix/series ID thật do API detail trả về.
function resolveMixId(url, videoId) {
    var mixId = getMixIdFromUrl(url);
    if (mixId) return mixId;
    if (!videoId) return "";

    var detail = fetchMixInfoFromDetail(videoId);
    return detail ? (detail.mixId || "") : "";
}

function formatCount(num) {
    if (!num || isNaN(num) || Number(num) <= 0) return "";
    var value = Number(num);
    if (value >= 10000) {
        return (value / 10000).toFixed(1).replace(/\.0$/, "") + " vạn";
    }
    return value.toString();
}

function formatDuration(value) {
    if (!value || isNaN(value) || Number(value) <= 0) return "";
    var duration = Number(value);
    var totalSeconds = Math.round(duration >= 1000 ? duration / 1000 : duration);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    var secondText = (seconds < 10 ? "0" : "") + seconds;
    var minuteText = (minutes < 10 ? "0" : "") + minutes;
    if (hours > 0) return hours + ":" + minuteText + ":" + secondText;
    return minuteText + ":" + secondText;
}

function formatTime(timestamp) {
    if (!timestamp || isNaN(timestamp) || Number(timestamp) <= 0) return "";
    var now = Math.floor(Date.now() / 1000);
    var diff = now - Number(timestamp);
    if (diff > 0 && diff < 60) return "Vừa xong";
    if (diff >= 60 && diff < 3600) return Math.floor(diff / 60) + " phút trước";
    if (diff >= 3600 && diff < 86400) return Math.floor(diff / 3600) + " giờ trước";
    if (diff >= 86400 && diff < 2592000) return Math.floor(diff / 86400) + " ngày trước";

    var date = new Date(Number(timestamp) * 1000);
    if (isNaN(date.getTime())) return "";
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return (day < 10 ? "0" : "") + day + "-" + (month < 10 ? "0" : "") + month + "-" + year;
}

// Map một item feed (tab feed hoặc share page) sang item danh sách.
function buildVideoResult(item, fallbackId) {
    if (!item) return null;
    rememberWatchAuthor(item);
    var id = item.aweme_id ? String(item.aweme_id) : String(fallbackId || "");
    if (!id) return null;

    var video = item.video || {};
    var title = item.desc ? String(item.desc).trim() : "Douyin Video " + id;
    var author = item.author && item.author.nickname ? String(item.author.nickname) : "Douyin";
    var cover = "";
    if (video.cover && video.cover.url_list && video.cover.url_list.length > 0) {
        cover = video.cover.url_list[0];
    } else if (video.origin_cover && video.origin_cover.url_list && video.origin_cover.url_list.length > 0) {
        cover = video.origin_cover.url_list[0];
    }

    var uri = video.play_addr && video.play_addr.uri ? video.play_addr.uri : "";
    var duration = video.duration || item.duration || 0;
    var link = BASE_URL + "/video/" + id;
    if (uri) link += "?uri=" + encodeURIComponent(uri);
    if (duration) link += (uri ? "&" : "?") + "dy_duration=" + duration;

    var mixId = "";
    if (item.mix_info && item.mix_info.mix_id) {
        mixId = String(item.mix_info.mix_id);
    } else if (item.series_basic_info && item.series_basic_info.series_id) {
        mixId = String(item.series_basic_info.series_id);
    } else if (item.series_info && item.series_info.series_id) {
        mixId = String(item.series_info.series_id);
    }
    if (mixId) link += (link.indexOf("?") >= 0 ? "&" : "?") + "mix_id=" + encodeURIComponent(mixId);

    var statistics = item.statistics || {};
    var tags = [];
    if (duration) tags.push(formatDuration(duration));
    if (statistics.digg_count) tags.push(formatCount(statistics.digg_count) + " ❤️");
    if (statistics.comment_count) tags.push(formatCount(statistics.comment_count) + " 💬");
    if (item.create_time) tags.push(formatTime(item.create_time));

    var result = {
        name: author,
        link: link,
        description: title,
        type: "short",
    };
    if (cover) result.cover = cover;
    if (tags.length > 0) result.tag = tags.join(" · ");
    return result;
}

function getTtwid() {
    try {
        var res = fetch("https://ttwid.bytedance.com/ttwid/union/register/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": MOBILE_UA
            },
            body: JSON.stringify({
                region: "cn",
                aid: 1768,
                needFid: "0",
                service: "www.ixigua.com",
                migrate_info: { ticket: "", source: "node" },
                cbUrlProtocol: "https",
                union: true
            }),
            timeout: 15000
        });
        if (!res.ok) return "";
        var setCookie = res.header("set-cookie") || "";
        var match = setCookie.match(/ttwid=([^;]+)/i);
        return match ? match[1] : "";
    } catch (e) {
        return "";
    }
}

function getCookie() {
    var cookie = "";
    try {
        if (typeof localCookie !== "undefined") {
            cookie = String(localCookie.getCookie() || "").trim();
        }
    } catch (e) {
        cookie = "";
    }

    if (!/(^|;\s*)ttwid=/i.test(cookie)) {
        var ttwid = getTtwid();
        if (ttwid) cookie = (cookie ? cookie + "; " : "") + "ttwid=" + ttwid;
    }
    return cookie;
}


