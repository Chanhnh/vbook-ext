function danmakuColor(value) {
    value = String(value || "").trim().replace(/^#/, "");
    return /^[0-9a-f]{6}$/i.test(value) ? parseInt(value, 16) : 16777215;
}

function configuredDanmakuColor() {
    let value = "#FFFFFF";
    try {
        if (DANMAKU_COLOR) value = String(DANMAKU_COLOR);
    } catch (error) {
    }
    return danmakuColor(value);
}

function danmakuEscape(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function parseDanmaku(xml, cid, color) {
    xml = String(xml || "");
    if (!/<\/i>\s*$/.test(xml) || (xml.match(/<d\b[^>]*>/g) || []).length !== (xml.match(/<\/d>/g) || []).length) {
        throw new Error("XML danmaku bị thiếu hoặc cắt giữa chừng.");
    }
    let doc = Html.parse(xml);
    if (doc.select("i").isEmpty() || String(doc.select("chatid").text()).trim() !== String(cid)) {
        throw new Error("Danmaku không khớp CID hoặc XML không hợp lệ.");
    }
    let comments = [];
    if (doc.select("d").size() !== doc.select("d[p]").size()) throw new Error("Bình luận thiếu metadata.");
    doc.select("d[p]").forEach(function (element) {
        let fields = String(element.attr("p")).split(",");
        let time = Number(fields[0]);
        if (fields.length < 4 || fields[0] === "" || !isFinite(time) || time < 0) {
            throw new Error("Metadata bình luận không hợp lệ.");
        }
        fields[3] = String(color);
        // Decode entities individually so jsoup does not collapse payload whitespace.
        let text = String(element.html()).replace(/&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]+);/gi, function (entity) {
            return String(Html.parse("<span>" + entity + "</span>").text());
        });
        comments.push({ p: fields.join(","), time: time, text: text });
    });
    return comments;
}

function danmakuXml(comments, cid) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?><i><chatid>' + danmakuEscape(cid) + '</chatid>';
    for (let i = 0; i < comments.length; i++) {
        xml += '<d p="' + danmakuEscape(comments[i].p) + '">' + danmakuEscape(comments[i].text) + '</d>';
    }
    return xml + '</i>';
}

function sampleDanmaku(comments, limit) {
    let ordered = comments.slice();
    ordered.sort(function (a, b) { return a.time - b.time; });
    if (ordered.length <= limit) return ordered;
    let sampled = [];
    for (let i = 0; i < limit; i++) {
        sampled.push(ordered[Math.round(i * (ordered.length - 1) / (limit - 1))]);
    }
    return sampled;
}

function translateDanmaku(comments, deadline, translator) {
    let translated = [];
    for (let i = 0; i < comments.length; i++) {
        translated.push({ p: comments[i].p, time: comments[i].time, text: comments[i].text });
    }
    let count = 0;
    let offset = 0;
    while (offset < translated.length && Date.now() < deadline) {
        let indexes = [];
        let texts = [];
        let characters = 0;
        while (offset < translated.length && texts.length < 100) {
            if (Number(translated[offset].p.split(",")[1]) >= 7) {
                offset++;
                continue;
            }
            let text = translated[offset].text.replace(/[\r\n]+/g, " ").trim();
            if (!text || text.length > 8000) {
                offset++;
                continue;
            }
            if (characters + text.length + (texts.length ? 1 : 0) > 8000) break;
            indexes.push(offset);
            texts.push(text);
            characters += text.length + (texts.length > 1 ? 1 : 0);
            offset++;
        }
        if (!texts.length) continue;
        if (Date.now() >= deadline) break;
        try {
            let result = translator(texts.join("\n"));
            if (!result || result.translateText === null || result.translateText === undefined) continue;
            let lines = String(result.translateText).replace(/\r\n?/g, "\n").split("\n");
            if (lines.length !== texts.length) continue;
            for (let i = 0; i < lines.length; i++) {
                let text = lines[i].trim();
                if (!text || text === texts[i]) continue;
                translated[indexes[i]].text = text;
                count++;
            }
        } catch (error) {
        }
    }
    return { comments: translated, count: count };
}

function fetchDanmaku(bvid, cid, part) {
    let url = "https://comment.bilibili.com/" + cid + ".xml";
    let fallback = [{ data: url, type: "bilibili", label: "Gốc" }];
    let deadline = Date.now() + 8000;
    try {
        let response = fetch(url, { headers: requestHeaders(videoUrl(bvid, part)), timeout: 5000 });
        if (!response || !response.ok) throw new Error("Không tải được XML danmaku.");
        let comments = parseDanmaku(response.text(), cid, configuredDanmakuColor());
        let sources = [{ data: danmakuXml(comments, cid), type: "bilibili", label: "Gốc" }];
        if (!comments.length || typeof Qt === "undefined" || !Qt.translate) return sources;
        let sampled = sampleDanmaku(comments, 2000);
        let result = translateDanmaku(sampled, deadline, function (text) {
            return Qt.translate(text, "vp", { first_capitalize: true });
        });
        if (result.count > 0) sources.unshift({ data: danmakuXml(result.comments, cid), type: "bilibili", label: "VP" });
        if (result.count < sampled.length) console.log("Danmaku VP: dịch được " + result.count + "/" + sampled.length + " bình luận.");
        return sources;
    } catch (error) {
        console.log("Không xử lý được danmaku; giữ nguồn gốc, chưa áp dụng màu tùy chọn.");
        return fallback;
    }
}
