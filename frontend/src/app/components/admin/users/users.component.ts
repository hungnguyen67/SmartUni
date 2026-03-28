import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core'; // Thêm ChangeDetectorRef
import { AuthService } from '../../../auth.service';
import { HttpClient } from '@angular/common/http';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';
import { MajorService } from '../../../services/major.service';
import { AdministrativeClassService } from '../../../services/administrative-class.service';
import { CurriculumService } from '../../../services/curriculum.service';
import { FacultyService } from '../../../services/faculty.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;

  // Filter states
  filterRole = '';
  filterStatus = '';
  filterVerified = '';
  filterFaculty = '';
  faculties: any[] = [];
  allClasses: any[] = [];
  filteredClasses: any[] = [];
  allCurriculums: any[] = [];

  // Modal & Dropdown states
  showInviteForm = false;
  showDeleteModal = false;
  showEditModal = false;
  isEditing = false;
  activeDropdown = '';
  showFilter = false;
  originalUser: any = null;


  // Invite/Delete states
  inviteEmail = '';
  inviteRole = 'STUDENT';
  inviteFaculty = '';
  inviting = false;
  deletingUser = false;
  userToDelete: any = null;
  availableRoles: any[] = [];

  savingUser = false;
  currentUser: any = {};

  // Multi-step Invite
  inviteStep = 1;
  inviteData: any = {
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    gender: 'Male',
    enrollmentYear: new Date().getFullYear()
  };

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private flashMessage: FlashMessageService,
    private majorService: MajorService,
    private classService: AdministrativeClassService,
    private curriculumService: CurriculumService,
    private facultyService: FacultyService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
    this.loadFaculties();
    this.loadClasses();
    this.loadCurriculums();
  }

  // Tự động đóng dropdown khi click ra ngoài
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-menu-wrapper')) {
      this.showFilter = false;
      this.activeDropdown = '';
    }
  }

  toggleFilter(event: MouseEvent) {
    event.stopPropagation();
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.activeDropdown = '';
    }
  }

  loadFaculties() {
    this.facultyService.getFaculties().subscribe(faculties => {
      this.faculties = faculties; // Giữ nguyên object để lấy id và name
    });
  }

  loadClasses() {
    this.classService.getClasses().subscribe(classes => {
      this.allClasses = classes;
      this.updateFilteredClasses();
    });
  }

  loadCurriculums() {
    this.curriculumService.getCurriculums().subscribe(curriculums => {
      this.allCurriculums = curriculums;
    });
  }

  loadUsers() {
    this.auth.getUsers().subscribe({
      next: (res) => {
        this.users = (res.users || []).sort((a: any, b: any) => b.id - a.id);
        this.onSearch();
      },
      error: (err) => this.flashMessage.handleError(err)
    });
  }

  onSearch() {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm ||
        user.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = !this.filterRole || user.role === this.filterRole;
      const matchesStatus = !this.filterStatus || (user.accountStatus || 'ACTIVE') === this.filterStatus;
      const matchesVerified = !this.filterVerified ||
        (this.filterVerified === 'true' ? user.isEmailVerified : !user.isEmailVerified);
      const matchesFaculty = !this.filterFaculty || user.facultyName === this.filterFaculty;

      return matchesSearch && matchesRole && matchesStatus && matchesVerified && matchesFaculty;
    });
    this.currentPage = 1;
  }

  onEnrollmentYearChange() {
    const target = this.showEditModal ? this.currentUser : this.inviteData;
    const year = target.enrollmentYear;

    // Lọc lại danh sách lớp cho năm mới này
    this.updateFilteredClasses(year);

    // Nếu lớp đang chọn không tồn tại trong danh sách lớp của năm nhập học mới -> Reset lớp
    if (target.className && !this.filteredClasses.some(c => c.className === target.className)) {
      target.className = '';
      target.classId = undefined;
    }
  }

  updateFilteredClasses(year?: number) {
    const filterYear = year || (this.showEditModal ? this.currentUser.enrollmentYear : this.inviteData.enrollmentYear);
    if (filterYear) {
      this.filteredClasses = this.allClasses.filter(c =>
        c.cohort === filterYear ||
        c.academicYear?.includes(filterYear.toString())
      );
    } else {
      this.filteredClasses = this.allClasses;
    }
  }

  // Label Helpers
  getRoleLabel() {
    const roles: any = { 'LECTURER': 'Giảng viên', 'STUDENT': 'Sinh viên' };
    return roles[this.filterRole] || 'Tất cả Vai trò';
  }

  getStatusLabel() {
    const statuses: any = { 'ACTIVE': 'Đang hoạt động', 'LOCKED': 'Đã khóa', 'DISABLED': 'Vô hiệu hóa' };
    return statuses[this.filterStatus] || 'Tất cả Trạng thái';
  }

  getVerifyLabel() {
    const verifies: any = { 'true': 'Đã xác thực', 'false': 'Chưa xác thực' };
    return verifies[this.filterVerified] || 'Tất cả Xác thực';
  }

  // Pagination Logic
  get paginatedUsers(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }

  get minEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredUsers.length);
  }

  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }

  // Modal Handlers
  inviteUser() {
    const data = {
      ...this.inviteData,
      email: this.inviteData.email,
      role: this.inviteData.role
    };

    if (!data.userCode || !data.userCode.trim()) {
      this.flashMessage.error('Vui lòng nhập mã số');
      return;
    }
    if (!data.email || !data.email.trim()) {
      this.flashMessage.error('Vui lòng nhập email');
      return;
    }
    if (!data.lastName || !data.lastName.trim()) {
      this.flashMessage.error('Vui lòng nhập họ đệm');
      return;
    }
    if (!data.firstName || !data.firstName.trim()) {
      this.flashMessage.error('Vui lòng nhập tên');
      return;
    }

    if (data.role === 'LECTURER') {
      if (!data.facultyName) {
        this.flashMessage.error('Vui lòng chọn khoa công tác');
        return;
      }
    } else if (data.role === 'STUDENT') {
      if (!data.enrollmentYear) {
        this.flashMessage.error('Vui lòng nhập năm nhập học');
        return;
      }
      if (!data.className) {
        this.flashMessage.error('Vui lòng chọn lớp hành chính');
        return;
      }
      if (!data.curriculumName) {
        this.flashMessage.error('Vui lòng chọn chương trình đào tạo');
        return;
      }
    }

    this.inviting = true;
    this.http.post('http://localhost:8001/api/admin/users', data, this.auth.getAuthHeaders()).subscribe({
      next: (res: any) => {
        this.inviting = false;
        this.flashMessage.success(res.message);
        this.closeInviteModal();
        this.loadUsers();
      },
      error: (err) => {
        this.inviting = false;
        this.flashMessage.error(err.error?.error || 'Lỗi gửi lời mời');
      }
    });
  }

  nextInviteStep() {
    if (this.inviteStep === 1) {
      // Validate step 1 if needed
      if (!this.inviteData.email || !this.inviteData.firstName || !this.inviteData.lastName || !this.inviteData.userCode) {
        this.flashMessage.error('Vui lòng điền đầy đủ các trường bắt buộc (*)');
        return;
      }
    }
    this.inviteStep++;
  }

  prevInviteStep() {
    this.inviteStep--;
  }

  confirmDelete() {
    if (!this.userToDelete) return;
    this.deletingUser = true;
    this.auth.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.flashMessage.success(`Đã xóa ${this.userToDelete.name}`);
        this.resetFilters();
        this.closeDeleteModal();
        this.loadUsers();
      },
      error: (err) => {
        this.deletingUser = false;
        this.flashMessage.handleError(err);
      }
    });
  }

  closeInviteModal() {
    this.showInviteForm = false;
    this.inviteStep = 1;
    this.inviteData = {
      role: 'STUDENT',
      accountStatus: 'ACTIVE',
      gender: 'Male'
    };
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.userToDelete = null;
    this.deletingUser = false;
  }

  openDeleteModal(user: any) {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeInviteModal();
      this.closeDeleteModal();
      this.closeEditModal();
    }
  }

  openEditModal(user: any) {
    this.currentUser = { ...user };

    // Nếu là sinh viên, cần lấy thêm thông tin năm nhập học, lớp, chương trình (nếu backend trả về)
    // Nếu chưa có, mặc định năm hiện tại
    if (this.currentUser.role === 'STUDENT' && !this.currentUser.enrollmentYear) {
      this.currentUser.enrollmentYear = new Date().getFullYear();
    }

    this.updateFilteredClasses(this.currentUser.enrollmentYear);
    this.isEditing = true;
    this.originalUser = { ...this.currentUser };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.isEditing = false;
    this.currentUser = {};
    this.originalUser = null;
    this.activeDropdown = '';
  }

  saveUser() {
    if (this.isEditing && !this.hasChanges()) {
      this.flashMessage.info('Không có thay đổi nào để cập nhật');
      return;
    }

    const data = this.currentUser;
    if (!data.email || !data.email.trim()) {
      this.flashMessage.error('Vui lòng nhập email');
      return;
    }
    if (!data.lastName || !data.lastName.trim()) {
      this.flashMessage.error('Vui lòng nhập họ đệm');
      return;
    }
    if (!data.firstName || !data.firstName.trim()) {
      this.flashMessage.error('Vui lòng nhập tên');
      return;
    }

    if (data.role === 'LECTURER') {
      if (!data.facultyName) {
        this.flashMessage.error('Vui lòng chọn khoa công tác');
        return;
      }
    } else if (data.role === 'STUDENT') {
      if (!data.enrollmentYear) {
        this.flashMessage.error('Vui lòng nhập năm nhập học');
        return;
      }
      if (!data.className) {
        this.flashMessage.error('Vui lòng chọn lớp hành chính');
        return;
      }
      if (!data.curriculumName) {
        this.flashMessage.error('Vui lòng chọn chương trình đào tạo');
        return;
      }
    }

    this.savingUser = true;
    this.http.put(`http://localhost:8001/api/admin/users/${this.currentUser.id}`, this.currentUser, this.auth.getAuthHeaders())
      .subscribe({
        next: (res: any) => {
          this.savingUser = false;
          this.flashMessage.success(res.message);
          this.closeEditModal();
          this.loadUsers();
        },
        error: (err) => {
          this.savingUser = false;
          this.flashMessage.error(err.error?.error || 'Lỗi cập nhật tài khoản');
        }
      });
  }

  hasChanges(): boolean {
    if (!this.originalUser || !this.currentUser) return false;

    // So sánh các trường chính
    return this.currentUser.firstName !== this.originalUser.firstName ||
      this.currentUser.lastName !== this.originalUser.lastName ||
      this.currentUser.userCode !== this.originalUser.userCode ||
      this.currentUser.email !== this.originalUser.email ||
      this.currentUser.phone !== this.originalUser.phone ||
      this.currentUser.birthday !== this.originalUser.birthday ||
      this.currentUser.address !== this.originalUser.address ||
      this.currentUser.gender !== this.originalUser.gender ||
      this.currentUser.accountStatus !== this.originalUser.accountStatus ||
      this.currentUser.roleId !== this.originalUser.roleId ||
      this.currentUser.facultyId !== this.originalUser.facultyId ||
      this.currentUser.facultyName !== this.originalUser.facultyName ||
      this.currentUser.enrollmentYear !== this.originalUser.enrollmentYear ||
      this.currentUser.classId !== this.originalUser.classId ||
      this.currentUser.curriculumId !== this.originalUser.curriculumId;
  }

  setUserGender(gender: string) {
    this.currentUser.gender = gender;
    this.activeDropdown = '';
  }

  setUserStatus(status: string) {
    this.currentUser.accountStatus = status;
    this.activeDropdown = '';
  }

  setUserRole(roleId: number) {
    this.currentUser.roleId = roleId;
    this.activeDropdown = '';
  }


  // Display Helpers
  getStatusName(status: string): string {
    const map: any = { 'ACTIVE': 'Đang hoạt động', 'LOCKED': 'Đã khóa', 'DISABLED': 'Vô hiệu hóa' };
    return map[status] || 'Đang hoạt động';
  }

  getRoleName(role: string): string {
    return role === 'STUDENT' ? 'Sinh viên' : role === 'LECTURER' ? 'Giảng viên' : role;
  }

  getVerifiedStatus(v: boolean) { return v ? 'Đã xác thực' : 'Chưa xác thực'; }

  getGenderName(gender: string): string {
    if (!gender) return 'Chưa cập nhật';
    if (gender === 'Male' || gender === 'MALE') return 'Nam';
    if (gender === 'Female' || gender === 'FEMALE') return 'Nữ';
    return 'Khác';
  }

  loadRoles() {
    this.http.get('http://localhost:8001/api/admin/roles', this.auth.getAuthHeaders()).subscribe({
      next: (res: any) => this.availableRoles = res.roles || []
    });
  }

  resetFilters() {
    this.searchTerm = '';
    this.filterRole = '';
    this.filterStatus = '';
    this.filterVerified = '';
    this.filterFaculty = '';
    this.onSearch();
  }
}
