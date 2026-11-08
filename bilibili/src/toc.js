load('config.js');
function execute(url) {
    try {
        let input = videoInput(url);
        url = normalizeUrl(url);
        let video = getVideo(input.bvid);
        let episodes = [];
        for (let i = 0; i < video.pages.length; i++) {
            let part = video.pages[i];
            if (!part.part || Number(part.cid) <= 0 || Number(part.page) !== i + 1) {
                return Response.error("Bilibili trả danh sách phần không hợp lệ.");
            }
            episodes.push({
                name: video.pages.length === 1 ? String(video.title) : "P" + part.page + " - " + String(part.part),
                url: videoUrl(input.bvid, Number(part.page)),
                description: durationText(part.duration),
                lock: false,
                pay: false
            });
        }
        return Response.success(episodes);
    } catch (error) {
        return Response.error(String(error.message || error));
    }
}
