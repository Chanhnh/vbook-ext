load('config.js');

function execute(data) {
    var url = String(data || "").trim();
    if (!url) return Response.error("Liên kết phát video trống.");

    if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
        url = absoluteUrl(url);
    }

    var userAgent = "";
    try {
        userAgent = UserAgent.chrome();
    } catch (e) {
        userAgent = "";
    }

    var headers = { "Referer": BASE_URL + "/" };
    if (userAgent) headers["User-Agent"] = userAgent;

    var mimeType = "application/x-mpegURL";
    if (url.toLowerCase().indexOf(".mp4") !== -1) mimeType = "video/mp4";

    return Response.success({
        type: "native",
        data: url,
        host: BASE_URL,
        mimeType: mimeType,
        headers: headers,
        timeSkip: []
    });
}
