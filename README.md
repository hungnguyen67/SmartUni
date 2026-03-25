# SmartUni - Hệ thống Quản lý Đại học Thông minh

## Mô tả Dự án

SmartUni là một hệ thống quản lý đại học toàn diện được xây dựng để hỗ trợ các hoạt động đào tạo, quản lý sinh viên, giảng viên và các quy trình học thuật. Dự án bao gồm hai phần chính: backend được phát triển bằng Spring Boot (Java) và frontend sử dụng Angular (TypeScript). Hệ thống cung cấp giao diện web thân thiện cho người dùng và API RESTful mạnh mẽ cho việc tích hợp.

### Tính năng Chính

- **Quản trị Tài khoản & Bảo mật đa lớp**: Hệ thống phân quyền chuyên sâu (RBAC) dành cho Admin, Giảng viên và Sinh viên. Đảm bảo an toàn thông tin với cơ chế xác thực JWT kết hợp đăng nhập một chạm qua Google OAuth2.
- **Quản lý Cấu trúc Đào tạo**: Số hóa toàn diện danh mục Chuyên ngành, Khối kiến thức và Môn học. Hỗ trợ xây dựng Chương trình đào tạo (Curriculum) linh hoạt theo chuẩn tín chỉ hiện đại.
- **Điều phối Khóa học & Lịch học**: Quản lý mở lớp học phần tự động, sắp xếp lịch giảng dạy và lịch thi, tối ưu hóa quá trình điều phối học thuật.
- **Cổng Đăng ký & Theo dõi Điểm số**: Cho phép sinh viên đăng ký môn học trực tuyến, theo dõi tiến độ học tập và hiển thị bảng điểm chi tiết theo từng học kỳ.
- **Trung tâm Báo cáo & Thống kê**: Tự động hóa việc xuất các báo cáo kết quả học tập, thống kê hiệu suất đào tạo và phân tích dữ liệu sinh viên.

### Kiến trúc Hệ thống

- **Backend (Spring Boot)**: Xử lý logic nghiệp vụ, API REST, bảo mật, và tương tác cơ sở dữ liệu.
- **Frontend (Angular)**: Giao diện người dùng responsive, sử dụng Tailwind CSS cho styling.
- **Cơ sở dữ liệu**: MySQL với schema được định nghĩa trong `data.sql`.
- **Triển khai**: Sử dụng Docker và Docker Compose để container hóa ứng dụng.

## Công nghệ Sử dụng

- **Backend**:
  - Java 17+
  - Spring Boot 3.x
  - Spring Security (JWT, OAuth2)
  - Spring Data JPA
  - MySQL 8.0
  - Maven

- **Frontend**:
  - Angular 15+
  - TypeScript
  - Tailwind CSS
  - RxJS

- **DevOps**:
  - Docker & Docker Compose
  - GitHub Actions (CI/CD)
  - Nginx (cho frontend production)

## Yêu cầu Hệ thống

- **Java**: JDK 17 hoặc cao hơn
- **Node.js**: 18+ (cho Angular)
- **MySQL**: 8.0+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

## Cài đặt và Chạy Dự án

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd SmartUni
```

### 2. Cấu hình Cơ sở dữ liệu

- Cài đặt MySQL và tạo database `smartuni`.
- Import schema từ `backend/src/main/resources/data.sql`.

### 3. Chạy Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend sẽ chạy trên `http://localhost:8001`.

### 4. Chạy Frontend

```bash
cd frontend
npm install
ng serve
```

Frontend sẽ chạy trên `http://localhost:4200`.

### 5. Triển khai với Docker (Khuyến nghị)

```bash
docker-compose up --build -d

docker-compose down
```

- Backend: `http://localhost:8001`
- Frontend: `http://localhost:4200`

## Cấu trúc Dự án

```
SmartUni/
├── backend/                 # Spring Boot application
│   ├── src/main/java/com/example/demo/
│   │   ├── config/          # Cấu hình Security, JWT, CORS
│   │   ├── controller/      # REST Endpoints 
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── model/           # JPA Entities & Database Mapping
│   │   ├── repository/      # Spring Data JPA Repositories
│   │   └── service/         # Business Logic xử lý nghiệp vụ
│   ├── src/main/resources/
│   │   ├── application.properties  # Cấu hình Database & JWT
│   │   └── data.sql         # Database Schema & Sample Data
│   ├── Dockerfile           # Docker config cho Backend
│   └── pom.xml              # Maven dependencies
├── frontend/                # Angular application
│   ├── src/app/
│   │   ├── components/      # Các UI Components chính
│   │   ├── services/        # Services tương tác với Backend API
│   │   ├── shared/          # Shared components & Layouts
│   │   └── app.module.ts    # Module cấu hình chính
│   ├── Dockerfile           # Docker config cho Frontend
│   ├── angular.json         # Cấu hình Angular CLI
│   ├── tailwind.config.js   # Cấu hình Tailwind CSS
│   └── package.json         # Quản lý dependencies NPM
├── docker-compose.yml       # Cấu hình chạy Docker (Full Stack)
├── TEST_REPORT.md           # Báo cáo kết quả kiểm thử
├── bản kế hoạch.md          # Kế hoạch kiểm thử & Quy trình thực hiện
└── README.md                # Tài liệu hướng dẫn sử dụng
```

## Cấu hình

### Backend (application.properties)
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smartuni
spring.datasource.username=your_username
spring.datasource.password=your_password
jwt.secret=your_jwt_secret
```

### Frontend (environment files)
- `src/environments/environment.ts` - Cấu hình development
- `src/environments/environment.prod.ts` - Cấu hình production

## CI/CD với GitHub Actions

Dự án sử dụng GitHub Actions để tự động build và push Docker images lên Docker Hub.

### Thiết lập Secrets
Trong repository settings, thêm:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Workflow sẽ trigger khi push lên branch `main`.

## Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## Liên hệ

- **Tác giả:** Nguyễn Tuấn Hưng
- **Email:** hungnn91296@gmail.com
- **GitHub:** https://github.com/hungnguyen67