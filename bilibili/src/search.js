load('config.js');
function execute(query, page) {
    try {
        requireLogin();
        query = String(query || "").trim();
        let number = pageNumber(page);
        if (!query) return Response.success([], "");
        if (/^BV[0-9A-Za-z]{10}$/.test(query) || /^(?:https?:\/\/)?(?:www\.)?bilibili\.com\//.test(query)) {
            if (number > 1) return Response.success([], "");
            let input = /^BV[0-9A-Za-z]{10}$/.test(query) ? { bvid: query } : videoInput(query);
            return Response.success([listItem(getVideo(input.bvid))], "");
        }
        let data = requestJson("/x/web-interface/search/type", {
            search_type: "video", keyword: query, page: String(number), page_size: "20"
        });
        if (!Array.isArray(data.result) || !isFinite(Number(data.numPages))) {
            return Response.error("Bilibili không trả kết quả và phân trang tìm kiếm hợp lệ.");
        }
        let items = [];
        for (let i = 0; i < data.result.length; i++) {
            let video = data.result[i];
            if (video.type !== "video" || Number(video.is_pay) || Number(video.is_charge_video) || video.badgepay) continue;
            items.push(listItem(video));
        }
        return Response.success(items, number < Number(data.numPages) ? String(number + 1) : "");
    } catch (error) {
        return Response.error(String(error.message || error));
    }
}
