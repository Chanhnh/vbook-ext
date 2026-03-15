load('config.js');

function execute(key, page) {
    if (!page) page = '1';
    let response = fetch(BASE_URL + "/novel/list?searchType=1&keyword=" + encodeURIComponent(key) + "&page=" + page, {
        headers: {
            "Cookie": ""
        }
    });
    if (response.ok) {
        let doc = response.html();
        if (doc.html().includes("游客)无法进行此操作"))
            return Response.error("抱歉，您所在的用户组(游客)无法进行此操作\n(Cần đăng nhập)");
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
