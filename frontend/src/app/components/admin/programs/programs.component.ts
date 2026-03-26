import { Component, OnInit, HostListener } from '@angular/core';
import { MajorService, MajorDTO } from '../../../services/major.service';
import { FacultyService, FacultyDTO } from '../../../services/faculty.service';
import { Router } from '@angular/router';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';

@Component({
  selector: 'app-programs',
  templateUrl: './programs.component.html'
})
export class ProgramsComponent implements OnInit {

  majors: MajorDTO[] = [];
  filteredMajors: MajorDTO[] = [];
  searchTerm: string = '';
  selectedStatus: string = '';
  selectedFacultyId: string = '';
  faculties: FacultyDTO[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 10;

  showModal: boolean = false;
  isEditing: boolean = false;
  showFilter: boolean = false;
  activeDropdown: string = '';
  currentMajor: Partial<MajorDTO> = {};
  originalMajor: MajorDTO | null = null;

  showDeleteModal: boolean = false;
  majorToDelete: MajorDTO | null = null;
  deletingMajor: boolean = false;
  savingMajor: boolean = false;
  selectedMajor: MajorDTO | null = null;

  constructor(
    private majorService: MajorService,
    private facultyService: FacultyService,
    private router: Router,
    private flashMessage: FlashMessageService
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-menu-wrapper')) {
      this.showFilter = false;
      this.activeDropdown = '';
    }
  }

  ngOnInit(): void {
    this.loadMajors();
    this.loadFaculties();
  }

  loadMajors(): void {
    this.majorService.getMajors().subscribe(data => {
      this.majors = data.sort((a, b) => (b.id || 0) - (a.id || 0));
      this.onSearch();
    });
  }

  loadFaculties(): void {
    this.facultyService.getFaculties().subscribe(data => {
      this.faculties = data;
    });
  }

  toggleFilter(event: MouseEvent): void {
    event.stopPropagation();
    this.showFilter = !this.showFilter;
  }

  handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
      this.closeDeleteModal();
    }
  }


  onSearch(): void {
    this.filteredMajors = this.majors.filter(major => {
      const search = this.searchTerm.toLowerCase();
      const matchesSearch = !this.searchTerm ||
        major.majorCode.toLowerCase().includes(search) ||
        major.majorName.toLowerCase().includes(search) ||
        (major.description && major.description.toLowerCase().includes(search));

      const matchesStatus = !this.selectedStatus || major.status === this.selectedStatus;
      const matchesFaculty = !this.selectedFacultyId || major.facultyId === Number(this.selectedFacultyId);

      return matchesSearch && matchesStatus && matchesFaculty;
    });
    this.currentPage = 1;
  }

  getSelectedFacultyLabel(): string {
    if (!this.selectedFacultyId) return 'Tất cả các khoa';
    const faculty = this.faculties.find(f => f.id.toString() === this.selectedFacultyId);
    return faculty ? faculty.facultyName : 'Tất cả các khoa';
  }

  getSelectedStatusLabel(): string {
    if (!this.selectedStatus) return 'Tất cả Trạng thái';
    return this.getStatusLabel(this.selectedStatus);
  }

  getModalFacultyLabel(): string {
    if (!this.currentMajor.facultyId) return 'Chọn khoa';
    const faculty = this.faculties.find(f => f.id === Number(this.currentMajor.facultyId));
    return faculty ? faculty.facultyName : 'Chọn khoa';
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedFacultyId = '';
    this.onSearch();
  }

  get paginatedMajors(): MajorDTO[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredMajors.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredMajors.length / this.itemsPerPage) || 1;
  }

  get minEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredMajors.length);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentMajor = {
      majorCode: '',
      majorName: '',
      description: '',
      facultyId: undefined,
      status: 'DRAFT'
    };
    this.showModal = true;
  }

  editMajor(major: MajorDTO): void {
    this.isEditing = true;
    this.originalMajor = { ...major };
    this.currentMajor = { ...major };
    this.showModal = true;
  }

  hasChanges(): boolean {
    if (!this.isEditing) return true;
    if (!this.originalMajor) return false;

    return this.currentMajor.majorCode !== this.originalMajor.majorCode ||
      this.currentMajor.majorName !== this.originalMajor.majorName ||
      this.currentMajor.facultyId !== this.originalMajor.facultyId ||
      this.currentMajor.description !== this.originalMajor.description ||
      this.currentMajor.status !== this.originalMajor.status;
  }

  closeModal(): void {
    this.showModal = false;
    this.originalMajor = null;
  }

  deleteMajor(major: MajorDTO): void {
    this.majorToDelete = major;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.majorToDelete = null;
    this.deletingMajor = false;
  }

  confirmDelete(): void {
    if (this.majorToDelete) {
      this.deletingMajor = true;
      this.majorService.deleteMajor(this.majorToDelete.id).subscribe({
        next: () => {
          this.flashMessage.success(`Đã xóa ngành ${this.majorToDelete?.majorName}`);
          this.loadMajors();
          this.closeDeleteModal();
        },
        error: (err) => {
          this.deletingMajor = false;
          this.flashMessage.handleError(err);
        }
      });
    }
  }

  saveMajor(): void {
    const m = this.currentMajor;
    if (!m.majorCode) {
      this.flashMessage.error('Vui lòng nhập mã ngành học');
      return;
    }
    if (!m.majorName) {
      this.flashMessage.error('Vui lòng nhập tên ngành học');
      return;
    }
    if (!m.facultyId) {
      this.flashMessage.error('Vui lòng chọn khoa trực thuộc');
      return;
    }

    if (this.isEditing && !this.hasChanges()) {
      this.flashMessage.info('Không có thay đổi nào để cập nhật');
      return;
    }

    if (this.isEditing) {
      this.savingMajor = true;
      this.majorService.updateMajor(this.currentMajor.id!, this.currentMajor).subscribe({
        next: () => {
          this.flashMessage.success('Cập nhật ngành học thành công');
          this.loadMajors();
          this.closeModal();
          this.savingMajor = false;
        },
        error: (err) => {
          this.savingMajor = false;
          this.flashMessage.handleError(err);
        }
      });
    } else {
      this.savingMajor = true;
      this.majorService.createMajor(this.currentMajor).subscribe({
        next: () => {
          this.flashMessage.success('Thêm ngành học mới thành công');
          this.loadMajors();
          this.closeModal();
          this.savingMajor = false;
        },
        error: (err) => {
          this.savingMajor = false;
          this.flashMessage.handleError(err);
        }
      });
    }
  }

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'ACTIVE': return 'Đang hoạt động';
      case 'DRAFT': return 'Bản nháp';
      case 'INACTIVE': return 'Ngưng hoạt động';
      default: return 'Không xác định';
    }
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'DRAFT': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'INACTIVE': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }
}
