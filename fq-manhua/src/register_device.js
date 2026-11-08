load('fq-sha512.js');
load('fq-crypto.js');
load('fq-api.js');

function fqActionLog(message) {
    if (typeof Log !== "undefined" && Log.log) Log.log(message);
    else if (typeof console !== "undefined" && console.log) console.log(message);
}

function execute() {
    try {
        var deviceType = fqConfigString(typeof DEVICE_TYPE !== "undefined" ? DEVICE_TYPE : "", FQ_DEFAULT_DEVICE_TYPE);
        var deviceBrand = fqConfigString(typeof DEVICE_BRAND !== "undefined" ? DEVICE_BRAND : "", FQ_DEFAULT_DEVICE_BRAND);
        fqActionLog("Đang đăng ký device mới (type=" + deviceType + ", brand=" + deviceBrand + ")...");
        var result = fqRegisterAndSaveDevice(deviceType, deviceBrand);
        fqActionLog("device_id=" + result.device.device_id);
        fqActionLog("install_id=" + result.device.install_id);
        fqActionLog("keyver=" + result.key.keyver);
        return Response.success("Đã đăng ký device mới.\ndevice_id=" + result.device.device_id + "\ninstall_id=" + result.device.install_id + "\n\nChương tiếp theo sẽ dùng device này.");
    } catch (e) {
        return Response.error("Đăng ký device thất bại: " + fqErrorMessage(e));
    }
}
