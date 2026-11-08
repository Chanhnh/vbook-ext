var BASE_URL = "https://2048ai.vip";
try {
    if (DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

var API_BASE = BASE_URL + "/api/v1";

function normalizeUrl(url) {
    return String(url || "").replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
}

function apiGet(path) {
    var response = null;
    try {
        response = fetch(API_BASE + path, {
            headers: {
                "Accept": "application/json",
                "Referer": BASE_URL + "/"
            },
            timeout: 30000
        });
    } catch (e) {
        return null;
    }
    if (!response || !response.ok) return null;

    var json = null;
    try {
        json = response.json();
    } catch (e) {
        return null;
    }
    if (!json || Number(json.code) !== 200 || json.data === null || json.data === undefined) return null;
    return json.data;
}

function getDrama(id) {
    if (!id) return null;

    var cacheKey = "drama." + id;
    try {
        var cached = cacheStorage.getItem(cacheKey);
        if (cached) {
            var saved = JSON.parse(cached);
            if (saved && saved.time && (Date.now() - saved.time) < 300000 && saved.data) {
                return saved.data;
            }
        }
    } catch (e) {
    }

    var data = apiGet("/short-dramas/" + id + "?productId=1");
    if (data) {
        try {
            cacheStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data: data }));
        } catch (e) {
        }
    }
    return data;
}

function parseDramaId(url) {
    var match = String(url || "").match(/short-dramas\/(\d+)/);
    return match ? match[1] : "";
}

function parseEpisodeNo(url) {
    var match = String(url || "").match(/episodes\/(\d+)/);
    return match ? match[1] : "";
}

function episodeNo(episode) {
    if (!episode) return 0;
    var value = episode.episodeNo;
    if (value === null || value === undefined || value === "") value = episode.episodeNumber;
    if (value === null || value === undefined || value === "") value = episode.number;
    var number = parseInt(value, 10);
    return isNaN(number) ? 0 : number;
}

var EPISODE_MARKER = /第\s*[0-9０-９一二三四五六七八九十百千零〇两]+\s*[集话話]|EP\s*[-—–_]?\s*\d+/i;

var CN_DIGITS = { "零": 0, "〇": 0, "一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9 };

function toHalfWidth(text) {
    return String(text || "").replace(/[０-９]/g, function (ch) {
        return String.fromCharCode(ch.charCodeAt(0) - 65248);
    });
}

function cnNumber(text) {
    var value = toHalfWidth(text).replace(/[^0-9一二三四五六七八九十百千零〇两]/g, "");
    if (!value) return 0;
    if (/^[0-9]+$/.test(value)) return parseInt(value, 10);

    var total = 0;
    var current = 0;
    for (var i = 0; i < value.length; i++) {
        var ch = value.charAt(i);
        if (ch === "百") {
            total += (current || 1) * 100;
            current = 0;
        } else if (ch === "十") {
            total += (current || 1) * 10;
            current = 0;
        } else if (ch === "千") {
            total += (current || 1) * 1000;
            current = 0;
        } else if (CN_DIGITS[ch] !== undefined) {
            current = CN_DIGITS[ch];
        }
    }
    return total + current;
}

function sameText(a, b) {
    if (!a || !b) return false;
    if (a.indexOf(b) !== -1 || b.indexOf(a) !== -1) return true;

    var pool = {};
    var i;
    for (i = 0; i < b.length; i++) pool[b.charAt(i)] = true;

    var hits = 0;
    for (i = 0; i < a.length; i++) {
        if (pool[a.charAt(i)]) hits++;
    }
    return hits / a.length >= 0.7;
}

function episodeName(episode, dramaTitle) {
    if (!episode) return "正片";

    var number = episodeNo(episode);
    var fallback = number > 0 ? ("第" + number + "集") : "正片";
    var title = cleanTitle(episode.titleOverride || episode.title);
    if (!title) return fallback;

    var drama = cleanTitle(dramaTitle);
    var marker = title.match(EPISODE_MARKER);
    if (!marker) {
        var rest = drama && title.indexOf(drama) === 0 ? title.slice(drama.length) : null;
        var sameDrama = title === drama || (rest !== null && !rest.replace(/[\s\-—–_：:·、]|第\s*[0-9一二三四五六七八九十]+\s*[季集话話]/g, ""));
        return sameDrama ? fallback : title;
    }

    var index = title.indexOf(marker[0]);
    var head = title.slice(0, index).replace(/[\s\-—–_：:·、.。]+$/g, "");
    var tail = title.slice(index + marker[0].length);

    var headCore = head.replace(/^[\s\-—–_：:·、《〈（(【\[〔"'“”]+/, "").replace(/[\s\-—–_：:·、《〈（(【\[〕》〉）)】\]"'“”]+$/, "");
    var headIsDrama = !!drama && (headCore === drama || (headCore.indexOf(drama) === 0 && !headCore.slice(drama.length).replace(/[\s\-—–_：:·、]/g, "")));
    var season = /第\s*[0-9０-９一二三四五六七八九十]+\s*季/.test(headCore) && !headIsDrama;

    var covered = !season && (/[《〈（(【\[〔]\s*$/.test(head) || sameText(headCore, drama));

    var labelNumber = /^EP/i.test(marker[0]) ? cnNumber(marker[0]) : cnNumber(marker[0].replace(/[第集话話]/g, ""));
    if (!labelNumber) labelNumber = number;
    var label = labelNumber > 0 ? ("第" + labelNumber + "集") : marker[0].replace(/\s+/g, "");

    tail = tail.replace(/^[\s\-—–_：:·、.。,，）)】\]》〉"'“”]+/, "");
    tail = tail.replace(/[\s.。,，]+$/, "");

    var name = (covered ? "" : (headCore || head) + " ") + label;
    if (tail) name = name.replace(/\s+$/, "") + " " + tail;

    name = name.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
    return name || fallback;
}

function absoluteUrl(url) {
    var value = String(url || "").trim();
    if (!value) return "";
    if (value.indexOf("http://") === 0 || value.indexOf("https://") === 0) return value;
    return BASE_URL + (value.charAt(0) === "/" ? "" : "/") + value;
}

function buildStreamUrl(videoUrl) {
    var value = String(videoUrl || "").trim();
    if (!value) return "";

    if (/^https?:\/\//i.test(value)) {
        var match = value.match(/^https?:\/\/[^\/]+(\/.*)$/i);
        value = match ? match[1] : value;
    }
    value = value.replace(/^\/+/, "");

    return BASE_URL + "/api/v1/m3u8/proxy?path=" + encodeURIComponent(value);
}

function formatCount(value) {
    var number = Number(value) || 0;
    if (number >= 10000) {
        return (Math.round(number / 1000) / 10) + "万";
    }
    return String(number);
}

function formatDate(value) {
    var text = String(value || "");
    var match = text.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (match) return match[1] + "-" + match[2] + "-" + match[3] + " " + match[4] + ":" + match[5];
    return text;
}

function formatDuration(seconds) {
    var total = Math.floor(Number(seconds) || 0);
    if (total <= 0) return "";

    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = total % 60;

    if (hours > 0) return hours + "小时" + minutes + "分";
    if (minutes > 0) return minutes + "分" + secs + "秒";
    return secs + "秒";
}

function cleanTitle(title) {
    var original = String(title || "").trim();
    if (!original) return "";

    var value = original;

    value = value.replace(/[（(]\s*2048[^）)]*[）)]/g, " ");
    value = value.replace(/[【\[]\s*AI[^】\]]*(?:[】\]]|$)/gi, " ");
    value = value.replace(/(?:^|[\s\-—–·|/])(?:AI成人版|AI成人短剧|AI色情短剧|AI色情短片|AI色情版|AI改编成人短剧|AI改编版|AI真人版|AI短剧|AI漫剧|AI版)(?=$|[\s\-—–·|/、,，.。()（）\[\]【】《》〈〉]|[\u4e00-\u9fff])/gi, " ");
    value = value.replace(/^\s*2048[^\-—–:：]{0,12}[-—–:：]\s*/, "");
    value = value.replace(/^\s*[【\[]?[^】\]]{0,10}[】\]]?\s*[-—–:：]\s*(?=.)/, function (match) {
        return /原创|改编|投稿|承制|定制|发行|出品|制作|短剧|剧场|巨作|影改|漫剧|独家/.test(match) ? "" : match;
    });
    value = value.replace(/^\s*2048(?:原创短剧|原创巨作|原创作品|原创影改|原创漫剧|原创定制|原创动漫|长篇剧场|真实投稿改编|真实故事改编|真实故事投稿|独家承制|独家定制|用户制作|承制|原创|制作|出品|首发|独家)/, "");
    value = value.replace(/^\s*2048\s*[@&＆]+\s*/, "");

    value = value.replace(/\s+/g, " ");
    value = value.replace(/^[\s\-—–:：·、]+/, "");
    value = value.replace(/[\s\-—–]+$/, "");

    return value || original;
}

function toItem(drama) {
    if (!drama) return null;

    var id = drama.id;
    var tags = [];
    if (drama.rating !== null && drama.rating !== undefined && Number(drama.rating) > 0) {
        tags.push(drama.rating + "分");
    }
    if (drama.episodeCount) {
        tags.push(drama.episodeCount + "集");
    }
    if (drama.heatCount) {
        tags.push(formatCount(drama.heatCount) + "热度");
    }

    return {
        name: cleanTitle(drama.title),
        cover: absoluteUrl(drama.coverUrl),
        link: BASE_URL + "/media/short-dramas/" + id + "/episodes/1",
        description: "",
        tag: tags.join(" · ")
    };
}
