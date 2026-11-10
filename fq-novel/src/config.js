var config_host = "https://fanqienovel.com";

var replaceCover = function(u) {
    if (u.startsWith("https://")) u = u.substring(8);
    else u = u.substring(7);
    var uArr = u.split("/");
    uArr[0] = "https://i0.wp.com/p6-novel.byteimg.com/origin";
    var uArr2 = [];
    uArr.forEach(function(x) {
        if (!x.includes("?") && !x.includes("~")) uArr2.push(x);
        else uArr2.push(x.split("~")[0]);
    });
    u = uArr2.join("/");
    return u;
};

function formatChineseDate(timestamp) {
    if (!timestamp || isNaN(timestamp) || Number(timestamp) <= 0) return "";
    var ts = Number(timestamp);
    if (ts > 100000000000) ts = Math.floor(ts / 1000);

    var now = Math.floor(Date.now() / 1000);
    var diff = now - ts;

    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return Math.floor(diff / 60) + " phút trước";
    if (diff < 86400) return Math.floor(diff / 3600) + " giờ trước";
    if (diff < 2592000) return Math.floor(diff / 86400) + " ngày trước";

    var date = new Date(ts * 1000);
    if (isNaN(date.getTime())) return "";
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    var year = date.getFullYear();
    var month = pad(date.getMonth() + 1);
    var day = pad(date.getDate());
    var hours = pad(date.getHours());
    var minutes = pad(date.getMinutes());
    return day + "/" + month + "/" + year + " " + hours + ":" + minutes;
}

