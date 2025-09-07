load('config.js');
function execute(url) {
    const regex = /(?:book_id=|\/)(\d+)$/;
    let book_id = url.match(regex)[1]

    // let book_id = url.split("book_id=")[1]
    let response = fetch("https://api5-normal-sinfonlineb.fqnovel.com/reading/bookapi/multi-detail/v/?aid=2329&iid=1&version_code=999&book_id=" + book_id)
    if (response.ok) {
            let json = response.json();
            let book_info = json.data[0];
            let a_gen=JSON.parse(book_info.category_v2);

            let genres = [];
            a_gen.forEach(e => {
console.log(JSON.stringify(e))
                genres.push({
                    title: e.Name,
                    input: "https://novel.snssdk.com/api/novel/channel/homepage/new_category/book_list/v1/?parent_enterfrom=novel_channel_category.tab.&aid=1967&offset={{page}}&limit=100&category_id="+e.ObjectId+"&gender=1",
                    script: "gen2.js"
                })
            });
            let last_publish_time = book_info.last_publish_time
            let last_publish_time_string = formatChineseDate(last_publish_time)
            let serial_count = book_info.serial_count
            let last_chapter_title = book_info.last_chapter_title
            let read_count = book_info.read_count
            let word_number = book_info.word_number
            let score = book_info.score
            let ongoing = (book_info.creation_status == '1') ? true : false
            let authorID = book_info.author_id
            return Response.success({
                name: book_info.book_name,
                cover: replaceCover(book_info.thumb_url),
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
                        title: "Cùng tác giả",
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

