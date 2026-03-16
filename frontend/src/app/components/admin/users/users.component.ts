import { Component, OnInit, HostListener } from '@angular/core'; // Thêm HostListener
import { AuthService } from '../../../auth.service';
import { HttpClient } from '@angular/common/http';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';
import { MajorService } from '../../../services/major.service';

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
  faculties: string[] = [];

  // Modal & Dropdown states
  showInviteForm = false;
  showDeleteModal = false;
  activeDropdown = '';
  showFilter = false;

  // Invite/Delete states
  inviteEmail = '';
  inviteRole = 'STUDENT';
  inviteFaculty = '';
  inviting = false;
  deletingUser = false;
  userToDelete: any = null;
  availableRoles: any[] = [];

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private flashMessage: FlashMessageService,
    private majorService: MajorService
  ) { }

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
    this.loadFaculties();
  }

  // Tự động đóng dropdown khi click ra ngoài
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.activeDropdown = '';
    }
  }

  loadFaculties() {
    this.majorService.getMajors().subscribe(majors => {
      const uniqueFaculties = new Set(majors.map(m => m.facultyName));
      this.faculties = Array.from(uniqueFaculties).sort();
    });
  }

  loadUsers() {
    this.auth.getUsers().subscribe({
      next: (res) => {
        this.users = res.users || [];
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
    if (!this.inviteEmail) return;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(this.inviteEmail)) {
      this.flashMessage.error('Email không đúng định dạng. Vui lòng nhập email hợp lệ (ví dụ: user@example.com)');
      return;
    }

    this.inviting = true;
    this.http.post('http://localhost:8001/api/admin/users', {
      email: this.inviteEmail,
      role: this.inviteRole,
      facultyName: this.inviteFaculty
    }, this.auth.getAuthHeaders()).subscribe({
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

  confirmDelete() {
    if (!this.userToDelete) return;
    this.deletingUser = true;
    this.auth.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.flashMessage.success(`Đã xóa ${this.userToDelete.name}`);
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
    this.inviteEmail = '';
    this.inviteRole = 'STUDENT';
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
    }
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

  loadRoles() {
    this.http.get('http://localhost:8001/api/admin/roles', this.auth.getAuthHeaders()).subscribe({
      next: (res: any) => this.availableRoles = res.roles || []
    });
  }
}