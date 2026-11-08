load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var id = parseDramaId(url);
    if (!id) return Response.error("Không tìm thấy ID phim ngắn trong liên kết.");

    var data = getDrama(id);
    if (!data) return Response.error("Không tải được thông tin phim ngắn.");

    var episodes = data.episodes || [];
    var totalDuration = 0;
    var firstNo = 0;

    for (var i = 0; i < episodes.length; i++) {
        var number = episodeNo(episodes[i]);
        if (number > 0 && (firstNo === 0 || number < firstNo)) firstNo = number;
        totalDuration += Number(episodes[i].durationSec) || 0;
    }
    if (firstNo === 0) firstNo = 1;

    var lines = [];
    if (data.rating !== null && data.rating !== undefined && Number(data.rating) > 0) {
        lines.push("评分：" + data.rating);
    }
    if (data.episodeCount) {
        lines.push("集数：" + data.episodeCount);
    }
    if (data.heatCount) {
        lines.push("热度：" + formatCount(data.heatCount));
    }
    if (data.publishedAt) {
        lines.push("发布时间：" + formatDate(data.publishedAt));
    }
    if (totalDuration > 0) {
        lines.push("总时长：" + formatDuration(totalDuration));
    }
    lines.push("ID：" + id);

    return Response.success({
        name: cleanTitle(data.title) || ("短剧 " + id),
        cover: absoluteUrl(data.coverUrl),
        description: data.description || "",
        detail: lines.join("<br>"),
        url: BASE_URL + "/media/short-dramas/" + id + "/episodes/" + firstNo,
        type: "video",
        format: "short",
        ongoing: false,
        nsfw: true,
        locale: "zh-CN",
        suggests: [
            { title: "相关推荐", input: String(id), script: "similar.js" }
        ]
    });
}
