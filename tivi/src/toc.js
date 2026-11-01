load('lib.js');

function execute(url) {
    var channel = tiviFindChannel(url);
    return Response.success([
        {
            name: "Xem trực tiếp",
            url: url,
            description: channel ? tiviGroupsOf(channel).join(", ") : "",
            lock: false,
            pay: false
        }
    ]);
}
