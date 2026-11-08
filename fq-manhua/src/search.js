load('config.js');
load('fq-sha512.js');
load('fflate.js');
load('fq-crypto.js');
load('fq-api.js');

function fqSearchPageState(page) {
    var text = String(page || "");
    if (!text) return { offset: 0, passback: "0" };
    var parts = text.split(":");
    if (parts.length >= 2) {
        var offset = parseInt(parts[0], 10);
        var passback = parts.slice(1).join(":");
        return {
            offset: offset > 0 ? offset : 0,
            passback: passback || "0"
        };
    }
    var number = parseInt(text, 10);
    if (number > 0) return { offset: number, passback: String(number) };
    return { offset: 0, passback: "0" };
}

function fqSearchNext(tab, offset) {
    if (!tab || !tab.has_more) return "";
    var next = parseInt(tab.next_offset, 10);
    if (!(next > offset)) return "";
    return String(next) + ":" + String(tab.passback || next);
}

function execute(query, page) {
    var device;
    try {
        device = fqResolveDevice();
    } catch (e) {
        return Response.error(fqErrorMessage(e));
    }

    var state = fqSearchPageState(page);
    var tab = null;
    var items = [];
    var attempts = 0;
    while (attempts < 3) {
        try {
            tab = fqSearchComics(device, query || "", state.offset, state.passback, 10);
        } catch (e) {
            return Response.error(fqErrorMessage(e));
        }
        items = fqSearchComicItems(tab);
        if (items.length) break;
        var next = parseInt(tab.next_offset, 10);
        if (!tab.has_more || !(next > state.offset)) {
            tab = null;
            break;
        }
        state.offset = next;
        state.passback = String(tab.passback || next);
        attempts++;
    }

    if (!items.length) return Response.success([], "");
    return Response.success(items, fqSearchNext(tab, state.offset));
}
