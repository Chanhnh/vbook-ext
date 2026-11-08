load('config.js');

function nativeTrack(stream, pageUrl) {
    return {
        type: "native",
        data: stream,
        host: BASE_URL,
        mimeType: "application/x-mpegURL",
        headers: {
            "User-Agent": UserAgent.chrome(),
            "Referer": pageUrl
        },
        timeSkip: []
    };
}

function streamFromApi(info) {
    let api = BASE_URL + "/api/videos/" + info.id + "/play?ep=" + info.ep;
    let response = fetch(api, {
        headers: { "User-Agent": UserAgent.chrome(), "Referer": info.page }
    });
    if (!response.ok) return "";
    try {
        let json = response.json();
        if (json && json.status === 1 && json.data && json.data.video_url) {
            return json.data.video_url;
        }
    } catch (e) {
    }
    return "";
}

function streamFromPage(pageUrl) {
    let response = fetch(pageUrl);
    if (!response.ok) return "";
    let doc = response.html();
    let src = doc.select("video source").attr("src");
    if (!src) src = doc.select("video").attr("src");
    return src || "";
}

function execute(data) {
    data = String(data || "");

    if (data.indexOf(".m3u8") !== -1 || data.indexOf(".mp4") !== -1) {
        return Response.success(nativeTrack(data, BASE_URL + "/"));
    }

    let info = videoInfo(data);
    let pageUrl = info ? info.page : normalizeUrl(data);
    if (pageUrl.indexOf("http") !== 0) pageUrl = absUrl(pageUrl);

    if (info) {
        let stream = streamFromApi(info);
        if (stream) return Response.success(nativeTrack(stream, pageUrl));
    }

    let fallback = streamFromPage(pageUrl);
    if (fallback) return Response.success(nativeTrack(absUrl(fallback), pageUrl));

    return Response.success({
        type: "auto",
        data: pageUrl,
        host: BASE_URL,
        headers: {
            "User-Agent": UserAgent.chrome(),
            "Referer": BASE_URL + "/"
        },
        timeSkip: []
    });
}
