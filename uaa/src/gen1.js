load('config.js');

function execute(url, page) {
    if (!page) page = '1';
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(BASE_URL + url + "&page=" + page, {
        headers: {
            "user-agent": UserAgent.system()
        },
    });

    if (response.ok) {
        let doc = response.html();
        const data = [];
        doc.select(".main_box .novel_list_box ul li").forEach(e => {
            data.push({
                name: e.select(".cover_box a").attr('title'),
                link: e.select(".cover_box a").attr('href'),
                cover: e.select(".cover_box a img").attr('src'),
                description: e.select(".info_box a").first().text(),
                host: BASE_URL
            });
        });

        let next = (parseInt(page) + 1).toString();
        return Response.success(data, next);
    }
    return null;
}
