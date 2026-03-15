# BÁO CÁO KIỂM THỬ PHẦN MỀM - HỆ THỐNG SMARTUNI

## 1. Thông tin chung
- **Dự án:** SmartUni (Hệ thống Quản lý Đại học Thông minh)
- **Công cụ quản lý:** GitHub Issues (hungnguyen67/SmartUni)
- **Nhóm thực hiện:** Nhóm ABC
- **Môi trường test:** Localhost (Docker), Chrome v12x

## 2. Quy trình Quản lý Lỗi (GitHub Issues Workflow)
Nhóm áp dụng quy trình quản lý lỗi tập trung hoàn toàn trên GitHub:
- **New (Issue):** Tester tạo báo cáo lỗi kèm các bước tái hiện và mức độ ảnh hưởng.
- **Labels:** Gắn nhãn `bug`, mức độ nghiêm trọng (`critical`, `high`, `minor`).
- **Assignee:** Gán lỗi cho Developer chịu trách nhiệm sửa chữa.
- **Verification:** Sau khi Developer fix, Tester thực hiện kiểm tra lại và đóng (Close) Issue nếu lỗi đã hết.

## 3. Danh sách 18 Lỗi (Bugs) phát hiện thực tế trong dự án

| # | Tiêu đề lỗi | Vị trí (Module) | Severity | Trạng thái |
|---|-------------|-----------------|----------|------------|
| 01 | **Hardcoded JWT Secret Key** (Lộ mã bí mật) | AuthController.java | **Critical** | Open |
| 02 | **Mật khẩu mặc định "Abc123"** quá yếu cho User mới | UserManagement | **High** | In Progress |
| 03 | **Lỗi tính toán ROUND(sum) = 1.00** trong Database | data.sql | **High** | Fixed |
| 04 | **Bypass Admin API** khi dùng token sinh viên | Auth/Admin API | **Critical** | Open |
| 05 | **Tìm kiếm sinh viên không ra** khi gõ Tiếng Việt có dấu | Search Module | **High** | Fixed |
| 06 | **Xóa sinh viên gây Foreign Key Error** (Crash Backend) | Student Service | **High** | Open |
| 07 | **Thiếu validation định dạng Email** khi mời người dùng | Invite User | **Medium** | Fixed |
| 08 | **Số lượng sinh viên đăng ký** vượt quá `max_students` | Registration | **Medium** | Open |
| 09 | **Trạng thái Login không tự cập nhật** khi token hết hạn | Frontend Auth | **Medium** | In Progress |
| 10 | **Sidebar bị che mất nội dung** trên màn hình Tablet | UI/UX | **Minor** | Fixed |
| 11 | **Lỗi Reset Password:** Token hết hạn quá nhanh (15p) | Auth | **Medium** | Open |
| 12 | **Dữ liệu Full Name** không reload sau khi đổi tên | Profile | **Minor** | Fixed |
| 13 | **Hiển thị sai thứ tự** Khối kiến thức trong Curriculum | Curriculum | **Medium** | Open |
| 14 | **Nút "Lưu" không bị vô hiệu hóa** khi Form đang validate | Shared Form | **Minor** | In Progress |
| 15 | **Spelling Error:** "Quản lý SInh Viên" trong Dashboard | UI Header | **Minor** | Fixed |
| 16 | **Lỗi 500 khi upload ảnh** đại diện dung lượng lớn | Profile | **High** | Open |
| 17 | **Thông báo (Toast) xuất hiện sai màu** (Lỗi hiện màu xanh) | Toast Component | **Minor** | Fixed |
| 18 | **Thiếu xác nhận khi thoát** khỏi Form đang nhập dở | UX | **Minor** | Open |

## 4. Phân tích chi tiết 2 Bug Nghiêm trọng (Critical)

### Bug 01: Hardcoded JWT Secret Key (Security Risk)
- **Mô tả:** Trong `AuthController.java`, chuỗi bí mật để ký JWT được ghi trực tiếp trong mã nguồn.
- **Hậu quả:** Nếu lộ mã nguồn, kẻ tấn công có thể giả mạo chữ ký JWT để giả danh làm bất kỳ người dùng nào, kể cả Admin.
- **Giải pháp:** Phải đưa vào biến môi trường hoặc file cấu hình bí mật bên ngoài.

### Bug 04: Lỗi phân quyền (Broken Access Control)
- **Mô tả:** Một số Endpoint dưới `/api/admin/*` không kiểm tra quyền ROLE_ADMIN một cách chặt chẽ ở tầng Security Filter.
- **Hậu quả:** Sinh viên nếu biết API có thể gọi yêu cầu lấy danh sách toàn bộ người dùng hoặc xóa dữ liệu.
- **Giải pháp:** Cần bổ sung `@PreAuthorize("hasRole('ADMIN')")` chuẩn xác cho từng phương thức trong Controller.

## 5. Kết luận
Việc tập trung toàn bộ lỗi lên **GitHub Issues** giúp nhóm phối hợp cực kỳ nhanh chóng. Với 18 lỗi được phát hiện, chúng em đã nắm lòng các lỗ hổng từ bảo mật Backend cho đến trải nghiệm người dùng trên Frontend.
