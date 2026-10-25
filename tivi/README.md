# Hướng dẫn xem tiVi

## Cài đặt và cấu hình

1. Cài extension, mở phần **Cài đặt** của extension.
2. Thêm nguồn playlist:
   - **Playlist M3U**: thêm URL `.m3u`/`.m3u8` dùng cho nút **Làm mới playlist**.
   - **Playlist đã lưu (M3U)**: chứa nội dung M3U thô, sửa trực tiếp từng dòng.
3. Bấm **Làm mới playlist** để tải các URL và cập nhật các dòng tương ứng.
   - Chỉ các dòng có `key` trùng URL nguồn bị cập nhật.
   - Dòng tự thêm (`key` khác URL nguồn) được giữ nguyên.
   - Dòng thủ công được ưu tiên nếu trùng URL kênh với dòng tải từ URL.
   - Dòng của URL đã xoá khỏi cấu hình vẫn được giữ; xoá tay nếu không dùng.
   - Playlist không tự tải lại; không có cache 6 giờ.
4. Có thể dán raw M3U vào bảng **Playlist đã lưu**:
   - Thêm dòng, `key` tuỳ ý (ví dụ `manual`), `value` là toàn bộ nội dung M3U.
   - Nếu playlist dùng link tương đối, đặt `key` dạng `manual|https://nguồn/` để làm base URL.
5. Nếu playlist cần User-Agent hoặc Referer, điền ở hai mục tương ứng.
   - Hai giá trị này dùng khi tải playlist và cho luồng phát nếu kênh không có header riêng.
6. Vào trang chủ extension, chọn nhóm hoặc gõ tên kênh để tìm.
   - Trang chủ hiện tối đa 20 nhóm đầu; xem đầy đủ ở mục **Thể loại**.

## Lưu ý

- Extension không kèm sẵn kênh; bạn tự cung cấp playlist.
- **Làm mới playlist** ghi đè nội dung các dòng lấy từ URL. Nếu muốn giữ chỉnh sửa, copy dòng đó sang một `key` khác (ví dụ `manual`) trước khi refresh.
- HLS (`.m3u8`), MPEG-TS, MP4, MKV và WebM được hỗ trợ tốt nhất.
- DASH (`.mpd`) được hỗ trợ; kênh dùng ClearKey (`license_type=clearkey` + `license_key` tĩnh) có thể phát được.
- Widevine/PlayReady/FairPlay và license server động chưa được hỗ trợ.
- Dữ liệu lưu trong database của extension; gỡ extension sẽ xoá dữ liệu.
