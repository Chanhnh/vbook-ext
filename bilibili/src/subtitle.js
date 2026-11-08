function subtitleTimestamp(milliseconds) {
    let hours = Math.floor(milliseconds / 3600000);
    let minutes = Math.floor(milliseconds / 60000) % 60;
    let seconds = Math.floor(milliseconds / 1000) % 60;
    let fraction = milliseconds % 1000;
    return (hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" +
        (seconds < 10 ? "0" : "") + seconds + "." + ("00" + fraction).slice(-3);
}

function subtitleVtt(json) {
    if (!json || !Array.isArray(json.body)) throw new Error("Dữ liệu cue phụ đề không hợp lệ.");
    let cues = [];
    for (let i = 0; i < json.body.length; i++) {
        let cue = json.body[i];
        if (!cue || typeof cue.content !== "string" || cue.from === null || cue.to === null ||
            cue.from === "" || cue.to === "") continue;
        let from = Number(cue.from);
        let to = Number(cue.to);
        let text = cue.content.replace(/\r\n?/g, "\n").trim();
        if (!isFinite(from) || !isFinite(to) || from < 0 || to <= from || !text) continue;
        let start = Math.round(from * 1000);
        let end = Math.round(to * 1000);
        if (end <= start) continue;
        text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n[ \t]*\n+/g, "\n");
        cues.push({ start: start, end: end, text: text });
    }
    if (!cues.length) return "";
    cues.sort(function (a, b) { return a.start - b.start; });
    let output = "WEBVTT\n\n";
    for (let i = 0; i < cues.length; i++) {
        output += (i + 1) + "\n" + subtitleTimestamp(cues[i].start) + " --> " + subtitleTimestamp(cues[i].end) + "\n" + cues[i].text + "\n\n";
    }
    return output;
}

function subtitleLanguage(language) {
    language = String(language || "").replace(/^ai-/, "").replace(/_/g, "-");
    return /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(language) ? language : "und";
}

function fetchSubtitles(bvid, cid, part) {
    let subtitles = [];
    let deadline = Date.now() + 15000;
    let player;
    try {
        player = requestJson("/x/player/wbi/v2", { bvid: bvid, cid: String(cid) }, videoUrl(bvid, part), false, 6000);
    } catch (error) {
        if (error.loginRequired) throw error;
        console.log("Không lấy được metadata phụ đề Bilibili.");
        return subtitles;
    }
    if (String(player.bvid) !== bvid || String(player.cid) !== String(cid)) {
        console.log("Metadata phụ đề không khớp phần video.");
        return subtitles;
    }
    if (player.need_login_subtitle) {
        SESSION_READY = false;
        requireLogin();
        console.log("Phiên còn hợp lệ nhưng API chưa cho phép lấy phụ đề.");
        return subtitles;
    }
    let tracks = player.subtitle && Array.isArray(player.subtitle.subtitles) ? player.subtitle.subtitles : [];
    if (!tracks.length) console.log("Video không có phụ đề khả dụng.");
    let seen = {};
    for (let i = 0; i < tracks.length; i++) {
        let remaining = deadline - Date.now();
        if (remaining <= 0) {
            console.log("Đã hết thời gian tải phụ đề.");
            break;
        }
        let track = tracks[i];
        let url = imageUrl(track.subtitle_url);
        if (track.is_lock || !/^https:\/\/(?:[A-Za-z0-9-]+\.)*(?:hdslb\.com|bilibili\.com)\//i.test(url)) continue;
        let identity = String(track.id_str || track.id || url);
        if (seen[identity]) continue;
        seen[identity] = true;
        try {
            let response = fetch(url, { headers: requestHeaders(videoUrl(bvid, part)), timeout: Math.min(5000, remaining) });
            if (!response || !response.ok) throw new Error("Tải phụ đề thất bại.");
            let vtt = subtitleVtt(response.json());
            if (!vtt) continue;
            subtitles.push({
                data: vtt,
                type: "vtt",
                label: String(track.lan_doc || track.lan || "Phụ đề " + (i + 1)),
                language: subtitleLanguage(track.lan)
            });
        } catch (error) {
            console.log("Bỏ qua track phụ đề lỗi số " + (i + 1) + ".");
        }
    }
    return subtitles;
}
