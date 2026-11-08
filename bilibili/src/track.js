load('config.js');
load('subtitle.js');
load('danmaku.js');
load('dash.js');
load('crypto.js');
load('history.js');
function execute(data) {
    try {
        let input;
        try {
            input = JSON.parse(data);
        } catch (error) {
            return Response.error("Dữ liệu nguồn phát không hợp lệ.");
        }
        if (!input || !/^BV[0-9A-Za-z]{10}$/.test(String(input.bvid || "")) ||
            !/^[1-9][0-9]*$/.test(String(input.cid || "")) ||
            !/^[1-9][0-9]*$/.test(String(input.part || "")) ||
            !/^[1-9][0-9]*$/.test(String(input.quality || "")) || Number(input.quality) > 127 ||
            (input.mode !== undefined && input.mode !== "mp4" && input.mode !== "dash")) {
            return Response.error("Nguồn phát thiếu BVID, CID, phần, chất lượng hoặc chế độ hợp lệ.");
        }
        let video = getVideo(input.bvid);
        let part = getPart(video, Number(input.part));
        if (String(part.cid) !== String(input.cid)) return Response.error("CID không khớp với phần video đã chọn.");
        let playback = getPlayback(input.bvid, input.cid, input.quality, input.part);
        let pair = dashPair(playback, input.quality);
        let headers = requestHeaders(videoUrl(input.bvid, input.part));
        let result = {
            type: "native",
            host: videoUrl(input.bvid, input.part),
            headers: headers,
            data: dashUrl(pair.video),
            mimeType: "video/mp4",
            audios: [{
                data: dashUrl(pair.audio),
                type: "audio/mp4",
                label: "AAC",
                language: "und",
                headers: requestHeaders(videoUrl(input.bvid, input.part))
            }]
        };
        result.subtitles = fetchSubtitles(input.bvid, input.cid, input.part);
        result.danmaku = fetchDanmaku(input.bvid, input.cid, input.part);
        reportOpenedHistory(video, part, input);
        return Response.success(result);
    } catch (error) {
        return Response.error(String(error.message || error));
    }
}
