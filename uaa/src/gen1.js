load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(BASE_URL + url, {
        headers: {
            "user-agent": UserAgent.system()
        },
    });

    if (response.ok) {
        let doc = response.html();
        const data = [];
        doc.select(".cn-section .cn-lcard").forEach(e => {
            data.push({
                name: e.select(".cn-lcard__t").attr('title'),
                link: e.attr('href'),
                cover: e.select(".cn-lcard__cv img").attr('src'),
                description: e.select(".cn-lcard__by").text(),
                tag: e.select(".cn-lcard__rate").text()
            });
        });
        ;
        return Response.success(data);
    }
    return null;
}
