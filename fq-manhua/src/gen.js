load('config.js');
load('fq-sha512.js');
load('fflate.js');
load('fq-crypto.js');
load('fq-api.js');
load('fq-catalog.js');

function fqComicFeed(device) {
    var data = fqComicRequest(device, "/reading/bookapi/bookmall/tab/v", {
        tab_type: "9",
        offset: "0",
        client_template: "0"
    });
    // This endpoint returns a fixed recommendation pool, so it has no next page.
    return fqComicItems(data.tab_item || [], null, "110");
}

function fqComicLanding(device, opt, page) {
    var category = String(opt.category || "");
    var gender = String(opt.gender || "2");
    var sub = String(opt.sub || "");
    if (!/^\d+$/.test(category)) throw fqError("CATEGORY", "Thể loại manga không hợp lệ; hãy tải lại thể loại.");
    if (["0", "1", "2"].indexOf(gender) < 0) throw fqError("GENDER", "Giới tính thể loại không hợp lệ; hãy tải lại thể loại.");
    if (sub && !/^\d+(,\d+)*$/.test(sub)) throw fqError("SUB", "Thể loại con không hợp lệ; hãy tải lại thể loại.");

    var identity = JSON.stringify([category, gender, sub]);
    var offset = fqComicCursor(page, identity);
    var items = [];
    var next = "";
    var attempts = 0;
    do {
        var extra = {
            category_id: category,
            query_gender: gender,
            genre_type: "110",
            offset: offset,
            limit: "10",
            source: "front_category",
            client_req_type: offset === "0" ? "3" : "2"
        };
        if (sub) extra.sub_category_ids = sub;
        var data = fqComicRequest(device, "/reading/bookapi/new_category/landing/v", extra);
        items = fqComicItems(data, gender, "110");
        next = fqComicNext(data, offset, identity);
        var state = next ? fqParseJson(next) : null;
        if (state) offset = String(state.offset);
    } while (!items.length && next && ++attempts < 3);
    return { items: items, next: next };
}

function execute(input, page) {
    var opt;
    try {
        opt = JSON.parse(String(input || "{}"));
    } catch (e) {
        return Response.error("Dữ liệu thể loại không hợp lệ.");
    }
    var device;
    try {
        device = fqResolveDevice();
    } catch (e) {
        return Response.error(fqErrorMessage(e));
    }
    try {
        if (opt.feed) return Response.success(fqComicFeed(device), "");
        var result = fqComicLanding(device, opt, page);
        return Response.success(result.items, result.next);
    } catch (e) {
        return Response.error(fqErrorMessage(e));
    }
}
