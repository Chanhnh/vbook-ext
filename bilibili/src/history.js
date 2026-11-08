function historyEnabled() {
    try {
        return String(REPORT_HISTORY) === "true";
    } catch (error) {
        return false;
    }
}

function historyRemaining(deadline) {
    let remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("Đã hết thời gian ghi lịch sử.");
    return remaining;
}

function historyForm(data) {
    let names = Object.keys(data).sort();
    let pairs = [];
    for (let i = 0; i < names.length; i++) {
        pairs.push(encodeURIComponent(names[i]) + "=" + encodeURIComponent(String(data[names[i]])));
    }
    return pairs.join("&");
}

function historySignature(params, imgKey, subKey, timestamp) {
    let order = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52];
    let key = imgKey + subKey;
    let mixin = "";
    for (let i = 0; i < order.length; i++) mixin += key.charAt(order[i]);
    let query = Object.assign({}, params, { web_location: "1315873", wts: String(timestamp) });
    query.w_rid = CryptoJS.MD5(historyForm(query) + mixin.slice(0, 32)).toString();
    return query;
}

function historyAttempt(mid, bvid, now) {
    let key = "bilibili.history.attempts." + CryptoJS.SHA256(String(mid)).toString();
    let raw = localStorage.getItem(key);
    let entries = [];
    if (raw !== null && raw !== undefined && String(raw) !== "") {
        raw = String(raw);
        if (raw.length > 20000) throw new Error("Dữ liệu chống trùng không hợp lệ.");
        entries = JSON.parse(raw);
        if (!Array.isArray(entries) || entries.length > 256) throw new Error("Dữ liệu chống trùng không hợp lệ.");
    }
    let current = [];
    let seen = {};
    let cooldown = false;
    for (let i = 0; i < entries.length; i++) {
        let entry = entries[i];
        if (!entry || typeof entry.bvid !== "string" || !/^BV[0-9A-Za-z]{10}$/.test(entry.bvid) ||
            typeof entry.time !== "number" || !isFinite(entry.time) || entry.time <= 0 ||
            Math.floor(entry.time) !== entry.time || seen[entry.bvid]) throw new Error("Dữ liệu chống trùng không hợp lệ.");
        seen[entry.bvid] = true;
        if (now - entry.time < 86400000) {
            current.push({ bvid: entry.bvid, time: entry.time });
            if (entry.bvid === bvid) cooldown = true;
        }
    }
    if (cooldown || current.length >= 256) return false;
    current.push({ bvid: bvid, time: now });
    let value = JSON.stringify(current);
    localStorage.setItem(key, value);
    if (String(localStorage.getItem(key)) !== value) throw new Error("Không lưu được dấu lần thử lịch sử.");
    return true;
}

function reportOpenedHistory(video, part, input) {
    if (!historyEnabled()) return "disabled";
    let deadline = Date.now() + 15000;
    try {
        if (!SESSION_READY || !SESSION_COOKIE || /[\r\n]/.test(SESSION_COOKIE) ||
            !/(?:^|;\s*)SESSDATA=[^;\s]+/.test(SESSION_COOKIE)) throw new Error("Phiên đăng nhập không sẵn sàng.");
        if (!video || !part || !input || !/^BV[0-9A-Za-z]{10}$/.test(String(input.bvid || "")) ||
            String(video.bvid) !== input.bvid || String(part.cid) !== String(input.cid) ||
            Number(part.page) !== Number(input.part) || !/^[1-9][0-9]*$/.test(String(input.part)) ||
            !/^[1-9][0-9]*$/.test(String(video.aid)) || !/^[1-9][0-9]*$/.test(String(part.cid)) ||
            !isFinite(Number(video.aid)) || Number(video.aid) > 9007199254740991 ||
            !isFinite(Number(part.cid)) || Number(part.cid) > 9007199254740991) throw new Error("Video/phần không hợp lệ.");
        let duration = listNumber(part.duration);
        if (duration === null || duration <= 0) throw new Error("Thời lượng phần không hợp lệ.");
        let csrf = SESSION_COOKIE.match(/(?:^|;\s*)bili_jct=([^;\s]+)/);
        if (!csrf) throw new Error("Thiếu CSRF.");
        let referer = videoUrl(input.bvid, input.part);
        let response = fetch(API_URL + "/x/web-interface/nav", {
            headers: apiHeaders(referer), timeout: historyRemaining(deadline)
        });
        if (!response || !response.ok) throw new Error("Không kiểm tra được tài khoản.");
        let reply = response.json();
        let account = reply && reply.data;
        if (!reply || listNumber(reply.code) !== 0 ||
            !account || account.isLogin !== true || account.v_voucher ||
            !/^[1-9][0-9]*$/.test(String(account.mid)) || Number(account.mid) > 9007199254740991) throw new Error("Tài khoản không hợp lệ.");
        let wbi = account.wbi_img || {};
        let img = String(wbi.img_url || "").match(/\/([0-9a-f]{32})\.png(?:\?|$)/i);
        let sub = String(wbi.sub_url || "").match(/\/([0-9a-f]{32})\.png(?:\?|$)/i);
        if (!img || !sub) throw new Error("Thiếu khóa WBI.");
        historyRemaining(deadline);
        let now = Date.now();
        let timestamp = Math.round(now / 1000);
        let body = {
            start_ts: timestamp, mid: String(account.mid), aid: String(video.aid), cid: String(part.cid),
            type: 3, dt: 2, play_type: 1, realtime: 0, played_time: 0, real_played_time: 0,
            video_duration: duration, last_play_progress_time: 0, max_play_progress_time: 0,
            refer_url: referer, mobi_app: "web", device: "web", platform: "web", csrf: csrf[1]
        };
        let query = historySignature({
            w_start_ts: body.start_ts, w_mid: body.mid, w_aid: body.aid, w_dt: body.dt,
            w_realtime: body.realtime, w_played_time: body.played_time, w_real_played_time: body.real_played_time,
            w_video_duration: body.video_duration, w_last_play_progress_time: body.last_play_progress_time
        }, img[1], sub[1], timestamp);
        let headers = apiHeaders(referer);
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        let payload = historyForm(body);
        historyRemaining(deadline);
        // Persist before POST: a timeout may still mean the server recorded the request.
        if (!historyAttempt(account.mid, input.bvid, now)) return "limited";
        response = fetch(API_URL + "/x/click-interface/web/heartbeat", {
            method: "POST", queries: query, body: payload, headers: headers, timeout: historyRemaining(deadline)
        });
        if (!response || !response.ok) throw new Error("Ghi lịch sử thất bại.");
        reply = response.json();
        if (!reply || listNumber(reply.code) !== 0) {
            console.log("Bilibili từ chối ghi lịch sử; không thử lại.");
            return "failed";
        }
        return "sent";
    } catch (error) {
        console.log("Không ghi được lịch sử Bilibili; vẫn giữ nguồn phát, không thử lại.");
        return "failed";
    }
}
