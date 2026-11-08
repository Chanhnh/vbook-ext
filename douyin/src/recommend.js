load('config.js');

// Feed Đề xuất dùng tham số Android khi xem dọc, web khi xem ngang.
var FEED_PARAMS = "device_platform=android&aid=1128&channel=bytedance";
try {
    if (ORIENTATION === "Ngang") {
        FEED_PARAMS = "device_platform=webapp&aid=6383&channel=channel_pc_web";
    }
} catch (e) {
}

function fetchFeedBatch(refreshIndex) {
    var index = parseInt(refreshIndex, 10);
    if (isNaN(index) || index < 1) index = 1;
    var url = BASE_URL + "/aweme/v1/web/tab/feed/?" + FEED_PARAMS + "&count=10&refresh_index=" + index;
    try {
        var res = fetch(url, {
            headers: {
                "User-Agent": MOBILE_UA,
                "Referer": BASE_URL + "/",
                "Cookie": getCookie()
            },
            timeout: 30000
        });
        if (!res.ok) return [];
        var json = res.json();
        return json.aweme_list || [];
    } catch (e) {
        return [];
    }
}

function execute(query, page) {
    var pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

    var feedList = fetchFeedBatch(pageNum);
    var items = [];
    for (var i = 0; i < feedList.length; i++) {
        var result = buildVideoResult(feedList[i]);
        if (result) items.push(result);
    }

    var nextPage = items.length > 0 ? String(pageNum + 1) : "";
    return Response.success(items, nextPage);
}
