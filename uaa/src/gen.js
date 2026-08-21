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
