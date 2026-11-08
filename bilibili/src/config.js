let BASE_URL = "https://www.bilibili.com";
try {
    if (DOMAIN && /^https:\/\/(?:www\.)?bilibili\.com\/?$/.test(String(DOMAIN))) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (error) {
}
let API_URL = "https://api.bilibili.com";
let SESSION_COOKIE = "";
let SESSION_READY = false;

function loginError() {
    let error = new Error("Cần đăng nhập Bilibili. Hãy đăng nhập hoặc cập nhật cookie nguồn trong vBook rồi thử lại.");
    error.loginRequired = true;
    return error;
}

function sessionCookie() {
    try {
        return String(localCookie.getCookie() || "").trim();
    } catch (error) {
        return "";
    }
}

function requireLogin() {
    if (SESSION_READY) return;
    let cookie = sessionCookie();
    if (!/(?:^|;\s*)SESSDATA=[^;\s]+/.test(cookie) || /[\r\n]/.test(cookie)) throw loginError();
    SESSION_COOKIE = cookie;
    try {
        let account = requestJson("/x/web-interface/nav", {}, BASE_URL + "/", true);
        if (account.isLogin !== true) throw loginError();
        SESSION_READY = true;
    } catch (error) {
        SESSION_COOKIE = "";
        throw error;
    }
}

function apiHeaders(url) {
    let headers = requestHeaders(url);
    headers.Cookie = SESSION_COOKIE;
    return headers;
}

function normalizeUrl(url) {
    return String(url).replace(/^(?:https?:\/\/)?(?:www\.)?bilibili\.com(?=\/)/i, BASE_URL);
}

function videoInput(url) {
    url = String(url || "").trim();
    let match = url.match(/^(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/(BV[0-9A-Za-z]{10})\/?(?:[?#].*)?$/);
    if (!match) throw new Error("URL không hợp lệ. Hãy dùng bilibili.com/video/BV…");
    let part = url.split("#")[0].match(/[?&]p=([^&#]*)/);
    if (part && !/^[1-9][0-9]*$/.test(part[1])) throw new Error("Số phần video không hợp lệ.");
    return { bvid: match[1], part: part ? parseInt(part[1], 10) : 1 };
}

function videoUrl(bvid, part) {
    return BASE_URL + "/video/" + bvid + "/" + (part ? "?p=" + part : "");
}

function requestHeaders(url) {
    return { "User-Agent": UserAgent.chrome(), "Referer": url || BASE_URL + "/" };
}

function requestJson(path, queries, referer, checkingLogin, timeout) {
    if (!checkingLogin) requireLogin();
    let response = fetch(API_URL + path, {
        queries: queries || {},
        headers: apiHeaders(referer),
        timeout: timeout || 20000
    });
    if (!response || !response.ok) {
        let status = response ? Number(response.status) : 504;
        if (status === 412 || status === 403) throw new Error("Bilibili đang chặn yêu cầu (HTTP " + status + "). Hãy thử lại sau.");
        throw new Error("Không tải được dữ liệu Bilibili: HTTP " + status);
    }
    let result;
    try {
        result = response.json();
    } catch (error) {
        throw new Error("Bilibili trả dữ liệu không phải JSON.");
    }
    if (!result || Number(result.code) !== 0) {
        let code = result ? Number(result.code) : -1;
        if (code === -101) {
            SESSION_READY = false;
            SESSION_COOKIE = "";
            throw loginError();
        }
        if (code === -404 || code === 62002) throw new Error("Video không tồn tại hoặc đã bị xóa.");
        throw new Error("Bilibili không trả dữ liệu hợp lệ (mã " + code + ").");
    }
    if (!result.data || result.data.v_voucher) throw new Error("Bilibili yêu cầu xác minh truy cập. Extension không tự vượt bước xác minh.");
    return result.data;
}

function getVideo(bvid) {
    let video = requestJson("/x/web-interface/view", { bvid: bvid }, videoUrl(bvid));
    if (String(video.bvid) !== bvid || !video.title || !Array.isArray(video.pages) || !video.pages.length) {
        throw new Error("Bilibili không trả đầy đủ thông tin video và danh sách phần.");
    }
    let rights = video.rights || {};
    if (Number(rights.pay) || Number(rights.ugc_pay) || Number(rights.arc_pay) || video.is_upower_exclusive || video.is_upower_play) {
        throw new Error("Extension không hỗ trợ video trả phí hoặc dành riêng cho hội viên.");
    }
    if (Number(rights.is_stein_gate)) throw new Error("Extension chưa hỗ trợ video tương tác nhiều nhánh.");
    return video;
}

function getPart(video, number) {
    for (let i = 0; i < video.pages.length; i++) {
        let part = video.pages[i];
        if (Number(part.page) === number && Number(part.cid) > 0) return part;
    }
    throw new Error("Không tìm thấy phần " + number + " trong video.");
}

function getPlayback(bvid, cid, quality, part) {
    return requestJson("/x/player/playurl", {
        bvid: bvid, cid: String(cid), qn: String(quality), fnval: "16", fnver: "0", fourk: "1"
    }, videoUrl(bvid, part));
}

function imageUrl(url) {
    url = String(url || "");
    if (url.indexOf("//") === 0) url = "https:" + url;
    return url.replace(/^http:\/\//i, "https://");
}

function plainText(text) {
    return Html.parse(String(text || "")).text();
}

function listNumber(value) {
    if ((typeof value !== "number" && typeof value !== "string") ||
        (typeof value === "string" && !value.trim())) return null;
    let number = Number(value);
    return isFinite(number) && number >= 0 && Math.floor(number) === number ? number : null;
}

function durationText(value) {
    let seconds;
    if (typeof value === "string" && value.indexOf(":") >= 0) {
        let fields = value.trim().split(":");
        if ((fields.length !== 2 && fields.length !== 3) || !/^[0-9]+(?::[0-9]{1,2}){1,2}$/.test(value.trim())) return "";
        seconds = Number(fields[fields.length - 1]);
        let minutes = Number(fields[fields.length - 2]);
        if (seconds >= 60 || (fields.length === 3 && minutes >= 60)) return "";
        seconds += minutes * 60 + (fields.length === 3 ? Number(fields[0]) * 3600 : 0);
    } else {
        seconds = listNumber(value);
    }
    if (seconds === null || !isFinite(seconds)) return "";
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor(seconds / 60) % 60;
    let remainder = seconds % 60;
    return (hours ? (hours < 10 ? "0" : "") + hours + ":" : "") + (minutes < 10 ? "0" : "") + minutes + ":" +
        (remainder < 10 ? "0" : "") + remainder;
}

function countText(value) {
    let number = listNumber(value);
    return number === null ? "" : String(number).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function publishedText(value, includeTime) {
    let timestamp = listNumber(value);
    if (timestamp === null || timestamp <= 0) return "";
    let date = new Date((timestamp + 8 * 3600) * 1000);
    if (!isFinite(date.getTime())) return "";
    function pad(number) { return (number < 10 ? "0" : "") + number; }
    let text = pad(date.getUTCDate()) + "-" + pad(date.getUTCMonth() + 1) + "-" + date.getUTCFullYear();
    if (includeTime) text += " " + pad(date.getUTCHours()) + ":" + pad(date.getUTCMinutes()) + ":" +
        pad(date.getUTCSeconds()) + " (UTC+8)";
    return text;
}

function listTag(video) {
    let lines = [];
    let duration = durationText(video.duration);
    if (duration) lines.push(duration);
    let views = listNumber(video.stat && video.stat.view);
    if (views === null) views = listNumber(video.play);
    if (views !== null) lines.push(countText(views) + " 👁️");
    let published = publishedText(video.pubdate);
    if (published) lines.push(published);
    return lines.join(" · ");
}

function listItem(video) {
    if (!video || !/^BV[0-9A-Za-z]{10}$/.test(String(video.bvid || "")) || !video.title || !video.pic) {
        throw new Error("Bilibili trả mục video thiếu tiêu đề, BVID hoặc ảnh bìa.");
    }
    return {
        name: plainText(video.title),
        link: videoUrl(video.bvid),
        cover: imageUrl(video.pic),
        description: String(video.author || (video.owner && video.owner.name) || ""),
        tag: listTag(video)
    };
}

function pageNumber(page) {
    page = String(page || "1");
    if (!/^[1-9][0-9]*$/.test(page)) throw new Error("Trang không hợp lệ.");
    return parseInt(page, 10);
}
