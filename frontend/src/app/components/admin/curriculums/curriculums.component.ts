import { Component, OnInit, HostListener } from '@angular/core';
import { CurriculumService, CurriculumDTO } from '../../../services/curriculum.service';
import { MajorService, MajorDTO } from '../../../services/major.service';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';

@Component({
    selector: 'app-curriculums',
    templateUrl: './curriculums.component.html'
})
export class CurriculumsComponent implements OnInit {

    curriculums: CurriculumDTO[] = [];
    filteredCurriculums: CurriculumDTO[] = [];
    majors: MajorDTO[] = [];

    loading: boolean = false;
    searchTerm: string = '';
    selectedMajorId: number | null = null;
    selectedStatus: string = 'ALL';

    currentPage: number = 1;
    itemsPerPage: number = 10;

    showFilter: boolean = false;
    activeDropdown: string = '';

    // Modal States
    showModal: boolean = false;
    isEditing: boolean = false;
    currentCurriculum: Partial<CurriculumDTO> = {};
    originalCurriculum: CurriculumDTO | null = null;

    showDeleteModal: boolean = false;
    curriculumToDelete: CurriculumDTO | null = null;
    deletingCurriculum: boolean = false;
    savingCurriculum: boolean = false;

    constructor(
        private curriculumService: CurriculumService,
        private majorService: MajorService,
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

    ngOnInit(): void {
        this.loadMajors();
        this.loadData();
    }

    loadMajors(): void {
        this.majorService.getMajors().subscribe((data: MajorDTO[]) => {
            this.majors = data;
        });
    }

    loadData(): void {
        this.loading = true;
        this.curriculumService.getCurriculums().subscribe({
            next: (data: CurriculumDTO[]) => {
                this.curriculums = data;
                this.onFilter();
                this.loading = false;
            },
            error: (err: any) => this.loading = false
        });
    }

    onFilter(): void {
        this.filteredCurriculums = this.curriculums.filter(item => {
            const matchesSearch = !this.searchTerm ||
                item.curriculumName.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesMajor = this.selectedMajorId === null || item.majorId === this.selectedMajorId;
            const matchesStatus = this.selectedStatus === 'ALL' || item.status === this.selectedStatus;
            return matchesSearch && matchesMajor && matchesStatus;
        });
        this.currentPage = 1;
    }

    getSelectedMajorName(): string {
        if (this.selectedMajorId === null) return 'Tất cả các ngành học';
        const major = this.majors.find(m => m.id === Number(this.selectedMajorId));
        return major ? major.majorName : 'Tất cả các ngành học';
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedMajorId = null;
        this.selectedStatus = 'ALL';
        this.onFilter();
    }

    openAddModal(): void {
        this.isEditing = false;
        this.currentCurriculum = {
            curriculumName: '',
            majorId: undefined,
            appliedYear: new Date().getFullYear(),
            totalCreditsRequired: 0,
            status: 'ACTIVE'
        };
        this.showModal = true;
    }

    editCurriculum(item: CurriculumDTO): void {
        this.isEditing = true;
        this.originalCurriculum = { ...item };
        this.currentCurriculum = { ...item };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.originalCurriculum = null;
        this.activeDropdown = '';
    }

    hasChanges(): boolean {
        if (!this.isEditing) return true;
        if (!this.originalCurriculum) return false;

        return this.currentCurriculum.curriculumName !== this.originalCurriculum.curriculumName ||
            this.currentCurriculum.majorId !== this.originalCurriculum.majorId ||
            this.currentCurriculum.appliedYear !== this.originalCurriculum.appliedYear ||
            this.currentCurriculum.status !== this.originalCurriculum.status;
    }

    saveCurriculum(): void {
        if (!this.currentCurriculum.curriculumName) {
            this.flashMessage.error('Vui lòng nhập tên chương trình đào tạo');
            return;
        }
        if (!this.currentCurriculum.majorId) {
            this.flashMessage.error('Vui lòng chọn ngành đào tạo');
            return;
        }

        this.savingCurriculum = true;
        if (this.isEditing) {
            if (!this.hasChanges()) {
                this.flashMessage.info('Không có thay đổi nào để cập nhật');
                this.savingCurriculum = false;
                return;
            }
            this.curriculumService.updateCurriculum(this.currentCurriculum.id!, this.currentCurriculum as CurriculumDTO).subscribe({
                next: () => {
                    this.flashMessage.success('Cập nhật CTĐT thành công');
                    this.loadData();
                    this.closeModal();
                    this.savingCurriculum = false;
                },
                error: (err: any) => {
                    this.savingCurriculum = false;
                    this.flashMessage.handleError(err);
                }
            });
        } else {
            this.curriculumService.createCurriculum(this.currentCurriculum as CurriculumDTO).subscribe({
                next: () => {
                    this.flashMessage.success('Thêm CTĐT mới thành công');
                    this.loadData();
                    this.closeModal();
                    this.savingCurriculum = false;
                },
                error: (err: any) => {
                    this.savingCurriculum = false;
                    this.flashMessage.handleError(err);
                }
            });
        }
    }

    openDeleteModal(item: CurriculumDTO): void {
        this.curriculumToDelete = item;
        this.showDeleteModal = true;
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.curriculumToDelete = null;
        this.deletingCurriculum = false;
    }

    confirmDelete(): void {
        if (this.curriculumToDelete) {
            this.deletingCurriculum = true;
            this.curriculumService.deleteCurriculum(this.curriculumToDelete.id).subscribe({
                next: () => {
                    this.flashMessage.success('Xóa chương trình đào tạo thành công');
                    this.loadData();
                    this.closeDeleteModal();
                },
                error: (err: any) => {
                    this.deletingCurriculum = false;
                    this.flashMessage.handleError(err);
                }
            });
        }
    }

    get totalPages(): number {
        return Math.ceil(this.filteredCurriculums.length / this.itemsPerPage) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredCurriculums.length);
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

    getStatusLabel(status: string | undefined): string {
        switch (status) {
            case 'ACTIVE': return 'Đang hoạt động';
            case 'DRAFT': return 'Bản nháp';
            case 'INACTIVE': return 'Ngưng hoạt động';
            default: return 'Tất cả trạng thái';
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

    getModalMajorLabel(): string {
        if (!this.currentCurriculum.majorId) return 'Chọn ngành học';
        const major = this.majors.find(m => m.id === Number(this.currentCurriculum.majorId));
        return major ? major.majorName : 'Chọn ngành học';
    }

    get paginatedCurriculums(): CurriculumDTO[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredCurriculums.slice(start, start + this.itemsPerPage);
    }
}