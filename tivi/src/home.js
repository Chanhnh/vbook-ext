// home.js
load("config.js");
let Xac_Nhan = xacnhan;
let Xac_Nhan1 = xacnhan1;
function execute(key) {
    var home = [];

    if (key === "caution") {
        return Response.error("Ext này được tạo để trình diễn khả năng phát video trực tiếp của vBook và mục đích học tập. Vui lòng không lưu trữ ext và vui lòng xoá ext trong 36h sau khi cài đặt.\nViệc bạn tiếp tục sử dụng ext đồng nghĩa với việc bạn đang vi phạm pháp luật Việt Nam và bạn hiểu rõ điều đó, bạn hoàn toàn có thể bị khởi tố hình sự bởi Bộ Công An\nNếu bạn chấp nhận những điều trên, yêu cầu bạn cam kết trong phần <Cài đặt> ext trước khi thử nghiệm. Nếu bạn không chấp nhận, vui lòng xoá ext ngay lập tức.\n\nCảm ơn bạn đã thử nghiệm ext này.\n--Chanhnh--");
    }
    home.push({
        title: "Cảnh báo",
        input: "caution",
        script: "home.js"
    });

    if (Xac_Nhan === Xac_Nhan1) {
        load("data.js");

        var categories = DATA.categories || {};
        var groups = Object.keys(categories);

        for (var i = 0; i < groups.length; i++) {
            home.push({
                title: groups[i],
                input: "group:" + groups[i],
                script: "gen.js"
            });
        }
    }


    return Response.success(home);
}
