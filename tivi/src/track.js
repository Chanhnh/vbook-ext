// track.js
load('data.js');

function execute(url) {
    var defaultHeaders = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    };

    var customHeaders = null;
    var categories = (DATA && DATA.categories) ? DATA.categories : {};

    for (var cat in categories) {
        if (categories.hasOwnProperty(cat)) {
            var list = categories[cat] || [];
            for (var i = 0; i < list.length; i++) {
                if (list[i] && list[i].url === url) {
                    if (list[i].headers) {
                        customHeaders = list[i].headers;
                    }
                    break;
                }
            }
        }
        if (customHeaders) break;
    }

    var headers = {};
    for (var k in defaultHeaders) {
        headers[k] = defaultHeaders[k];
    }
    if (customHeaders) {
        for (var key in customHeaders) {
            headers[key] = customHeaders[key];
        }
    }

    return Response.success({
        data: url,
        type: "native",
        headers: headers
    });
}
