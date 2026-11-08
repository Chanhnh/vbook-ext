load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var id = parseDramaId(url);
    if (!id) return Response.error("Không tìm thấy ID phim ngắn trong liên kết tập phim.");

    var videoUrl = "";
    var match = String(url || "").match(/[?&]v=([^&#]*)/);
    if (match && match[1]) {
        try {
            videoUrl = decodeURIComponent(match[1]);
        } catch (e) {
            videoUrl = "";
        }
    }

    if (!videoUrl) {
        var data = getDrama(id);
        if (!data) return Response.error("Không tải được thông tin tập phim.");

        var episodes = data.episodes || [];
        var number = parseEpisodeNo(url);
        for (var i = 0; i < episodes.length; i++) {
            if (String(episodeNo(episodes[i])) === String(number)) {
                videoUrl = episodes[i].videoUrl || "";
                break;
            }
        }
        if (!videoUrl && episodes.length) videoUrl = episodes[0].videoUrl || "";
    }

    if (!videoUrl) return Response.error("Tập phim này không có nguồn phát.");

    return Response.success([
        { title: "默认", data: buildStreamUrl(videoUrl) }
    ]);
}
