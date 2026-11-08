load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    let info = videoInfo(url);
    let pageUrl = info ? BASE_URL + "/video/" + info.id + "/" + (info.ep === "1" ? "" : "ep-" + info.ep + "/") : url;
    return Response.success([
        { title: "默认线路", data: pageUrl }
    ]);
}
