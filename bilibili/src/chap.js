load('config.js');
load('dash.js');
function execute(url) {
    try {
        let input = videoInput(url);
        url = normalizeUrl(url);
        let video = getVideo(input.bvid);
        let part = getPart(video, input.part);
        let playback = getPlayback(input.bvid, part.cid, 127, input.part);
        let streams = dashStreams(playback);
        let tracks = [];
        let titles = {};
        for (let i = 0; i < streams.videos.length; i++) {
            let quality = Number(streams.videos[i].id);
            let title = dashTitle(playback, quality);
            if (titles[title]) title += " (Q" + quality + ")";
            titles[title] = true;
            tracks.push({
                title: title,
                data: JSON.stringify({ bvid: input.bvid, cid: String(part.cid), part: input.part, quality: quality, mode: "dash" })
            });
        }
        return Response.success(tracks);
    } catch (error) {
        return Response.error(String(error.message || error));
    }
}
