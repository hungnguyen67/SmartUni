import { Component, OnInit, HostListener } from '@angular/core';
import { Semester, SemesterService } from '../../../services/semester.service';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';

@Component({
    selector: 'app-semesters',
    templateUrl: './semesters.component.html'
})
export class SemestersComponent implements OnInit {
    semesters: Semester[] = [];
    filteredSemesters: Semester[] = [];
    loading = true;

    currentPage: number = 1;
    itemsPerPage: number = 10;

    searchTerm: string = '';
    selectedYear: string = '';
    selectedStatus: string = '';
    selectedSemesterOrder: number | '' = '';
    academicYears: string[] = [];

    showModal: boolean = false;
    isEditing: boolean = false;
    showFilter: boolean = false;
    showDeleteModal: boolean = false;
    deletingSemester: boolean = false;
    activeDropdown: string = '';
    currentSemester: any = this.getEmptySemester();
    semesterToDeleteId: number | null = null;
    savingSemester: boolean = false;
    originalSemester: any = null;

    constructor(
        private semesterService: SemesterService,
        private flashMessage: FlashMessageService
    ) { }

    ngOnInit(): void {
        this.loadSemesters();
    }

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

    handleBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.closeModal();
            this.closeDeleteModal();
        }
    }

    get totalPages(): number {
        return Math.ceil(this.filteredSemesters.length / this.itemsPerPage) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredSemesters.length);
    }

    loadSemesters(): void {
        this.loading = true;
        this.semesterService.getAllSemesters().subscribe({
            next: (data) => {
                this.semesters = data.sort((a, b) => {
                    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                });
                this.extractAcademicYears();
                this.selectedYear = '';
                this.onFilterChange();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading semesters', err);
                this.loading = false;
            }
        });
    }

    extractAcademicYears(): void {
        const years = new Set(this.semesters.map(s => s.academicYear));
        this.academicYears = Array.from(years).sort().reverse();
    }

    onFilterChange(): void {
        this.filteredSemesters = this.semesters.filter(s => {
            const search = this.searchTerm.toLowerCase();
            const matchesSearch = !this.searchTerm ||
                s.name.toLowerCase().includes(search) ||
                s.academicYear.toLowerCase().includes(search);

            const matchesYear = !this.selectedYear || s.academicYear === this.selectedYear;
            const matchesStatus = !this.selectedStatus || s.semesterStatus === this.selectedStatus;
            const matchesOrder = this.selectedSemesterOrder === '' || s.semesterOrder === this.selectedSemesterOrder;

            return matchesSearch && matchesYear && matchesStatus && matchesOrder;
        });

        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedYear = '';
        this.selectedStatus = '';
        this.selectedSemesterOrder = '';
        this.onFilterChange();
    }

    get paginatedSemesters(): Semester[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredSemesters.slice(start, start + this.itemsPerPage);
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

    getEmptySemester(): any {
        const currentYear = new Date().getFullYear();
        return {
            name: '',
            academicYear: `${currentYear}-${currentYear + 1}`,
            semesterOrder: 1,
            startDate: '',
            endDate: '',
            semesterStatus: 'UPCOMING'
        };
    }

    openAddModal(): void {
        this.isEditing = false;
        this.currentSemester = this.getEmptySemester();
        this.showModal = true;
    }

    openEditModal(semester: Semester): void {
        this.isEditing = true;
        this.currentSemester = { ...semester };
        this.originalSemester = { ...semester };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
    }

    saveSemester(): void {
        if (!this.currentSemester.name) {
            this.flashMessage.error('Vui lòng nhập tên học kỳ');
            return;
        }
        if (!this.currentSemester.academicYear) {
            this.flashMessage.error('Vui lòng nhập năm học');
            return;
        }

        if (this.isEditing && this.isUnchanged()) {
            this.flashMessage.info('Không có thay đổi nào để cập nhật');
            return;
        }

        this.savingSemester = true;
        const obs = !this.isEditing
            ? this.semesterService.createSemester(this.currentSemester)
            : this.semesterService.updateSemester(this.currentSemester.id, this.currentSemester);

        obs.subscribe({
            next: () => {
                this.loadSemesters();
                this.closeModal();
                this.savingSemester = false;
                this.flashMessage.success(this.isEditing ? 'Cập nhật học kỳ thành công' : 'Thêm học kỳ thành công');
            },
            error: (err) => {
                console.error('Error saving semester', err);
                this.savingSemester = false;
                this.flashMessage.error('Có lỗi xảy ra khi lưu học kỳ');
            }
        });
    }

    openDeleteConfirmation(id: number): void {
        this.semesterToDeleteId = id;
        this.currentSemester = this.semesters.find(s => s.id === id) || this.getEmptySemester();
        this.showDeleteModal = true;
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.semesterToDeleteId = null;
        this.deletingSemester = false;
    }

    confirmDelete(): void {
        if (this.semesterToDeleteId === null) return;
        this.deletingSemester = true;
        this.semesterService.deleteSemester(this.semesterToDeleteId).subscribe({
            next: () => {
                this.loadSemesters();
                this.closeDeleteModal();
                this.flashMessage.success('Xóa học kỳ thành công');
            },
            error: (err) => {
                console.error('Error deleting semester', err);
                this.deletingSemester = false;
                this.flashMessage.error('Không thể xóa học kỳ này. Vui lòng thử lại sau');
            }
        });
    }

    private isUnchanged(): boolean {
        if (!this.originalSemester) return false;
        return this.currentSemester.name === this.originalSemester.name &&
            this.currentSemester.academicYear === this.originalSemester.academicYear &&
            this.currentSemester.semesterOrder === this.originalSemester.semesterOrder &&
            this.currentSemester.startDate === this.originalSemester.startDate &&
            this.currentSemester.endDate === this.originalSemester.endDate &&
            this.currentSemester.semesterStatus === this.originalSemester.semesterStatus;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'ONGOING': return 'bg-green-50 text-green-700 border-green-200';
            case 'UPCOMING': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'FINISHED': return 'bg-slate-50 text-slate-700 border-slate-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'ONGOING': return 'Đang diễn ra';
            case 'UPCOMING': return 'Sắp tới';
            case 'FINISHED': return 'Đã kết thúc';
            default: return 'Tất cả trạng thái';
        }
    }
}