load('config.js');

function execute(url, page) {
    if (!page) page = 1
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(BASE_URL + url + "&page=" + page + "&rows=10", {
        headers: {
            "user-agent": UserAgent.system()
        },
    });

    if (response.ok) {
        let json = response.json();
        let cmtList = json.data;
        let comments = [];
        cmtList.forEach(cmt => {
            let scoreCount = Math.round(cmt.score / 2);
            let score = "⭐".repeat(scoreCount) + '☆'.repeat(5 - scoreCount);

            let replies = [];

            // Chỉ load replies khi lave khác 0
            if (Number(cmt.lave || 0) > 0) {
                let replyUrl =
                    "https://www.uaa.com/api/novel/app/novel/subcomments?parentId=" + cmt.id + "&lave=" + cmt.lave;

                let replyResponse = fetch(replyUrl, {
                    headers: {
                        "User-Agent": UserAgent.android()
                    }
                });

                if (replyResponse.ok) {
                    let replyJson = replyResponse.json();
                    let replyList = Array.isArray(replyJson.data)
                        ? replyJson.data
                        : [];

                    replies = replyList.map(function (r) {
                        return {
                            name: r.nickName + " ► " + r.replyNickName,
                            avatar: r.avatar,
                            content: r.content,
                            description: r.createTimeFormat + "    •   " + r.awesome + "❤️",
                            replies: []
                        };
                    });
                }
            }

            comments.push({
                name: cmt.nickName,
                avatar: cmt.avatar,
                content: score + "<br>" + cmt.content,
                description: cmt.createTimeFormat + "    •   " + cmt.awesome + "❤️",
                replies: replies
            });
        });
        let next = parseInt(page, 10) + 1
        return Response.success(comments, next.toString());
    }
    return null
}
