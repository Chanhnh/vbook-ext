load('config.js');

var SERIES_PAGE_SIZE = 12;
var SERIES_MAX_PAGES = 80;

function fetchSeriesBatch(seriesId, cursor, videoId) {
    var url = BASE_URL + "/aweme/v1/web/series/aweme/?" +
        "device_platform=webapp&aid=6383&channel=channel_pc_web" +
        "&series_id=" + encodeURIComponent(seriesId) +
        "&pull_type=2&cursor=" + encodeURIComponent(String(cursor)) +
        "&source=playlet_homepage_hot&count=" + SERIES_PAGE_SIZE;
    var referer = videoId ? (BASE_URL + "/jingxuan/acg?modal_id=" + videoId) : (BASE_URL + "/jingxuan/acg");

    try {
        var res = fetch(url, {
            headers: {
                "User-Agent": MOBILE_UA,
                "Referer": referer,
                "Accept": "application/json, text/plain, */*",
                "Cookie": getCookie()
            },
            timeout: 30000
        });
        if (!res.ok) return null;

        var json = res.json();
        if (json.status_code !== undefined && json.status_code !== 0) return null;
        return json;
    } catch (e) {
        return null;
    }
}

function buildEpisodeUrl(item, seriesId) {
    rememberWatchAuthor(item);
    var id = item && item.aweme_id ? String(item.aweme_id) : "";
    if (!id) return "";

    var video = item.video || {};
    var uri = video.play_addr && video.play_addr.uri ? video.play_addr.uri : "";
    var duration = video.duration || item.duration || 0;

    var link = BASE_URL + "/video/" + id;
    if (uri) link += "?uri=" + encodeURIComponent(uri);
    if (duration) link += (uri ? "&" : "?") + "dy_duration=" + duration;
    if (seriesId) link += (link.indexOf("?") >= 0 ? "&" : "?") + "mix_id=" + encodeURIComponent(seriesId);
    return link;
}

function buildChapter(item, fallbackIndex, seriesId) {
    var link = buildEpisodeUrl(item, seriesId);
    if (!link) return null;

    var index = 0;
    if (item.series_play_info && item.series_play_info.series_aweme_index) {
        index = parseInt(item.series_play_info.series_aweme_index, 10);
    }
    if (isNaN(index) || index < 1) index = fallbackIndex;

    var chapter = {
        name: String(item.desc || "").trim() || "Tập " + index,
        url: link,
        lock: false,
        pay: false
    };
    if (item.desc) chapter.description = String(item.desc).trim();
    return chapter;
}

function fetchChapters(seriesId, videoId) {
    var chapters = [];
    var seen = {};
    var cursor = 0;
    var pages = 0;

    while (pages < SERIES_MAX_PAGES) {
        var json = fetchSeriesBatch(seriesId, cursor, videoId);
        if (!json) break;

        var list = json.aweme_list || [];
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (!item) continue;

            var id = item.aweme_id ? String(item.aweme_id) : "";
            if (!id || seen[id]) continue;
            seen[id] = true;

            var chapter = buildChapter(item, chapters.length + 1, seriesId);
            if (chapter) chapters.push(chapter);
        }

        if (!json.has_more) break;
        var next = parseInt(json.max_cursor, 10);
        if (isNaN(next) || next <= cursor) break;
        cursor = next;
        pages++;
    }

    return chapters;
}

function execute(url) {
    if (!url) return Response.error("URL video không hợp lệ");

    var videoId = resolveVideoId(url);
    // TOC chỉ chạy khi URL đã có mix_id/series_id thật.
    var seriesId = getMixIdFromUrl(url);
    if (seriesId) {
        var chapters = fetchChapters(seriesId, videoId);
        if (chapters.length > 0) return Response.success(chapters);
    }

    return Response.success([
        { name: "Xem video", url: url, lock: false, pay: false }
    ]);
}
