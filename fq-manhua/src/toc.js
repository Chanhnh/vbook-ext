load('config.js');
load('fq-sha512.js');
load('fflate.js');
load('fq-crypto.js');
load('fq-api.js');

function fqTocChapterUrl(itemId) {
    return fqWebBase() + "/reader/" + String(itemId);
}

function fqTocFromPage(page, bookId) {
    var groups = page && page.chapterListWithVolume ? page.chapterListWithVolume : [];
    var out = [];
    var addSections = groups.length > 1;
    var i;
    var j;
    for (i = 0; i < groups.length; i++) {
        var group = groups[i] || [];
        var volume = "";
        if (group.length && group[0].volume_name) volume = String(group[0].volume_name);
        if (addSections && volume) {
            out.push({
                name: volume,
                url: fqWebBase() + "/page/" + String(bookId),
                type: "section"
            });
        }
        for (j = 0; j < group.length; j++) {
            var chapter = group[j] || {};
            var itemId = String(chapter.itemId || "");
            if (!itemId) continue;
            var needPay = parseInt(chapter.needPay, 10);
            out.push({
                name: String(chapter.title || ""),
                url: fqTocChapterUrl(itemId),
                description: volume,
                lock: false,
                pay: needPay > 0,
                host: fqWebBase()
            });
        }
    }
    return out;
}

function fqTocFromApi(list, bookId) {
    var out = [];
    var lastVolume = null;
    var volumes = {};
    var volumeCount = 0;
    var i;
    for (i = 0; i < list.length; i++) {
        var chapter = list[i] || {};
        var volume = String(chapter.volume_name || "");
        if (volume && !volumes[volume]) {
            volumes[volume] = true;
            volumeCount++;
        }
    }
    var addSections = volumeCount > 1;
    for (i = 0; i < list.length; i++) {
        var chapter = list[i] || {};
        var itemId = String(chapter.item_id || "");
        if (!itemId) continue;
        var volume = String(chapter.volume_name || "");
        if (addSections && volume && volume !== lastVolume) {
            out.push({
                name: volume,
                url: fqWebBase() + "/page/" + String(bookId),
                type: "section"
            });
            lastVolume = volume;
        }
        out.push({
            name: String(chapter.title || ""),
            url: fqTocChapterUrl(itemId),
            description: volume,
            lock: false,
            pay: false,
            host: fqWebBase()
        });
    }
    return out;
}

function fqTocFromHtml(doc, bookId) {
    var out = [];
    var links = doc.select(".page-directory-content a.chapter-item-title");
    var i;
    for (i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var href = String(el.attr("href") || "");
        var match = href.match(/\/reader\/(\d+)/);
        if (!match) continue;
        out.push({
            name: String(el.text() || ""),
            url: fqTocChapterUrl(match[1]),
            description: "",
            lock: false,
            pay: false,
            host: fqWebBase()
        });
    }
    return out;
}

function execute(url) {
    var bookId = fqComicBookId(url);
    if (!bookId) return Response.error("Không tìm thấy book_id trong liên kết Fanqie.");

    try {
        var pageUrl = fqWebBase() + "/page/" + bookId;
        var response = fetch(pageUrl, {
            headers: { "User-Agent": UserAgent.chrome() }
        });
        if (response.ok) {
            var state = fqParsePageState(response.text());
            var page = state && state.page ? state.page : null;
            var chapters = page ? fqTocFromPage(page, bookId) : [];
            if (!chapters.length) chapters = fqTocFromHtml(response.html(), bookId);
            if (chapters.length) return Response.success(chapters);
        }
    } catch (e) {
        // Fall back to the app API below.
    }

    try {
        var device = fqResolveDevice();
        var list = fqBookDirectory(device, bookId);
        var apiChapters = fqTocFromApi(list, bookId);
        if (!apiChapters.length) return Response.error("Fanqie không trả về danh sách chương.");
        return Response.success(apiChapters);
    } catch (e) {
        return Response.error(fqErrorMessage(e));
    }
}
