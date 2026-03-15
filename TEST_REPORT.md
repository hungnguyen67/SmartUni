# BÁO CÁO KIỂM THỬ PHẦN MỀM - HỆ THỐNG SMARTUNI

## 1. Thông tin chung
- **Dự án:** SmartUni (Hệ thống Quản lý Đại học Thông minh)
- **Công cụ quản lý:** GitHub Issues
- **Môi trường test:** Localhost, Chrome v12x
- **Vai trò test (Role):** Quản trị viên (Admin)

## 2. Quy trình Quản lý Lỗi
- **New:** Tester phát hiện và tạo báo cáo lỗi trên hệ thống tracking.
- **Priority:** Phân loại lỗi (Critical, High, Medium, Minor).
- **Fixing:** Developer (Backend/Frontend) tiếp nhận và thực hiện chỉnh sửa.
- **Closed:** Tester kiểm tra lại bằng tài khoản Admin và đóng lỗi.

## 3. Danh sách 18 Lỗi (Bugs) dưới góc độ của Role Admin

Dưới đây là 18 lỗi được phát hiện khi thưc hiện kiểm thử (test) các chức năng **dành riêng cho quyền Quản trị (Admin System)**. Mức độ lỗi tập trung ở chuẩn mức "Trung bình" (UX, Validation, Logic API).

| # | Tiêu đề lỗi | Module quản trị | Severity | Trạng thái |
|---|-------------|----------------|----------|------------|
| 01 | **Validation:** Form "Mời người dùng" không chặn nhập Email sai định dạng (ví dụ: `admin@com`) | Quản lý Tài khoản | **Medium** | Open |
| 02 | **Logic:** Cho phép tạo 2 Học phần (Subject) có cùng "Mã học phần" mà không báo lỗi trùng lặp | Quản lý Học phần | **High** | Open |
| 03 | **Tìm kiếm:** Gõ tiếng Việt chữ thường ("nguyễn") không tìm thấy sinh viên tên "Nguyễn" | Quản lý Sinh viên | **Medium** | Open |
| 04 | **UX nguy hiểm:** Xóa một Ngành học (Major) thực thi ngay lập tức mà không có Popup hỏi xác nhận | Quản lý Đào tạo | **High** | Open |
| 05 | **Phân trang:** Khi đang ở Trang 2, nếu Test tìm kiếm một từ khóa thì bảng không trở về Trang 1 | Giao diện Chung | **Medium** | Open |
| 06 | **Crash/500:** Xóa Giảng viên đang đứng lớp hiện thông báo lỗi 500 thay vì báo "Đang có dữ liệu liên kết" | Quản lý Giảng dạy | **High** | Open |
| 07 | **Validation:** Form thêm "Học kỳ" cho phép Ngày kết thúc diễn ra trước Ngày bắt đầu | Quản lý Học kỳ | **Medium** | Open |
| 08 | **Bảo mật:** Mật khẩu mặc định hệ thống tự gửi qua mail cho tài khoản mới luôn là "Abc123" | Quản lý Tài khoản | **High** | Open |
| 09 | **UI/UX:** Tên Admin quá dài ở góc phải thanh Header làm vỡ layout của menu Đăng xuất | Layout chung | **Minor** | Open |
| 10 | **Logic:** Cho phép sửa Sĩ số tối đa (Max Students) của lớp nhỏ hơn số Sinh viên đang đăng ký | Quản lý Lớp HP | **High** | Open |
| 11 | **Hiển thị:** Danh sách Khối kiến thức trong Chương trình Đào tạo hiển thị lộn xộn, không theo thứ tự | CT Đào tạo | **Medium** | Open |
| 12 | **UX Form:** Nút "Lưu" không khóa khi call API, Admin nhấn đúp chuột sinh ra 2 bản ghi giống nhau | Form chung | **Medium** | Open |
| 13 | **Validation:** Cập nhật Hồ sơ Admin cho phép gõ ký tự chữ cái vào trường "Số điện thoại" | Hồ sơ cá nhân | **Medium** | Open |
| 14 | **Hiển thị:** Các trường dữ liệu "Mô tả" (Description) bị bỏ trống hiển thị chữ `null` thay vì ô trống | Quản lý Lớp HC | **Minor** | Open |
| 15 | **Trạng thái:** Chuyển đổi giữa menu Quản lý Lớp & Sinh viên bị mất trạng thái Bộ lọc (Filter) cũ | Chức năng Lọc | **Medium** | Open |
| 16 | **Xác thực:** Tính năng quên/cấp lại mật khẩu cho phép Admin đặt pass mới trùng với pass cũ | Đăng nhập | **Medium** | Open |
| 17 | **Màu sắc UI:** Khi xóa thất bại, Toast Notification hiện màu Xanh Lá (thành công) với thông báo Lỗi | UI Component | **Minor** | Open |
| 18 | **UX Dữ liệu:** Nhấn phím `Esc` khi nhập Form thêm lớp bị đóng ngay, không cảnh báo mất dữ liệu | Form chung | **Medium** | Open |

## 4. Phân tích chi tiết 2 Bug quan trọng đối với Admin

### Bug 06: Crash do vi phạm dữ liệu khóa ngoại (Foreign Key)
- **Mô tả:** Khi thao tác "Xóa" một cấu hình (Người dùng, Lớp học, Giảng viên) đã có dữ liệu ràng buộc, thay vì catch exception và báo *"Hệ thống không thể xóa do đang có sinh viên đăng ký"*, API quăng thẳng Error 500 ra Fontend.
- **Hậu quả:** Admin không hiểu nguyên nhân lỗi là gì, màn hình bị khựng lại hoặc báo Red Toast khó hiểu.
- **Giải pháp:** Bắt lỗi `DataIntegrityViolationException` tại tầng Controller và trả về HTTP 400 Bad Request kèm message rõ ràng.

### Bug 12: Multiple Requests khi nhấn đúp chuột (Double click)
- **Mô tả:** Admin thao tác bấm nút "Cập nhật / Lưu" hơi nhanh (2-3 lần) trong Form thêm Lớp học phần.
- **Hậu quả:** Hệ thống gửi liên tiếp 3 HTTP POST request, tạo ra 3 Lớp học trùng lặp tại Database.
- **Giải pháp:** Cập nhật logic ở Frontend: State `loading = true` ngay sau khi nhấn, bind vào thẻ HTML `[disabled]="loading"` để chặn thao tác chuột.

## 5. Kết luận
Các lỗi mô tả phía trên được ghi nhận khi thử đóng vai thành một "Super User" (Admin) thao tác vận hành các cấu hình cốt lõi. Chúng bao gồm các bài toán phổ biến của các Web Tool nội bộ: Validation trên Form lỏng lẻo, Quên xử lý logic chặn sai sót dữ liệu và UX phân trang chưa được tối ưu.