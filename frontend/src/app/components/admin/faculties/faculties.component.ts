import { Component, OnInit, HostListener } from '@angular/core';
import { FacultyService, FacultyDTO } from '../../../services/faculty.service';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';

@Component({
    selector: 'app-faculties',
    templateUrl: './faculties.component.html'
})
export class FacultiesComponent implements OnInit {

    faculties: FacultyDTO[] = [];
    filteredFaculties: FacultyDTO[] = [];
    searchTerm: string = '';
    selectedStatus: string = '';

    currentPage: number = 1;
    itemsPerPage: number = 10;

    showModal: boolean = false;
    isEditing: boolean = false;
    showFilter: boolean = false;
    showDeleteModal: boolean = false;
    deletingFaculty: boolean = false;
    activeDropdown: string = '';
    currentFaculty: Partial<FacultyDTO> = {};
    originalFaculty: FacultyDTO | null = null;
    facultyToDelete: FacultyDTO | null = null;
    savingFaculty: boolean = false;
    selectedFaculty: FacultyDTO | null = null;

    constructor(
        private facultyService: FacultyService,
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

    toggleFilter(event: MouseEvent) {
        event.stopPropagation();
        this.showFilter = !this.showFilter;
        if (!this.showFilter) {
            this.activeDropdown = '';
        }
    }

    getSelectedStatusLabel(): string {
        const map: any = {
            'ACTIVE': 'Đang hoạt động',
            'INACTIVE': 'Ngưng hoạt động',
            'DRAFT': 'Bản nháp'
        };
        return map[this.selectedStatus] || 'Tất cả Trạng thái';
    }

    ngOnInit(): void {
        this.loadFaculties();
    }

    loadFaculties(): void {
        this.facultyService.getFaculties().subscribe(data => {
            this.faculties = data;
            this.onSearch();
        });
    }

    onSearch(): void {
        this.filteredFaculties = this.faculties.filter(f => {
            const search = this.searchTerm.toLowerCase();
            const matchesSearch = !this.searchTerm ||
                f.facultyCode.toLowerCase().includes(search) ||
                f.facultyName.toLowerCase().includes(search) ||
                (f.description && f.description.toLowerCase().includes(search));

            const matchesStatus = !this.selectedStatus || f.status === this.selectedStatus;

            return matchesSearch && matchesStatus;
        });
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedStatus = '';
        this.onSearch();
    }

    get paginatedFaculties(): FacultyDTO[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredFaculties.slice(start, start + this.itemsPerPage);
    }

    get totalPages(): number {
        return Math.ceil(this.filteredFaculties.length / this.itemsPerPage) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredFaculties.length);
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
        this.currentFaculty = {
            facultyCode: '',
            facultyName: '',
            description: '',
            status: 'ACTIVE'
        };
        this.showModal = true;
    }

    editFaculty(faculty: FacultyDTO): void {
        this.isEditing = true;
        this.originalFaculty = { ...faculty };
        this.currentFaculty = { ...faculty };
        this.showModal = true;
    }

    hasChanges(): boolean {
        if (!this.isEditing) return true;
        if (!this.originalFaculty) return false;

        return this.currentFaculty.facultyCode !== this.originalFaculty.facultyCode ||
            this.currentFaculty.facultyName !== this.originalFaculty.facultyName ||
            this.currentFaculty.description !== this.originalFaculty.description ||
            this.currentFaculty.status !== this.originalFaculty.status;
    }

    closeModal(): void {
        this.showModal = false;
        this.originalFaculty = null;
    }

    handleBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.closeModal();
            this.closeDeleteModal();
        }
    }


    saveFaculty(): void {
        if (!this.currentFaculty.facultyCode) {
            this.flashMessage.error('Vui lòng nhập mã khoa');
            return;
        }
        if (!this.currentFaculty.facultyName) {
            this.flashMessage.error('Vui lòng nhập tên khoa');
            return;
        }

        if (this.isEditing) {
            if (!this.hasChanges()) {
                this.flashMessage.info('Không có thay đổi nào để cập nhật');
                return;
            }
            this.savingFaculty = true;
            this.facultyService.updateFaculty(this.currentFaculty.id!, this.currentFaculty).subscribe({
                next: () => {
                    this.flashMessage.success('Cập nhật khoa thành công');
                    this.resetFilters();
                    this.loadFaculties();
                    this.closeModal();
                    this.savingFaculty = false;
                },
                error: (err) => {
                    this.savingFaculty = false;
                    this.flashMessage.handleError(err);
                }
            });
        } else {
            this.savingFaculty = true;
            this.facultyService.createFaculty(this.currentFaculty).subscribe({
                next: () => {
                    this.flashMessage.success('Thêm khoa thành công');
                    this.resetFilters();
                    this.loadFaculties();
                    this.closeModal();
                    this.savingFaculty = false;
                },
                error: (err) => {
                    this.savingFaculty = false;
                    this.flashMessage.handleError(err);
                }
            });
        }
    }

    deleteFaculty(faculty: FacultyDTO): void {
        this.facultyToDelete = faculty;
        this.showDeleteModal = true;
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.facultyToDelete = null;
        this.deletingFaculty = false;
    }

    confirmDelete(): void {
        if (!this.facultyToDelete) return;
        this.deletingFaculty = true;
        this.facultyService.deleteFaculty(this.facultyToDelete.id).subscribe({
            next: () => {
                this.flashMessage.success(`Đã xóa khoa ${this.facultyToDelete?.facultyName}`);
                this.resetFilters();
                this.loadFaculties();
                this.closeDeleteModal();
            },
            error: (err) => {
                this.deletingFaculty = false;
                this.flashMessage.handleError(err);
            }
        });
    }

    getStatusLabel(status: string | undefined): string {
        switch (status) {
            case 'ACTIVE': return 'Đang hoạt động';
            case 'INACTIVE': return 'Ngưng hoạt động';
            case 'DRAFT': return 'Bản nháp';
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
