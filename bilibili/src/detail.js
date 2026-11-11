load('config.js');

function parseVideoTags(doc) {
    let genres = [];
    let seen = {};
    doc.select("a.tag-link[href]").forEach(function (element) {
        let title = String(element.text() || "").trim();
        let identity = "$" + title;
        if (!title || seen[identity]) return;
        seen[identity] = true;
        genres.push({ title: title, input: title, script: "search.js" });
    });
    return genres;
}

function fetchVideoTags(bvid, part) {
    try {
        requireLogin();
        let url = videoUrl(bvid, part);
        let response = fetch(url, { headers: apiHeaders(url), timeout: 6000 });
        if (!response || !response.ok) throw new Error("Không tải được tag video Bilibili.");
        if (videoInput(response.url).bvid !== bvid) throw new Error("Trang tag không khớp video.");
        return parseVideoTags(response.html());
    } catch (error) {
        if (error.loginRequired) throw error;
        console.log("Không lấy được tag Bilibili; giữ thông tin video.");
        return [];
    }
}

function videoDetail(video, input, part, genres) {
    let owner = video.owner || {};
    let stats = video.stat || {};
    let lines = [];
    let ownerName = String(owner.name || "").trim();
    if (ownerName) lines.push("UP: " + ownerName);
    let uid = listNumber(owner.mid);
    if (uid !== null && uid > 0) lines.push("UID: " + uid);
    lines.push("BVID: " + input.bvid);
    let aid = listNumber(video.aid);
    if (aid !== null && aid > 0) lines.push("AVID: av" + aid);
    let published = publishedText(video.pubdate, true);
    if (published) lines.push("Ngày đăng: " + published);
    lines.push("Số phần: " + countText(video.pages.length));
    let duration = durationText(video.duration);
    if (duration) lines.push("Tổng thời lượng: " + duration);
    if (video.pages.length > 1) {
        let title = String(part.part || "").trim();
        lines.push("Phần đang chọn: " + input.part + "/" + video.pages.length + (title ? " — " + title : ""));
        let partDuration = durationText(part.duration);
        if (partDuration) lines.push("Thời lượng phần: " + partDuration);
    }
    let counters = [
        ["view", "Lượt xem"], ["danmaku", "Danmaku"], ["like", "Lượt thích"],
        ["coin", "Xu"], ["favorite", "Lượt lưu"], ["share", "Chia sẻ"], ["reply", "Bình luận"]
    ];
    for (let i = 0; i < counters.length; i++) {
        let value = countText(stats[counters[i][0]]);
        if (value) lines.push(counters[i][1] + ": " + value);
    }
    return {
        name: String(video.title),
        author: String(owner.name || ""),
        cover: imageUrl(video.pic),
        description: String(video.desc || ""),
        detail: lines.join("\n"),
        genres: genres || [],
        comments: aid !== null && aid > 0 ? [
            {
                title: "Bình luận",
                input: JSON.stringify({ bvid: input.bvid, aid: String(aid) }),
                script: "comment.js"
            }
        ] : [],
        url: videoUrl(input.bvid, input.part > 1 ? input.part : 0),
        type: "video",
        format: "series",
        ongoing: false,
        locale: "zh-CN"
    };
}

function execute(url) {
    try {
        let input = videoInput(url);
        url = normalizeUrl(url);
        let video = getVideo(input.bvid);
        let part = getPart(video, input.part);
        let genres = fetchVideoTags(input.bvid, input.part);
        return Response.success(videoDetail(video, input, part, genres));
    } catch (error) {
        return Response.error(String(error.message || error));
    }
}
