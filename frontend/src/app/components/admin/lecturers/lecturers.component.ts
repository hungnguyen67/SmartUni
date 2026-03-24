import { Component, OnInit, HostListener } from '@angular/core';
import { LecturerService, LecturerDTO } from '../../../services/lecturer.service';
import { FacultyService, FacultyDTO } from '../../../services/faculty.service';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';

@Component({
    selector: 'app-lecturers',
    templateUrl: './lecturers.component.html'
})
export class LecturersComponent implements OnInit {

    lecturers: LecturerDTO[] = [];
    filteredLecturers: LecturerDTO[] = [];
    paginatedLecturers: LecturerDTO[] = [];
    faculties: FacultyDTO[] = [];

    searchTerm: string = '';
    filterFaculty: number | null = null;
    filterStatus: string = '';

    showFilter: boolean = false;
    activeDropdown: string = '';
    loading: boolean = false;

    currentPage: number = 1;
    itemsPerPage: number = 10;

    // Modal states
    showModal: boolean = false;
    showDeleteModal: boolean = false;
    isEditing: boolean = false;
    savingLecturer: boolean = false;
    deletingLecturer: boolean = false;

    currentLecturer: Partial<LecturerDTO> = {};
    lecturerToDelete: LecturerDTO | null = null;

    constructor(
        private lecturerService: LecturerService,
        private facultyService: FacultyService,
        private flashMessage: FlashMessageService
    ) { }

    ngOnInit(): void {
        this.loadFaculties();
        this.loadLecturers();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.filter-menu-wrapper')) {
            this.showFilter = false;
            this.activeDropdown = '';
        }
    }

    toggleFilter(event: MouseEvent): void {
        event.stopPropagation();
        this.showFilter = !this.showFilter;
    }

    loadFaculties(): void {
        this.facultyService.getFaculties().subscribe((data: FacultyDTO[]) => this.faculties = data);
    }

    loadLecturers(): void {
        this.loading = true;
        this.lecturerService.getLecturers(this.searchTerm, this.filterFaculty || undefined).subscribe({
            next: (data: LecturerDTO[]) => {
                this.lecturers = data;
                this.applyFilters();
                this.loading = false;
            },
            error: (err: any) => {
                this.loading = false;
                this.flashMessage.handleError(err);
            }
        });
    }

    applyFilters(): void {
        this.filteredLecturers = this.lecturers.filter(l => {
            const matchesStatus = !this.filterStatus || l.status === this.filterStatus;
            return matchesStatus;
        });
        this.currentPage = 1;
        this.updatePagination();
    }

    updatePagination(): void {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.paginatedLecturers = this.filteredLecturers.slice(startIndex, endIndex);
    }

    onSearch(): void {
        this.loadLecturers();
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.filterFaculty = null;
        this.filterStatus = '';
        this.showFilter = false;
        this.loadLecturers();
    }

    getSelectedFacultyName(): string {
        if (!this.filterFaculty) return 'Tất cả các khoa';
        const faculty = this.faculties.find(f => f.id === this.filterFaculty);
        return faculty ? faculty.facultyName : 'Tất cả các khoa';
    }

    get totalPages(): number {
        return Math.ceil(this.filteredLecturers.length / this.itemsPerPage) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredLecturers.length);
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagination();
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
        }
    }

    getGenderName(gender: string | undefined): string {
        const map: any = { 'Male': 'Nam', 'Female': 'Nữ', 'Other': 'Khác' };
        return map[gender || 'Other'] || 'Khác';
    }

    getStatusLabel(status: string | undefined): string {
        const s = status || 'ALL';
        const map: any = {
            'WORKING': 'Đang giảng dạy',
            'ON_LEAVE': 'Nghỉ phép',
            'RESIGNED': 'Thôi việc',
            'RETIRED': 'Nghỉ hưu',
            'ALL': 'Tất cả trạng thái'
        };
        return map[s] || s;
    }

    getStatusClass(status: string | undefined): string {
        switch (status) {
            case 'WORKING': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'ON_LEAVE': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'RESIGNED': return 'bg-red-50 text-red-600 border-red-200';
            case 'RETIRED': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    }

    // Modal Methods
    openAddModal(): void {
        this.isEditing = false;
        this.currentLecturer = {
            gender: 'Male',
            status: 'WORKING',
            email: '',
            lastName: '',
            firstName: '',
            birthday: '',
            address: ''
        };
        this.showModal = true;
    }

    editLecturer(lecturer: LecturerDTO): void {
        this.isEditing = true;
        // Make a copy and ensure names are mapped correctly
        this.currentLecturer = {
            ...lecturer,
            lastName: lecturer.lastName || '',
            firstName: lecturer.firstName || ''
        };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.currentLecturer = {};
        this.activeDropdown = '';
    }

    handleBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.closeModal();
            this.closeDeleteModal();
        }
    }

    saveLecturer(): void {
        if (!this.currentLecturer.lecturerCode || !this.currentLecturer.lastName || !this.currentLecturer.firstName || !this.currentLecturer.facultyId || !this.currentLecturer.email) {
            this.flashMessage.error('Vui lòng điền đầy đủ các thông tin bắt buộc!');
            return;
        }

        this.savingLecturer = true;
        const request = this.isEditing
            ? this.lecturerService.updateLecturer(this.currentLecturer.id!, this.currentLecturer)
            : this.lecturerService.createLecturer(this.currentLecturer);

        request.subscribe({
            next: () => {
                this.flashMessage.success(`${this.isEditing ? 'Cập nhật' : 'Thêm'} giảng viên thành công!`);
                this.loadLecturers();
                this.closeModal();
                this.savingLecturer = false;
            },
            error: (err) => {
                this.savingLecturer = false;
                this.flashMessage.handleError(err);
            }
        });
    }

    deleteLecturer(lecturer: LecturerDTO): void {
        this.lecturerToDelete = lecturer;
        this.showDeleteModal = true;
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.lecturerToDelete = null;
    }

    confirmDelete(): void {
        if (!this.lecturerToDelete) return;

        this.deletingLecturer = true;
        this.lecturerService.deleteLecturer(this.lecturerToDelete.id).subscribe({
            next: () => {
                this.flashMessage.success('Xóa giảng viên thành công!');
                this.loadLecturers();
                this.closeDeleteModal();
                this.deletingLecturer = false;
            },
            error: (err) => {
                this.deletingLecturer = false;
                this.flashMessage.handleError(err);
            }
        });
    }

    setLecturerGender(gender: string): void {
        this.currentLecturer.gender = gender;
        this.activeDropdown = '';
    }

    setLecturerStatus(status: string): void {
        this.currentLecturer.status = status;
        this.activeDropdown = '';
    }

    setFilterFaculty(id: number | null): void {
        this.filterFaculty = id;
        this.activeDropdown = '';
    }

    setFilterStatus(status: string): void {
        this.filterStatus = status;
        this.activeDropdown = '';
    }

    getModalSubmitLabel(): string {
        if (this.savingLecturer) return 'Đang lưu...';
        return this.isEditing ? 'Cập nhật' : 'Lưu thông tin';
    }

    getDeleteSubmitLabel(): string {
        return this.deletingLecturer ? 'Đang xóa...' : 'Xác nhận';
    }
}