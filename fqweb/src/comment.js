load('config.js');
function execute(url, page) {
    if (!page) page = 1
    url = url.replace("{{page}}", (page - 1) * 10);
    url += cmt_sort == "Mới nhất" ? "&sort=time" :
        cmt_sort == "Nóng nhất" ? "&sort=1" : "";

    let response = fetch(url, {
        headers: {
            "User-Agent": UserAgent.android()
        }
    });
    if (response.ok) {
        let json = response.json();
        let cmtList = json.data.comment;
        let comments = [];
        cmtList.forEach(cmt => {
            let scoreCount = Math.round(cmt.score / 2);
            let score = "⭐".repeat(scoreCount) + '☆'.repeat(5 - scoreCount);
            comments.push({
                name: cmt.user_info.user_name,
                avatar: cmt.user_info.user_avatar,
                content: score + "<br>" + cmt.text,
                description: formatChineseDate(cmt.create_timestamp) +
                    (cmt.digg_count || cmt.reply_count ? "    •    " : "") +
                    (cmt.digg_count ? cmt.digg_count + "❤️" : "") +
                    (cmt.digg_count && cmt.reply_count ? "  " : "") +
                    (cmt.reply_count ? cmt.reply_count + "🗨️" : ""),
                replies: (cmt.reply_list || []).map(function (r) {
                    return {
                        name: r.user_info.user_name,
                        avatar: r.user_info.user_avatar,
                        content: r.text,
                        description: formatChineseDate(r.create_timestamp) +  (r.digg_count ? "    •   " + r.digg_count + "❤️" : ""),
                        replies: []
                    };
                })
            });
        });
        let next = parseInt(page, 10) + 1
        return Response.success(comments, next.toString());
    }
    return null
}

function formatChineseDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}
