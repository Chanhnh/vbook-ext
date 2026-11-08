load('config.js');
load('crypto.js');
load('watch.js');

var danmakuColor = "#FFFFFF";
try {
    if (DANMAKU_COLOR) {
        var c = String(DANMAKU_COLOR).trim();
        if (c) {
            danmakuColor = c.charAt(0) === "#" ? c : ("#" + c);
        }
    }
} catch (e) {
}

function translateDanmakuVp(bullets) {
    if (!bullets || !bullets.length) return [];
    if (typeof Qt === "undefined" || !Qt.translate) return [];

    var vpBullets = [];
    var batchSize = 100;

    for (var i = 0; i < bullets.length; i += batchSize) {
        var chunk = bullets.slice(i, i + batchSize);
        var texts = [];
        for (var k = 0; k < chunk.length; k++) {
            texts.push(String(chunk[k].text || "").replace(/[\r\n]+/g, " ").trim());
        }

        var translatedLines = [];
        try {
            var res = Qt.translate(texts.join("\n"), "vp", { first_capitalize: true });
            if (res && res.translateText) {
                translatedLines = res.translateText.split("\n");
            }
        } catch (e) { }

        for (var j = 0; j < chunk.length; j++) {
            var original = chunk[j];
            var trans = (j < translatedLines.length && translatedLines[j]) ? translatedLines[j].trim() : original.text;
            vpBullets.push({
                timeMs: original.timeMs,
                time: original.time,
                text: trans || original.text,
                mode: original.mode,
                color: original.color
            });
        }
    }

    return vpBullets;
}

function fetchDanmakuData(videoId, durationMs) {
    if (!videoId) return { original: [], vp: [] };
    var key = "douyin.danmaku.v2." + videoId;
    var duration = Number(durationMs) || 0;
    if (duration < 0) duration = 0;

    try {
        var cached = cacheStorage.getItem(key);
        if (cached) {
            var saved = JSON.parse(String(cached));
            if (Date.now() - saved.time < 600000 && Array.isArray(saved.items)) {
                for (var i = 0; i < saved.items.length; i++) {
                    saved.items[i].color = danmakuColor;
                }
                var vp = Array.isArray(saved.itemsVp) ? saved.itemsVp : translateDanmakuVp(saved.items);
                for (var j = 0; j < vp.length; j++) {
                    vp[j].color = danmakuColor;
                }
                return { original: saved.items, vp: vp };
            }
        }
    } catch (e) { }

    var items = [];
    var seen = {};

    var windowSize = 32000;
    var maxSegments = 60;
    var totalSegments = duration > 0 ? Math.ceil(duration / windowSize) + 1 : maxSegments;
    if (totalSegments > maxSegments) totalSegments = maxSegments;
    var emptyStreak = 0;

    for (var n = 0; n < totalSegments; n++) {
        var startTime = n * windowSize;
        var endTime = (n + 1) * windowSize;
        var danmakuUrl = BASE_URL + "/aweme/v1/web/danmaku/get_v2/?device_platform=webapp&aid=6383&item_id=" + videoId + "&start_time=" + startTime + "&end_time=" + endTime;
        try {
            var response = fetch(danmakuUrl, {
                headers: {
                    "User-Agent": MOBILE_UA,
                    "Referer": BASE_URL + "/",
                    "Cookie": getCookie()
                },
                timeout: 6000
            });
            if (!response.ok) {
                if (n === 0) break;
                continue;
            }
            var json = response.json();
            if (json.status_code !== 0 && json.status_code !== undefined) break;

            var list = json.danmaku_list || [];
            if (list.length === 0) {
                // Không dừng ngay ở cửa sổ rỗng: video có thể không có bình luận ở giữa.
                emptyStreak++;
                if (duration <= 0 && emptyStreak >= 2) break;
                continue;
            }
            emptyStreak = 0;

            for (var i = 0; i < list.length; i++) {
                var d = list[i];
                if (!d || !d.text) continue;
                var id = String(d.danmaku_id || (d.offset_time + "_" + d.text));
                if (seen[id] || items.length >= 5000) continue;
                seen[id] = true;

                var offset = Number(d.offset_time) || 0;
                items.push({
                    timeMs: offset,
                    time: Number((offset / 1000).toFixed(2)),
                    text: String(d.text).trim(),
                    mode: "scroll",
                    color: danmakuColor
                });
            }
        } catch (e) {
            break;
        }
    }

    items.sort(function (a, b) {
        return a.timeMs - b.timeMs;
    });

    var itemsVp = translateDanmakuVp(items);

    try {
        if (items.length > 0) {
            cacheStorage.setItem(key, JSON.stringify({
                time: Date.now(),
                items: items,
                itemsVp: itemsVp
            }));
        }
    } catch (e) { }

    return { original: items, vp: itemsVp };
}

function execute(data) {
    if (!data) return Response.error("URL phát video rỗng");

    var playUrl = String(data || "").trim();
    if (playUrl.indexOf("/aweme/v1/play/") === -1) {
        return Response.error("Nguồn video Douyin không được hỗ trợ");
    }

    var idMatch = playUrl.match(/[?&]item_id=(\d+)/);
    var videoId = idMatch ? idMatch[1] : "";
    var uriMatch = playUrl.match(/[?&]video_id=([^&#]*)/);
    var videoUri = uriMatch ? decodeURIComponent(uriMatch[1]) : "";
    var durMatch = playUrl.match(/[?&]dy_duration=(\d+)/);
    var duration = durMatch ? parseInt(durMatch[1], 10) : 0;
    if (isNaN(duration)) duration = 0;
    var ratioMatch = playUrl.match(/[?&]ratio=([^&#]*)/);
    var ratio = ratioMatch ? decodeURIComponent(ratioMatch[1]) : "";
    if (ratio !== "540p" && ratio !== "720p" && ratio !== "1080p") ratio = "";

    // URL phát cuối cùng không cần tham số nội bộ dy_duration.
    if (videoUri && videoId) {
        playUrl = BASE_URL + "/aweme/v1/play/?video_id=" + encodeURIComponent(videoUri) + "&item_id=" + videoId;
        if (ratio) playUrl += "&ratio=" + encodeURIComponent(ratio);
    }
    if (!duration && videoId) {
        var item = fetchVideoInfo(videoId);
        if (item) duration = (item.video && item.video.duration) || item.duration || 0;
    }

    // vBook cũng gọi track cho video tải trước; công tắc chỉ ảnh hưởng lần gọi mới.
    reportWatchHistory(videoId);

    var result = fetchDanmakuData(videoId, duration);
    var danmaku = [];

    // Track 1: VP (Tiếng Việt) được ưu tiên ở vị trí số 1
    if (result.vp && result.vp.length) {
        danmaku.push({
            data: JSON.stringify(result.vp),
            type: "json",
            label: "VP (" + result.vp.length + ")"
        });
    }

    // Track 2: Gốc tiếng Trung
    if (result.original && result.original.length) {
        danmaku.push({
            data: JSON.stringify(result.original),
            type: "json",
            label: "Gốc (" + result.original.length + ")"
        });
    }

    return Response.success({
        type: "native",
        data: playUrl,
        host: BASE_URL,
        mimeType: "video/mp4",
        headers: {
            "User-Agent": MOBILE_UA,
            "Referer": BASE_URL + "/"
        },
        timeSkip: [],
        danmaku: danmaku
    });
}
