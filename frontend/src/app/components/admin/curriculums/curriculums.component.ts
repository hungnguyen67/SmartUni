import { Component, OnInit, HostListener } from '@angular/core';
import { CurriculumService, CurriculumDTO } from '../../../services/curriculum.service';
import { MajorService, MajorDTO } from '../../../services/major.service';
import { SubjectService, SubjectDTO } from '../../../services/subject.service';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';

@Component({
    selector: 'app-curriculums',
    templateUrl: './curriculums.component.html'
})
export class CurriculumsComponent implements OnInit {

    curriculums: CurriculumDTO[] = [];
    filteredCurriculums: CurriculumDTO[] = [];

    knowledgeBlocks: any[] = [];
    filteredBlocks: any[] = [];

    curriculumSubjects: any[] = [];
    filteredSubjects: any[] = [];
    majors: MajorDTO[] = [];

    activeTab: string = 'PROGRAM'; // 'PROGRAM', 'BLOCK', 'SUBJECT'
    loading: boolean = false;
    searchTerm: string = '';
    selectedMajorId: number | null = null;
    selectedStatus: string = 'ALL';
    selectedCurriculumId: number | null = null;
    selectedBlockId: number | null = null;

    currentPage: number = 1;
    itemsPerPage: number = 10;

    showFilter: boolean = false;
    activeDropdown: string = ''; // 'major', 'status', 'curriculum', 'block', 'modalMajor', 'modalStatus', 'modalCurriculum', 'modalBlock'

    // Modal States
    showModal: boolean = false;
    isEditing: boolean = false;
    currentCurriculum: any = {};
    originalCurriculum: CurriculumDTO | null = null;

    showDeleteModal: boolean = false;
    curriculumToDelete: CurriculumDTO | null = null;
    deletingCurriculum: boolean = false;
    savingCurriculum: boolean = false;

    // Additional data for forms
    allSubjects: SubjectDTO[] = [];

    constructor(
        private curriculumService: CurriculumService,
        private majorService: MajorService,
        private subjectService: SubjectService,
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
        this.loadAllSubjects();
        this.loadData();
    }

    loadAllSubjects(): void {
        this.subjectService.getAllSubjects().subscribe(data => {
            this.allSubjects = data;
        });
    }

    loadMajors(): void {
        this.majorService.getMajors().subscribe((data: MajorDTO[]) => {
            this.majors = data;
        });
    }

    setTab(tab: string): void {
        this.activeTab = tab;
        this.currentPage = 1;
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        if (this.activeTab === 'PROGRAM') {
            this.curriculumService.getCurriculums().subscribe({
                next: (data) => {
                    this.curriculums = data;
                    this.onFilter();
                    this.loading = false;
                },
                error: () => this.loading = false
            });
        } else if (this.activeTab === 'BLOCK') {
            this.curriculumService.getKnowledgeBlocks().subscribe({
                next: (data) => {
                    this.knowledgeBlocks = data;
                    this.onFilter();
                    this.loading = false;
                },
                error: () => this.loading = false
            });
        } else if (this.activeTab === 'SUBJECT') {
            this.curriculumService.getAllCurriculumSubjects().subscribe({
                next: (data) => {
                    this.curriculumSubjects = data;
                    this.onFilter();
                    this.loading = false;
                },
                error: () => this.loading = false
            });
        }
    }

    onFilter(): void {
        if (this.activeTab === 'PROGRAM') {
            this.filteredCurriculums = this.curriculums.filter(c => {
                const matchSearch = c.curriculumName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                    c.majorCode.toLowerCase().includes(this.searchTerm.toLowerCase());
                const matchMajor = !this.selectedMajorId || c.majorId === this.selectedMajorId;
                const matchStatus = this.selectedStatus === 'ALL' || c.status === this.selectedStatus;
                return matchSearch && matchMajor && matchStatus;
            });
        } else if (this.activeTab === 'BLOCK') {
            this.filteredBlocks = this.knowledgeBlocks.filter(b => {
                const matchSearch = b.blockName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                    b.blockCode.toLowerCase().includes(this.searchTerm.toLowerCase());
                const matchCurriculum = !this.selectedCurriculumId || b.curriculumId === this.selectedCurriculumId;
                return matchSearch && matchCurriculum;
            });
        } else if (this.activeTab === 'SUBJECT') {
            this.filteredSubjects = this.curriculumSubjects.filter(s => {
                const matchSearch = s.subjectName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                    s.subjectCode.toLowerCase().includes(this.searchTerm.toLowerCase());
                const matchCurriculum = !this.selectedCurriculumId || s.curriculumId === this.selectedCurriculumId;
                const matchBlock = !this.selectedBlockId || s.blockId === this.selectedBlockId;
                return matchSearch && matchCurriculum && matchBlock;
            });
        }
        this.currentPage = 1;
    }

    openAddModal(): void {
        this.isEditing = false;
        if (this.activeTab === 'PROGRAM') {
            this.currentCurriculum = {
                curriculumName: '',
                majorId: undefined,
                appliedYear: new Date().getFullYear(),
                totalCreditsRequired: 0,
                status: 'ACTIVE'
            };
        } else if (this.activeTab === 'BLOCK') {
            this.currentCurriculum = {
                curriculumId: this.selectedCurriculumId || undefined,
                blockName: '',
                blockCode: '',
                creditsRequired: 0,
                blockType: 'MANDATORY'
            } as any;
        } else if (this.activeTab === 'SUBJECT') {
            this.currentCurriculum = {
                curriculumId: this.selectedCurriculumId || undefined,
                blockId: this.selectedBlockId || undefined,
                subjectId: undefined,
                recommendedSemester: 1
            } as any;
        }
        this.showModal = true;
    }

    editBlock(item: any): void {
        this.isEditing = true;
        this.activeTab = 'BLOCK';
        this.currentCurriculum = { ...item };
        this.showModal = true;
    }

    editSubject(item: any): void {
        this.isEditing = true;
        this.activeTab = 'SUBJECT';
        this.currentCurriculum = { ...item };
        this.showModal = true;
    }

    deleteBlock(item: any): void {
        this.curriculumToDelete = item;
        this.showDeleteModal = true;
    }

    deleteSubject(item: any): void {
        this.curriculumToDelete = item;
        this.showDeleteModal = true;
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
        this.savingCurriculum = true;
        if (this.activeTab === 'PROGRAM') {
            if (!this.currentCurriculum.curriculumName) {
                this.flashMessage.error('Vui lòng nhập tên chương trình đào tạo');
                this.savingCurriculum = false;
                return;
            }
            if (!this.currentCurriculum.majorId) {
                this.flashMessage.error('Vui lòng chọn ngành đào tạo');
                this.savingCurriculum = false;
                return;
            }

            if (this.isEditing) {
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
        } else if (this.activeTab === 'BLOCK') {
            const block = this.currentCurriculum as any;
            if (this.isEditing) {
                this.curriculumService.updateKnowledgeBlock(block.id, block).subscribe({
                    next: () => {
                        this.flashMessage.success('Cập nhật khối kiến thức thành công');
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
                this.curriculumService.createKnowledgeBlock(block).subscribe({
                    next: () => {
                        this.flashMessage.success('Thêm khối kiến thức thành công');
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
        } else if (this.activeTab === 'SUBJECT') {
            const subject = this.currentCurriculum as any;
            if (this.isEditing) {
                this.curriculumService.updateCurriculumSubject(subject).subscribe({
                    next: () => {
                        this.flashMessage.success('Cập nhật học phần theo khung thành công');
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
                this.curriculumService.addSubjectToCurriculum(subject).subscribe({
                    next: () => {
                        this.flashMessage.success('Thêm học phần vào khung thành công');
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
            if (this.activeTab === 'PROGRAM') {
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
            } else if (this.activeTab === 'BLOCK') {
                this.curriculumService.deleteKnowledgeBlock(this.curriculumToDelete.id).subscribe({
                    next: () => {
                        this.flashMessage.success('Xóa khối kiến thức thành công');
                        this.loadData();
                        this.closeDeleteModal();
                    },
                    error: (err: any) => {
                        this.deletingCurriculum = false;
                        this.flashMessage.handleError(err);
                    }
                });
            } else if (this.activeTab === 'SUBJECT') {
                const s = this.curriculumToDelete as any;
                this.curriculumService.deleteCurriculumSubject(s.curriculumId, s.subjectId).subscribe({
                    next: () => {
                        this.flashMessage.success('Xóa học phần khỏi khung thành công');
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
    }

    get totalItems(): number {
        if (this.activeTab === 'PROGRAM') return this.filteredCurriculums.length;
        if (this.activeTab === 'BLOCK') return this.filteredBlocks.length;
        if (this.activeTab === 'SUBJECT') return this.filteredSubjects.length;
        return 0;
    }

    get totalPages(): number {
        return Math.ceil(this.totalItems / this.itemsPerPage) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
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

    getSelectedMajorName(): string {
        if (!this.selectedMajorId) return 'Tất cả các ngành học';
        const major = this.majors.find(m => m.id === this.selectedMajorId);
        return major ? major.majorName : 'Tất cả các ngành học';
    }

    getSelectedCurriculumName(): string {
        if (!this.selectedCurriculumId) return 'Tất cả chương trình';
        const curr = this.curriculums.find(c => c.id === this.selectedCurriculumId);
        return curr ? curr.curriculumName : 'Tất cả chương trình';
    }

    getSelectedBlockName(): string {
        if (!this.selectedBlockId) return 'Tất cả khối';
        const block = this.knowledgeBlocks.find(b => b.id === this.selectedBlockId);
        return block ? block.blockName : 'Tất cả khối';
    }

    resetFilters() {
        this.selectedMajorId = null;
        this.selectedStatus = 'ALL';
        this.selectedCurriculumId = null;
        this.selectedBlockId = null;
        this.searchTerm = '';
        this.onFilter();
    }

    getStatusClass(status: string | undefined): string {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'DRAFT': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'INACTIVE': return 'bg-slate-50 text-slate-600 border-slate-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    }

    getAvailableBlocksForFilter(): any[] {
        // If we're in the modal, filter by currentCurriculum.curriculumId
        if (this.showModal || this.showDeleteModal) {
            const curriculumId = this.currentCurriculum?.curriculumId;
            if (!curriculumId) return this.knowledgeBlocks;
            return this.knowledgeBlocks.filter(b => b.curriculumId === curriculumId);
        }
        // Otherwise use the main filter state
        if (!this.selectedCurriculumId) return this.knowledgeBlocks;
        return this.knowledgeBlocks.filter(b => b.curriculumId === this.selectedCurriculumId);
    }

    getModalMajorLabel(): string {
        if (!this.currentCurriculum.majorId) return 'Chọn ngành học';
        const major = this.majors.find(m => m.id === Number(this.currentCurriculum.majorId));
        return major ? major.majorName : 'Chọn ngành học';
    }

    getModalCurriculumLabel(): string {
        const id = (this.currentCurriculum as any).curriculumId;
        if (!id) return 'Chọn chương trình đào tạo';
        const curr = this.curriculums.find(c => c.id === id);
        return curr ? curr.curriculumName : 'Chọn chương trình đào tạo';
    }

    getModalBlockLabel(): string {
        const id = (this.currentCurriculum as any).blockId;
        if (!id) return 'Chọn khối kiến thức';
        const block = this.knowledgeBlocks.find(b => b.id === id);
        return block ? block.blockName : 'Chọn khối kiến thức';
    }

    getModalSubjectLabel(): string {
        const id = (this.currentCurriculum as any).subjectId;
        if (!id) return 'Chọn học phần';
        const sub = this.allSubjects.find(s => s.id === id);
        return sub ? `[${sub.subjectCode}] ${sub.name}` : 'Chọn học phần';
    }

    getModalTitle(): string {
        const prefix = this.isEditing ? 'Cập nhật' : 'Thêm';
        switch (this.activeTab) {
            case 'PROGRAM': return `${prefix} chương trình đào tạo`;
            case 'BLOCK': return `${prefix} khối kiến thức`;
            case 'SUBJECT': return `${prefix} học phần vào khung`;
            default: return `${prefix} thông tin`;
        }
    }

    getDeleteModalTitle(): string {
        switch (this.activeTab) {
            case 'PROGRAM': return 'Xóa Chương trình đào tạo';
            case 'BLOCK': return 'Xóa Khối kiến thức';
            case 'SUBJECT': return 'Xóa Học phần khỏi khung';
            default: return 'Xác nhận xóa';
        }
    }

    getDeleteModalInfo(): string {
        if (!this.curriculumToDelete) return '';
        const item = this.curriculumToDelete as any;
        switch (this.activeTab) {
            case 'PROGRAM': return `Bạn có chắc muốn xóa chương trình đào tạo <span class="font-bold text-red-600">${item.curriculumName}</span>?`;
            case 'BLOCK': return `Bạn có chắc muốn xóa khối kiến thức <span class="font-bold text-red-600">${item.blockName}</span>?`;
            case 'SUBJECT': return `Bạn có chắc muốn xóa học phần <span class="font-bold text-red-600">${item.subjectName}</span> khỏi chương trình đào tạo?`;
            default: return 'Bạn có chắc muốn xóa bản ghi này?';
        }
    }

    getTabTitle(): string {
        switch (this.activeTab) {
            case 'PROGRAM': return 'Danh sách Chương trình đào tạo';
            case 'BLOCK': return 'Danh sách Khối kiến thức';
            case 'SUBJECT': return 'Danh sách Học phần theo khung';
            default: return 'Danh sách CTĐT';
        }
    }

    getAddButtonLabel(): string {
        switch (this.activeTab) {
            case 'PROGRAM': return 'Thêm CTĐT';
            case 'BLOCK': return 'Thêm khối';
            case 'SUBJECT': return 'Thêm học phần';
            default: return 'Thêm mới';
        }
    }

    getSearchPlaceholder(): string {
        switch (this.activeTab) {
            case 'PROGRAM': return 'Tìm kiếm CTĐT';
            case 'BLOCK': return 'Tìm kiếm khối kiến thức';
            case 'SUBJECT': return 'Tìm kiếm học phần';
            default: return 'Tìm kiếm...';
        }
    }

    get paginatedData(): any[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        if (this.activeTab === 'PROGRAM') return this.filteredCurriculums.slice(start, start + this.itemsPerPage);
        if (this.activeTab === 'BLOCK') return this.filteredBlocks.slice(start, start + this.itemsPerPage);
        if (this.activeTab === 'SUBJECT') return this.filteredSubjects.slice(start, start + this.itemsPerPage);
        return [];
    }
}