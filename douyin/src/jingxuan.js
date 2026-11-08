load('config.js');

// Result riêng cho 精选: mở detail, không dùng type "short".
function buildJingxuanResult(item) {
    if (!item) return null;
    rememberWatchAuthor(item);
    var id = item.aweme_id ? String(item.aweme_id) : "";
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
        name: title,
        link: link,
        description: author
    };
    if (cover) result.cover = cover;
    if (tags.length > 0) result.tag = tags.join(" · ");
    return result;
}

// Tab "精选" dùng module feed của Douyin.
// tag_id rỗng = tab 全部 (feed chung); tag_id số = kênh phân loại của trang /jingxuan (xem genre.js).
// use_lite_type=0 trả JSON; use_lite_type=2 trả protobuf (không đọc được trực tiếp).
function fetchJingxuanBatch(refreshIndex, tagId) {
    var index = parseInt(refreshIndex, 10);
    if (isNaN(index) || index < 1) index = 1;

    var url = BASE_URL + "/aweme/v2/web/module/feed/?" +
        "device_platform=webapp&aid=6383&channel=channel_pc_web" +
        "&module_id=3003101&count=20&filterGids=&presented_ids=" +
        "&refresh_index=" + index +
        "&refer_id=&refer_type=10&pull_type=0&use_lite_type=0&tag_id=" +
        encodeURIComponent(String(tagId || ""));

    try {
        var res = fetch(url, {
            method: "POST",
            headers: {
                "User-Agent": MOBILE_UA,
                "Referer": BASE_URL + "/jingxuan",
                "Accept": "application/json, text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "Cookie": getCookie()
            },
            body: "",
            timeout: 30000
        });
        if (!res.ok) return { items: [], hasMore: false };

        var json = res.json();
        var list = json.aweme_list || [];
        var items = [];
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            // Bỏ card livestream (không có video) và các item không phát được.
            if (!item || item.aweme_type === 101 || !item.video) continue;
            var result = buildJingxuanResult(item);
            if (result) items.push(result);
        }
        return { items: items, hasMore: !!json.has_more };
    } catch (e) {
        return { items: [], hasMore: false };
    }
}

function execute(query, page) {
    var pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

    // Input số từ genre.js là tag_id kênh; "jingxuan"/rỗng từ home.js là feed chung.
    var tagId = "";
    var text = String(query || "").trim();
    if (/^\d+$/.test(text)) tagId = text;

    var batch = fetchJingxuanBatch(pageNum, tagId);
    var nextPage = batch.hasMore && batch.items.length > 0 ? String(pageNum + 1) : "";
    return Response.success(batch.items, nextPage);
}
