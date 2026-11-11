load('config.js');
load('fq-crypto.js');
load('fq-api.js');

function fqIsArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
}

function fqTrimText(value) {
    if (value === undefined || value === null) return "";
    return String(value).replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
}

function fqNormalizeCoverUrl(url) {
    var raw = fqTrimText(url);
    if (!raw) return "";
    if (raw.indexOf("//") === 0) return "https:" + raw;
    if (raw.indexOf("http://") === 0) return "https://" + raw.substring(7);
    return raw;
}

function fqParseTabInput(input) {
    var raw = fqTrimText(input);
    if (!raw) return { tabType: "2", tabIndex: "0" };
    if (raw.charAt(0) === "{") {
        var obj = fqParseJson(raw);
        if (obj && typeof obj === "object") {
            return {
                tabType: obj.tab_type !== undefined && obj.tab_type !== null && String(obj.tab_type) !== "" ? String(obj.tab_type) : "2",
                tabIndex: obj.tab_index !== undefined && obj.tab_index !== null && String(obj.tab_index) !== "" ? String(obj.tab_index) : "0"
            };
        }
    }
    return { tabType: raw, tabIndex: "0" };
}

function fqParsePageState(page, tabInput) {
    var raw = fqTrimText(page);
    if (!raw || raw === "1" || raw === "0") {
        return {
            tabType: tabInput.tabType,
            tabIndex: tabInput.tabIndex,
            offset: "0",
            sessionId: "",
            seen: []
        };
    }
    var state = fqParseJson(raw);
    if (!state || typeof state !== "object" || !fqIsNumericId(state.offset)) {
        return null;
    }
    return {
        tabType: state.tabType ? String(state.tabType) : tabInput.tabType,
        tabIndex: state.tabIndex !== undefined && state.tabIndex !== null && String(state.tabIndex) !== "" ? String(state.tabIndex) : tabInput.tabIndex,
        offset: String(state.offset),
        sessionId: state.sessionId ? String(state.sessionId) : "",
        seen: fqIsArray(state.seen) ? state.seen : []
    };
}

function fqSelectBookmallTab(data, tabType) {
    var tabs = data && fqIsArray(data.tab_item) ? data.tab_item : [];
    var i;
    for (i = 0; i < tabs.length; i++) {
        if (tabs[i] && String(tabs[i].tab_type) === tabType) return tabs[i];
    }
    return tabs.length > 0 ? tabs[0] : null;
}

function fqIsNovelBook(book) {
    if (!book || typeof book !== "object") return false;
    if (!fqIsNumericId(book.book_id) || !fqTrimText(book.book_name)) return false;
    var g = String(book.genre !== undefined && book.genre !== null ? book.genre : "");
    var gt = String(book.genre_type !== undefined && book.genre_type !== null ? book.genre_type : "");
    var cbt = String(book.comic_book_type !== undefined && book.comic_book_type !== null ? book.comic_book_type : "");
    return g !== "1" && gt !== "110" && cbt !== "1" && g !== "205" && gt !== "205";
}

function fqExtractBooksRecursive(node, out) {
    if (!node || typeof node !== "object") return;
    if (fqIsArray(node)) {
        var i;
        for (i = 0; i < node.length; i++) {
            fqExtractBooksRecursive(node[i], out);
        }
        return;
    }
    if (fqIsNovelBook(node)) {
        out.push(node);
    }
    var key;
    for (key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key) && typeof node[key] === "object") {
            fqExtractBooksRecursive(node[key], out);
        }
    }
}

function fqMapRecommendBook(book) {
    var bookId = String(book.book_id);
    var cat = fqTrimText(book.category);
    var score = fqTrimText(book.score);
    var tagParts = [];
    if (cat) tagParts.push(cat);
    if (score && Number(score) > 0) tagParts.push(score + "分");
    return {
        name: fqTrimText(book.book_name),
        author: fqTrimText(book.author),
        link: config_host + "/page/" + bookId,
        cover: fqNormalizeCoverUrl(book.thumb_url || book.detail_page_thumb_url || ""),
        description: fqTrimText(book.abstract || book.book_abstract_v2 || book.author || ""),
        tag: tagParts.join(" · "),
        host: config_host
    };
}

function execute(input, page) {
    try {
        var device = fqResolveDevice();
        var tabInput = fqParseTabInput(input);
        var state = fqParsePageState(page, tabInput);
        if (!state) return Response.error("Tham số phân trang gợi ý không hợp lệ.");

        var seenMap = {};
        var seenList = [];
        var i;
        for (i = 0; i < state.seen.length; i++) {
            var oldId = String(state.seen[i]);
            if (oldId && !seenMap[oldId]) {
                seenMap[oldId] = true;
                seenList.push(oldId);
            }
        }

        var items = [];
        var curOffset = state.offset;
        var curSessionId = state.sessionId;
        var lastFetchedOffset = Number(curOffset);
        var nextOffset = NaN;
        var attempt;

        for (attempt = 0; attempt < 2; attempt++) {
            var data = fqFetchBookmallTab(device, state.tabType, curOffset, curSessionId, state.tabIndex);
            var selectedTab = fqSelectBookmallTab(data, state.tabType);
            if (!selectedTab) throw fqError("API", "API gợi ý Fanqie không trả về tab_item.");

            var rawBooks = [];
            fqExtractBooksRecursive(selectedTab.cell_data, rawBooks);
            for (i = 0; i < rawBooks.length; i++) {
                var book = rawBooks[i];
                var id = String(book.book_id);
                if (seenMap[id]) continue;
                seenMap[id] = true;
                seenList.push(id);
                items.push(fqMapRecommendBook(book));
            }

            lastFetchedOffset = Number(curOffset);
            nextOffset = Number(selectedTab.next_offset);
            if (selectedTab.session_id) curSessionId = String(selectedTab.session_id);

            if (items.length > 0) break;
            if (!isFinite(nextOffset) || nextOffset <= lastFetchedOffset) break;
            curOffset = String(nextOffset);
        }

        var next = "";
        if (items.length > 0 && isFinite(nextOffset) && nextOffset > lastFetchedOffset) {
            next = JSON.stringify({
                tabType: state.tabType,
                tabIndex: state.tabIndex,
                offset: String(nextOffset),
                sessionId: curSessionId,
                seen: seenList.slice(-120)
            });
        }

        return Response.success(items, next);
    } catch (e) {
        return Response.error(fqErrorMessage(e));
    }
}
