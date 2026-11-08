load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var id = parseDramaId(url);
    if (!id) return Response.error("Không tìm thấy ID phim ngắn trong liên kết.");

    var data = getDrama(id);
    if (!data) return Response.error("Không tải được danh sách tập phim.");

    var episodes = data.episodes || [];
    if (!episodes.length) return Response.error("Phim ngắn này chưa có tập phát.");

    episodes.sort(function (a, b) {
        return episodeNo(a) - episodeNo(b);
    });

    var chapters = [];
    for (var i = 0; i < episodes.length; i++) {
        var episode = episodes[i];
        var number = episodeNo(episode) || (i + 1);
        var chapterUrl = BASE_URL + "/media/short-dramas/" + id + "/episodes/" + number;
        if (episode.videoUrl) {
            chapterUrl += "?v=" + encodeURIComponent(episode.videoUrl);
        }
        chapters.push({
            name: episodeName(episode, data.title),
            url: chapterUrl,
            description: "",
            lock: false,
            pay: false
        });
    }

    return Response.success(chapters);
}
