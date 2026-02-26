load('config.js');
function execute(url) {
    const regex = /(?:book_id=|\/)(\d+)$/;
    let book_id = url.match(regex)[1]

    // let book_id = url.split("book_id=")[1]
    let response = fetch("https://fanqienovel.com/page/" + book_id + "?force_mobile=1");
    if (response.ok) {
        let html = response.text();
        const stateRegex = /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/;
        let match = html.match(stateRegex);
        let state = JSON.parse(match[1]);
        let book_info = state.page;

        let a_gen = JSON.parse(book_info.categoryV2);
        let genres = [];
        a_gen.forEach(e => {
            console.log(JSON.stringify(e))
            genres.push({
                title: e.Name,
                input: "https://fanqienovel.com/api/author/library/book_list/v0/?category_id=" + e.ObjectId + "&book_type=-1&page_count=18&page_index={{page}}",
                script: "gen.js"
            })
        });
        let last_publish_time = book_info.lastPublishTime
        let last_publish_time_string = formatChineseDate(last_publish_time)
        let serial_count = book_info.chapterTotal
        let last_chapter_title = book_info.lastChapterTitle
        let read_count = book_info.readCount
        let word_number = book_info.wordNumber
        let score = "0";
        try {
            let scoreRes = fetch("https://api5-normal-sinfonlinec.fqnovel.com/reading/user/share/info/v/?group_id=" + book_id + "&aid=1967&version_code=513");
            if (scoreRes.ok) {
                let scoreJson = scoreRes.json();
                score = scoreJson.data.book_info.score;
            }
        } catch (e) {}
        let ongoing = (book_info.creationStatus == '1') ? true : false
        let authorID = book_info.authorId
        return Response.success({
            name: book_info.bookName,
            cover: replaceCover(book_info.thumbUrl.replace(/\\u002F/g, "/")),
            author: book_info.author,
            description: book_info.abstract.replace(/\n/g, "<br>"),
            genres: genres,
            detail: `评分: ${score}分<br>
                        章节数: ${serial_count}<br>
                        字数: ${word_number}<br>
                        查看次数: ${read_count}<br>
                        更新: ${last_publish_time_string}<br>
                        最后更新: ${last_chapter_title}`,
            suggests: [
                {
                    title: book_info.author,
                    input: `https://api5-normal-sinfonlinec.fqnovel.com/reading/user/basic_info/get/v?user_id=${authorID}&aid=1967&version_code=65532`,
                    script: "suggest.js"
                }
            ],
            comment: {
                input: `https://api5-normal-sinfonlinec.fqnovel.com/reading/ugc/novel_comment/book/v/?&book_id=${book_id}&aid=1967&offset={{page}}`,
                script: "comment.js"
            },
            ongoing: ongoing
        });

    }
    return null;
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

