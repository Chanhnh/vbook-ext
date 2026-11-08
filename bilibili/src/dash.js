function dashUrl(stream) {
    let url = String(stream.baseUrl || stream.base_url || "");
    return /^https?:\/\//i.test(url) ? url : "";
}

function dashStreams(playback) {
    let dash = playback && playback.dash;
    if (!dash || !Array.isArray(dash.video) || !Array.isArray(dash.audio)) {
        throw new Error("Bilibili không trả luồng DASH hình và tiếng.");
    }
    let blocked = {};
    let formats = Array.isArray(playback.support_formats) ? playback.support_formats : [];
    for (let i = 0; i < formats.length; i++) {
        if (Number(formats[i].limit_watch_reason) > 0) blocked[Number(formats[i].quality)] = true;
    }
    let videos = [];
    let seen = {};
    for (let i = 0; i < dash.video.length; i++) {
        let video = dash.video[i];
        let quality = Number(video.id);
        if (!/^avc1\./i.test(String(video.codecs || "")) || !dashUrl(video) || blocked[quality] ||
            !isFinite(quality) || quality <= 0 || quality > 127 || Math.floor(quality) !== quality) continue;
        if (!seen[quality]) {
            videos.push(video);
            seen[quality] = true;
        }
    }
    let audios = [];
    for (let i = 0; i < dash.audio.length; i++) {
        let audio = dash.audio[i];
        if (/^mp4a\.40\./i.test(String(audio.codecs || "")) && dashUrl(audio)) audios.push(audio);
    }
    audios.sort(function (a, b) { return Number(b.bandwidth || 0) - Number(a.bandwidth || 0); });
    videos.sort(function (a, b) { return Number(b.id) - Number(a.id); });
    if (!videos.length || !audios.length) throw new Error("Không có cặp DASH H.264/AAC được hỗ trợ.");
    return { videos: videos, audio: audios[0] };
}

function dashPair(playback, quality) {
    let streams = dashStreams(playback);
    for (let i = 0; i < streams.videos.length; i++) {
        if (Number(streams.videos[i].id) === Number(quality)) {
            return { video: streams.videos[i], audio: streams.audio };
        }
    }
    throw new Error("Chất lượng DASH đã chọn không còn khả dụng. Hãy làm mới và chọn lại nguồn phát.");
}

function dashTitle(playback, quality) {
    let formats = Array.isArray(playback.support_formats) ? playback.support_formats : [];
    let label = "Q" + quality;
    for (let i = 0; i < formats.length; i++) {
        if (Number(formats[i].quality) === Number(quality) && formats[i].display_desc) {
            label = String(formats[i].display_desc) + (formats[i].superscript ? " " + String(formats[i].superscript) : "");
            break;
        }
    }
    return "DASH " + label;
}
