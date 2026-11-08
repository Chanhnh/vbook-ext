load('config.js');
function execute(input, page) {
    try {
        if (input && input !== "popular") return Response.error("Danh sách Bilibili không được hỗ trợ.");
        let number = pageNumber(page);
        let data = requestJson("/x/web-interface/popular", { pn: String(number), ps: "20" });
        if (!Array.isArray(data.list) || typeof data.no_more !== "boolean") {
            return Response.error("Bilibili không trả danh sách phổ biến hợp lệ.");
        }
        let items = [];
        for (let i = 0; i < data.list.length; i++) {
            let video = data.list[i];
            let rights = video.rights || {};
            if (video.is_ogv || Number(rights.pay) || Number(rights.ugc_pay) || Number(rights.arc_pay)) continue;
            items.push(listItem(video));
        }
        return Response.success(items, !data.no_more && data.list.length ? String(number + 1) : "");
    } catch (error) {
        return Response.error(String(error.message || error));
    }
}
