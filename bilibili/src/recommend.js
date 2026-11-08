load('config.js');

function recommendationState(page) {
    page = String(page || "");
    if (!page || page === "1") return { index: 0, seen: [] };
    try {
        if (page.length > 4000) throw new Error("Token quá dài.");
        let state = JSON.parse(page);
        if (!state || Array.isArray(state) || typeof state.index !== "number" ||
            !isFinite(state.index) || state.index < 1 || state.index > 1000000 ||
            Math.floor(state.index) !== state.index || !Array.isArray(state.seen) || state.seen.length > 120) {
            throw new Error("Token không hợp lệ.");
        }
        for (let i = 0; i < state.seen.length; i++) {
            if (typeof state.seen[i] !== "string" || !/^BV[0-9A-Za-z]{10}$/.test(state.seen[i])) {
                throw new Error("BVID trong token không hợp lệ.");
            }
        }
        return { index: state.index, seen: state.seen.slice() };
    } catch (error) {
        throw new Error("Dữ liệu tải tiếp đề xuất không hợp lệ. Hãy làm mới danh sách.");
    }
}

function recommendationItems(videos, seen) {
    let items = [];
    for (let i = 0; i < videos.length; i++) {
        let video = videos[i];
        if (!video || video.goto !== "av" || seen.indexOf(String(video.bvid || "")) >= 0) continue;
        let rights = video.rights || {};
        if (Number(rights.pay) || Number(rights.ugc_pay) || Number(rights.arc_pay) ||
            Number(video.is_pay) || Number(video.is_charge_video) || video.badgepay ||
            video.is_upower_exclusive || video.is_upower_play) continue;
        try {
            let item = listItem(video);
            items.push(item);
            seen.push(String(video.bvid));
        } catch (error) {
            if (error.loginRequired) throw error;
        }
    }
    return items;
}

function execute(input, page) {
    try {
        if (input && input !== "recommend") return Response.error("Danh sách đề xuất Bilibili không được hỗ trợ.");
        let state = recommendationState(page);
        requireLogin();
        for (let attempt = 0; attempt < 2; attempt++) {
            let data = requestJson("/x/web-interface/index/top/feed/rcmd", {
                web_location: "1430650", y_num: "0", fresh_type: state.index === 0 ? "0" : "4", feed_version: "V8",
                fresh_idx_1h: String(state.index), fetch_row: "1", fresh_idx: String(state.index), brush: "0",
                homepage_ver: "1", ps: "12", last_y_num: "0"
            }, BASE_URL + "/");
            if (!Array.isArray(data.item)) return Response.error("Bilibili không trả danh sách đề xuất hợp lệ.");
            state.index++;
            let items = recommendationItems(data.item, state.seen);
            if (items.length) {
                state.seen = state.seen.slice(-120);
                return Response.success(items, state.index <= 1000000 ? JSON.stringify(state) : "");
            }
        }
        console.log("Không có đề xuất mới sau hai lượt tải. Hãy làm mới để bắt đầu lượt khác; chưa xác nhận feed đã hết.");
        return Response.success([], "");
    } catch (error) {
        return Response.error(String(error.message || error));
    }
}
