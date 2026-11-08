load('config.js');

function execute(url) {
    var text = String(url || "");
    var videoId = resolveVideoId(text);
    if (!videoId) return Response.error("Không tìm thấy ID video Douyin");

    var uriMatch = text.match(/[?&]uri=([^&#]*)/);
    var videoUri = uriMatch ? decodeURIComponent(uriMatch[1]) : "";
    var durMatch = text.match(/[?&]dy_duration=(\d+)/);
    var duration = durMatch ? parseInt(durMatch[1], 10) : 0;
    if (isNaN(duration)) duration = 0;

    // Thời lượng được truyền tiếp sang track để tải đủ danmaku của video dài.
    if (!videoUri || !duration) {
        var item = fetchVideoInfo(videoId);
        if (item) {
            if (!videoUri && item.video && item.video.play_addr) {
                videoUri = item.video.play_addr.uri || "";
            }
            if (!duration) duration = (item.video && item.video.duration) || item.duration || 0;
        }
    }
    if (!videoUri) return Response.error("Douyin không cung cấp nguồn MP4 cho video này");

    var playUrl = BASE_URL + "/aweme/v1/play/?video_id=" + encodeURIComponent(videoUri) + "&item_id=" + videoId;
    if (duration) playUrl += "&dy_duration=" + duration;

    // Ba mức H.264 do endpoint play hỗ trợ; 1080p đứng đầu để phát mặc định.
    var qualities = ["1080p", "720p", "540p"];
    var tracks = [];
    for (var i = 0; i < qualities.length; i++) {
        tracks.push({
            title: qualities[i],
            data: playUrl + "&ratio=" + qualities[i]
        });
    }
    return Response.success(tracks);
}
