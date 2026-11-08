var BASE_URL = "https://fanqienovel.com";
var FQ_DOMAIN_OVERRIDE = typeof DOMAIN !== "undefined" ? String(DOMAIN || "").replace(/\/+$/, "") : "";
if (FQ_DOMAIN_OVERRIDE) BASE_URL = FQ_DOMAIN_OVERRIDE;

function fqPad2(value) {
    var text = String(value);
    return text.length < 2 ? "0" + text : text;
}

function fqFormatNumber(value) {
    var text = String(value === undefined || value === null ? "" : value).replace(/[^\d]/g, "");
    if (!text) return "";
    var out = "";
    var count = 0;
    var i;
    for (i = text.length - 1; i >= 0; i--) {
        out = text.charAt(i) + out;
        count++;
        if (count % 3 === 0 && i > 0) out = "." + out;
    }
    return out;
}

function fqFormatDate(timestamp) {
    var n = parseInt(String(timestamp === undefined || timestamp === null ? "0" : timestamp), 10);
    if (!n) return "";
    if (n > 1000000000000) n = Math.floor(n / 1000);
    var date = new Date(n * 1000);
    return fqPad2(date.getDate()) + "/" + fqPad2(date.getMonth() + 1) + "/" + date.getFullYear() +
        " " + fqPad2(date.getHours()) + ":" + fqPad2(date.getMinutes());
}
