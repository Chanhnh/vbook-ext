load('config.js');

function execute(key, page) {
    if (!page) page = '1';
    let response = fetch(BASE_URL + "/novel/load?keyword=" + encodeURIComponent(key) + "&searchType=2&page=" + page, {
        headers: {
            "user-agent": UserAgent.system(),
            "Cookie": ""
        }
    });
    if (response.ok) {
        let json = response.json();
        const data = [];
        json.model.data.forEach(e => {
            data.push({
                name: e.title,
                link: BASE_URL + "/novel/intro?id=" + e.id,
                cover: e.coverUrl,
                description: e.authors,
                tag: e.score
            });
        });

        let next = (parseInt(page) + 1).toString();
        return Response.success(data, next);
    }
    return null;
}
