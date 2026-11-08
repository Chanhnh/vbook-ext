load('config.js');
load('fq-sha512.js');
load('fflate.js');
load('fq-crypto.js');
load('fq-api.js');
load('fq-catalog.js');

function fqDetailComment(bookId) {
    return {
        title: "评论",
        input: "https://api5-normal-sinfonlinec.fqnovel.com/reading/ugc/novel_comment/book/v/?book_id=" +
            encodeURIComponent(String(bookId)) + "&aid=1967&count=10&offset={{page}}",
        script: "comment.js"
    };
}

function fqDetailTags(names, tagBook) {
    var menus = fqComicTags(tagBook || {});
    var byName = {};
    var i;
    for (i = 0; i < menus.length; i++) {
        if (!byName[menus[i].title]) byName[menus[i].title] = menus[i];
    }
    var out = [];
    var seen = {};
    for (i = 0; i < names.length; i++) {
        var name = String(names[i] || "").replace(/^\s+|\s+$/g, "");
        if (!name || seen[name]) continue;
        seen[name] = true;
        out.push(byName[name] || {
            title: name,
            input: name,
            script: "search.js"
        });
    }
    return out;
}

function fqDetailCategoryNames(page) {
    var names = [];
    var raw = page.categoryV2;
    var list = raw;
    if (typeof raw === "string") list = fqParseJson(raw);
    if (list && list.length) {
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i] && list[i].Name) names.push(String(list[i].Name));
        }
    }
    return names;
}

function fqDetailSplitTags(value) {
    var text = String(value || "");
    if (!text) return [];
    return text.split(",");
}

function fqDetailGenres(tagBook, tags) {
    var menus = fqComicTags(tagBook || {});
    if (menus.length) return menus;
    if (tags.length) return [{ title: "Cùng thể loại", input: tags[0].title, script: "search.js" }];
    return [];
}

function fqDetailResult(book, bookId, tagBook) {
    var tags = fqDetailTags(book.tagNames || [], tagBook);
    var meta = tagBook || {};
    var lines = [];
    if (book.chapterCount) lines.push("章节数: " + book.chapterCount);
    var score = book.score || meta.score || meta.final_score_v3 || "";
    if (score) lines.push("评分: " + score + "/10");
    var words = book.wordCount || meta.word_number || "";
    if (words) lines.push("字数: " + fqFormatNumber(words));
    if (book.readCount) lines.push("阅读: " + fqFormatNumber(book.readCount));
    var totalRead = book.totalRead || meta.read_count_all || "";
    if (totalRead) lines.push("总阅读: " + fqFormatNumber(totalRead));
    if (book.updateTime) lines.push("更新: " + fqFormatDate(book.updateTime));
    if (book.latestChapter) lines.push("最新章节: " + book.latestChapter);

    return {
        name: book.name,
        author: book.author || "",
        cover: book.cover || "",
        description: book.description || "",
        detail: lines.join("<br>"),
        url: fqWebBase() + "/page/" + bookId,
        type: "comic",
        format: "comic",
        ongoing: book.ongoing,
        locale: "zh-CN",
        tags: tags,
        genres: fqDetailGenres(tagBook, tags),
        suggests: [],
        comment: fqDetailComment(bookId)
    };
}

function fqDetailFromPage(page, bookId, tagBook) {
    var ongoing = String(page.creationStatus) === "1";
    if (page.creationStatus === undefined || page.creationStatus === null) {
        ongoing = String(page.status) !== "2";
    }
    return fqDetailResult({
        name: String(page.bookName || ""),
        author: String(page.author || ""),
        cover: String(page.thumbUrl || "").replace(/\\u002[fF]/g, "/"),
        description: String(page.abstract || ""),
        chapterCount: page.chapterTotal ? String(page.chapterTotal) : "",
        score: "",
        wordCount: page.wordNumber ? String(page.wordNumber) : "",
        readCount: page.readCount ? String(page.readCount) : "",
        updateTime: page.lastPublishTime ? String(page.lastPublishTime) : "",
        latestChapter: String(page.lastChapterTitle || ""),
        tagNames: fqDetailCategoryNames(page),
        ongoing: ongoing
    }, bookId, tagBook);
}

function fqDetailFromApi(book, bookId) {
    if (!fqIsComicBook(book)) {
        throw fqError("NOT_COMIC", "Liên kết này là truyện chữ, không phải truyện tranh.");
    }
    var ongoing = String(book.creation_status) === "1";
    if (book.creation_status === undefined || book.creation_status === null) {
        ongoing = String(book.status) !== "2";
    }
    var tagNames = fqDetailSplitTags(book.tags);
    if (book.category) tagNames.push(String(book.category));
    return fqDetailResult({
        name: String(book.book_name || ""),
        author: String(book.author || ""),
        cover: String(book.thumb_url || ""),
        description: String(book.abstract || ""),
        chapterCount: book.serial_count ? String(book.serial_count) : "",
        score: book.score ? String(book.score) : "",
        wordCount: book.word_number ? String(book.word_number) : "",
        readCount: book.read_count ? String(book.read_count) : "",
        totalRead: book.read_count_all ? String(book.read_count_all) : "",
        updateTime: book.last_publish_time ? String(book.last_publish_time) : "",
        latestChapter: String(book.last_chapter_title || ""),
        tagNames: tagNames,
        ongoing: ongoing
    }, bookId, book);
}

function execute(url) {
    var bookId = fqComicBookId(url);
    if (!bookId) return Response.error("Không tìm thấy book_id trong liên kết Fanqie.");

    // App API first: one request with score, word count and category_schema.
    try {
        var book = fqBookDetail(fqResolveDevice(), bookId);
        return Response.success(fqDetailFromApi(book, bookId));
    } catch (e) {
        if (e && e.code === "NOT_COMIC") return Response.error(fqErrorMessage(e));
    }

    var state = null;
    try {
        var pageUrl = fqWebBase() + "/page/" + bookId;
        var response = fetch(pageUrl, {
            headers: { "User-Agent": UserAgent.chrome() }
        });
        if (response.ok) state = fqParsePageState(response.text());
    } catch (e) {
        state = null;
    }

    var page = state && state.page ? state.page : null;
    if (page && page.bookName) {
        if (String(page.genre) === "0" && String(page.platform) === "2") {
            return Response.error("Liên kết này là truyện chữ, không phải truyện tranh.");
        }
        return Response.success(fqDetailFromPage(page, bookId, null));
    }
    return Response.error("Không lấy được thông tin truyện từ Fanqie.");
}
