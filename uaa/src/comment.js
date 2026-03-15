load('config.js');

function execute(url, page) {
    if (!page) page = 1
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(BASE_URL + url + "&page=" + page + "&rows=10");
    if (response.ok) {
        let json = response.json();
        let cmtList = json.data;
        let comments = [];
        cmtList.forEach(cmt => {
            let scoreCount = Math.round(cmt.score / 2);
            let score = "⭐".repeat(scoreCount) + '☆'.repeat(5 - scoreCount);
            comments.push({
                name: cmt.nickName,
                content: score + "&nbsp;".repeat(24) + cmt.awesome + "❤️<br>" + cmt.content,
                description: cmt.createTimeFormat
            });
        });
        let next = parseInt(page, 10) + 1
        return Response.success(comments, next.toString());
    }
    return null
}
