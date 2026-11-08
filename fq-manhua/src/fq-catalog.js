// Manga catalog from the public Fanqie app API: home feed, genres and landing pages.

function fqCatalogParam(input, key) {
    var match = String(input || "").match(new RegExp("[?&]" + key + "=([^&#]+)"));
    return match ? decodeURIComponent(match[1]) : "";
}

function fqCatalogWalk(node, visit, depth) {
    if (!node || typeof node !== "object" || depth > 12) return;
    visit(node);
    var keys = Object.keys(node);
    var i;
    for (i = 0; i < keys.length; i++) fqCatalogWalk(node[keys[i]], visit, depth + 1);
}

function fqComicRequest(device, path, extra) {
    var pairs = fqAppPairs(device).concat([["is_android_pad_screen", "0"]]);
    var key;
    for (key in extra || {}) pairs.push([key, extra[key]]);
    var url = FQ_API_BASE + path + "?" + fqBuildQuery(pairs);
    var json = fqApiFetchJson(url, "com.dragon.read");
    if (!json.data) throw fqError("API", "API manga không trả dữ liệu hợp lệ.");
    return json.data;
}

function fqComicMenu(category, gender, title, sub) {
    return {
        title: String(title || ""),
        input: JSON.stringify({
            mode: "comic",
            category: String(category),
            gender: String(gender || "2"),
            sub: String(sub || "")
        }),
        script: "gen.js"
    };
}

function fqComicGenres(device) {
    var data = fqComicRequest(device, "/reading/bookapi/new_category/front/v:version/", {
        source: "",
        distinct_style: "1",
        new_category_tab: "5"
    });
    var out = [];
    var seen = {};
    fqCatalogWalk(data.category_tab_data || data.categoryTabData, function (node) {
        var category = node.category_data || node.categoryData;
        if (!category || !category.name) return;
        var landing = category.category_landpage_url || category.categoryLandpageUrl;
        if (fqCatalogParam(landing, "genreType") !== "110") return;
        var id = fqCatalogParam(landing, "categoryId") || String(category.category_id || category.categoryId || "");
        var gender = fqCatalogParam(landing, "gender") || "2";
        var sub = fqCatalogParam(landing, "subCategoryIds");
        if (!/^\d+$/.test(id)) return;
        var item = fqComicMenu(id, gender, category.name, sub);
        if (seen[item.input]) return;
        seen[item.input] = true;
        out.push(item);
    }, 0);
    if (!out.length) throw fqError("EMPTY", "Nguồn chưa trả thể loại manga.");
    return out;
}

function fqComicBookItem(book) {
    var bookId = String(book.book_id || "");
    if (!/^\d{15,20}$/.test(bookId) || !book.book_name) return null;
    var description = [];
    if (book.author) description.push(String(book.author));
    if (book.category) description.push(String(book.category));
    if (book.creation_status !== undefined && book.creation_status !== null && String(book.creation_status) !== "") {
        description.push(String(book.creation_status) === "1" ? "连载中" : "已完结");
    }
    return {
        name: String(book.book_name),
        link: fqWebBase() + "/page/" + bookId,
        cover: String(book.thumb_url || book.detail_page_thumb_url || ""),
        description: description.join(" • "),
        host: fqWebBase()
    };
}

function fqComicItems(data, gender, genre) {
    var out = [];
    var seen = {};
    fqCatalogWalk(data, function (info) {
        var bookId = String(info.book_id || "");
        if (!/^\d{15,20}$/.test(bookId) || !info.book_name || seen[bookId]) return;
        var type = info.genre_type;
        if (type !== undefined && type !== null && String(type) !== "" && String(type) !== genre) return;
        if (gender && gender !== "2" && ["", String(gender), "2"].indexOf(String(info.gender || "")) < 0) return;
        var item = fqComicBookItem(info);
        if (!item) return;
        seen[bookId] = true;
        out.push(item);
    }, 0);
    return out;
}

function fqComicCursor(page, identity) {
    var text = String(page || "");
    if (!text || text === "1") return "0";
    var state = fqParseJson(text);
    if (!state || state.identity !== identity || !/^\d+$/.test(String(state.offset || ""))) {
        throw fqError("PAGE", "Danh sách đã đổi; hãy tải lại từ đầu.");
    }
    return String(state.offset);
}

function fqComicNext(data, offset, identity) {
    var end = data.next_offset === undefined ? data.offset : data.next_offset;
    var more = data.has_more === true || String(data.has_more) === "1";
    if (!more || !(Number(end) > Number(offset))) return "";
    return JSON.stringify({ identity: identity, offset: String(end) });
}

function fqComicTags(info) {
    var tags = info && info.category_schema;
    try {
        if (typeof tags === "string") tags = JSON.parse(tags);
    } catch (e) {
        tags = [];
    }
    if (!Array.isArray(tags)) return [];
    var out = [];
    var i;
    for (i = 0; i < tags.length; i++) {
        var tag = tags[i];
        if (!tag || !tag.name || !/^\d+$/.test(String(tag.category_id || ""))) continue;
        out.push(fqComicMenu(String(tag.category_id), fqCatalogParam(tag.schema, "gender") || "2", tag.name));
    }
    return out;
}
