import { Component, OnInit, HostListener } from '@angular/core';
import { forkJoin } from 'rxjs';
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

    tabFilters: any = {
        'PROGRAM': { majorId: null, status: 'ALL', searchTerm: '' },
        'BLOCK': { majorId: null, curriculumId: null, searchTerm: '' },
        'SUBJECT': { majorId: null, curriculumId: null, blockId: null, searchTerm: '' }
    };

    currentPage: number = 1;
    itemsPerPage: number = 10;

    showFilter: boolean = false;
    activeDropdown: string = ''; // 'major', 'status', 'curriculum', 'block', 'modalMajor', 'modalStatus', 'modalCurriculum', 'modalBlock'

    // Modal States
    showModal: boolean = false;
    isEditing: boolean = false;
    currentCurriculum: any = {};
    originalCurriculum: CurriculumDTO | null = null;
    originalItem: any = null;

    showDeleteModal: boolean = false;
    curriculumToDelete: any = null;
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
        this.loadMajors();
        this.loadAllSubjects();
        this.loadCurriculums();
        this.loadData();
        this.initAutoSync();
    }

    initAutoSync(): void {
        forkJoin({
            blocks: this.curriculumService.getKnowledgeBlocks(),
            subjects: this.curriculumService.getAllCurriculumSubjects()
        }).subscribe(({ blocks, subjects }: { blocks: any[], subjects: any[] }) => {
            this.knowledgeBlocks = blocks.sort((a, b) => (b.id || 0) - (a.id || 0));
            this.curriculumSubjects = subjects.sort((a, b) => (b.id || 0) - (a.id || 0));

            blocks.forEach(block => {
                if (block.blockType === 'MANDATORY') {
                    const blockSubjects = subjects.filter(s => s.blockId === block.id);
                    const totalCredits = blockSubjects.reduce((acc: number, s: any) => acc + (s.credits || 0), 0);

                    if (block.creditsRequired !== totalCredits) {
                        const updatedBlock = { ...block, creditsRequired: totalCredits };
                        this.curriculumService.updateKnowledgeBlock(block.id, updatedBlock).subscribe();
                        block.creditsRequired = totalCredits;
                    }
                }
            });

            if (this.activeTab === 'BLOCK') {
                this.onFilter();
            }
        });
    }

    loadAllCurriculumSubjects(): void {
        this.curriculumService.getAllCurriculumSubjects().subscribe(data => {
            this.curriculumSubjects = data.sort((a, b) => (b.id || 0) - (a.id || 0));
            if (this.activeTab === 'BLOCK') {
                this.onFilter();
            }
        });
    }

    loadCurriculums(): void {
        this.curriculumService.getCurriculums().subscribe(data => {
            this.curriculums = data.sort((a, b) => (b.id || 0) - (a.id || 0));
            if (this.activeTab !== 'PROGRAM') {
                this.onFilter();
            }
        });
    }

    loadKnowledgeBlocks(): void {
        this.curriculumService.getKnowledgeBlocks().subscribe(data => {
            this.knowledgeBlocks = data.sort((a, b) => (b.id || 0) - (a.id || 0));
            if (this.activeTab === 'SUBJECT') {
                this.onFilter();
            }
        });
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
        this.activeDropdown = '';
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        if (this.activeTab === 'PROGRAM') {
            this.curriculumService.getCurriculums().subscribe({
                next: (data) => {
                    this.curriculums = data.sort((a, b) => (b.id || 0) - (a.id || 0));
                    this.onFilter();
                    this.loading = false;
                },
                error: () => this.loading = false
            });
        } else if (this.activeTab === 'BLOCK') {
            this.curriculumService.getKnowledgeBlocks().subscribe({
                next: (data) => {
                    this.knowledgeBlocks = data.sort((a, b) => (b.id || 0) - (a.id || 0));
                    this.onFilter();
                    this.loading = false;
                },
                error: () => this.loading = false
            });
        } else if (this.activeTab === 'SUBJECT') {
            this.curriculumService.getAllCurriculumSubjects().subscribe({
                next: (data) => {
                    this.curriculumSubjects = data.sort((a, b) => (b.id || 0) - (a.id || 0));
                    this.onFilter();
                    this.loading = false;
                },
                error: () => this.loading = false
            });
        }
    }

    onFilter(): void {
        const currentFilters = this.tabFilters[this.activeTab];
        const term = (currentFilters.searchTerm || '').toLowerCase();

        if (this.activeTab === 'PROGRAM') {
            this.filteredCurriculums = this.curriculums.filter(c => {
                const matchSearch = c.curriculumName.toLowerCase().includes(term) ||
                    c.majorCode.toLowerCase().includes(term);
                const matchMajor = !currentFilters.majorId || c.majorId === currentFilters.majorId;
                const matchStatus = currentFilters.status === 'ALL' || c.status === currentFilters.status;
                return matchSearch && matchMajor && matchStatus;
            });
        } else if (this.activeTab === 'BLOCK') {
            this.filteredBlocks = this.knowledgeBlocks.filter(b => {
                const matchSearch = b.blockName.toLowerCase().includes(term) ||
                    b.blockCode.toLowerCase().includes(term);
                const matchCurriculum = !currentFilters.curriculumId || b.curriculumId === currentFilters.curriculumId;

                let matchMajor = true;
                if (currentFilters.majorId) {
                    const curriculum = this.curriculums.find(c => c.id === b.curriculumId);
                    matchMajor = curriculum ? curriculum.majorId === currentFilters.majorId : false;
                }

                return matchSearch && matchCurriculum && matchMajor;
            }).map(b => {
                if (b.blockType === 'MANDATORY') {
                    const blockSubjects = this.curriculumSubjects.filter(s => s.blockId === b.id);
                    b.creditsRequired = blockSubjects.reduce((acc, s) => acc + (s.credits || 0), 0);
                }
                return b;
            });
        } else if (this.activeTab === 'SUBJECT') {
            this.filteredSubjects = this.curriculumSubjects.filter(s => {
                const matchSearch = s.subjectName.toLowerCase().includes(term) ||
                    s.subjectCode.toLowerCase().includes(term);
                const matchCurriculum = !currentFilters.curriculumId || s.curriculumId === currentFilters.curriculumId;
                const matchBlock = !currentFilters.blockId || s.blockId === currentFilters.blockId;

                let matchMajor = true;
                if (currentFilters.majorId) {
                    const curriculum = this.curriculums.find(c => c.id === s.curriculumId);
                    matchMajor = curriculum ? curriculum.majorId === currentFilters.majorId : false;
                }

                return matchSearch && matchCurriculum && matchBlock && matchMajor;
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
                status: 'DRAFT'
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
        this.originalItem = { ...item };
        this.showModal = true;
    }

    editSubject(item: any): void {
        this.isEditing = true;
        this.activeTab = 'SUBJECT';
        this.currentCurriculum = { ...item };
        this.originalItem = { ...item };
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

        if (this.activeTab === 'PROGRAM') {
            if (!this.originalCurriculum) return false;
            return this.currentCurriculum.curriculumName !== this.originalCurriculum.curriculumName ||
                this.currentCurriculum.majorId !== this.originalCurriculum.majorId ||
                this.currentCurriculum.appliedYear !== this.originalCurriculum.appliedYear ||
                this.currentCurriculum.status !== this.originalCurriculum.status;
        } else if (this.activeTab === 'BLOCK') {
            if (!this.originalItem) return false;
            return this.currentCurriculum.blockName !== this.originalItem.blockName ||
                this.currentCurriculum.blockCode !== this.originalItem.blockCode ||
                this.currentCurriculum.creditsRequired !== this.originalItem.creditsRequired ||
                this.currentCurriculum.blockType !== this.originalItem.blockType;
        } else if (this.activeTab === 'SUBJECT') {
            if (!this.originalItem) return false;
            return this.currentCurriculum.blockId !== this.originalItem.blockId ||
                this.currentCurriculum.subjectId !== this.originalItem.subjectId ||
                this.currentCurriculum.recommendedSemester !== this.originalItem.recommendedSemester;
        }
        return false;
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
                const data = { ...this.currentCurriculum as CurriculumDTO };
                delete (data as any).id;
                this.curriculumService.createCurriculum(data).subscribe({
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

            const blockId = Number(block.id);
            const curriculumId = Number(block.curriculumId);

            if (isNaN(curriculumId) || curriculumId <= 0) {
                this.flashMessage.error('ID chương trình đào tạo không hợp lệ');
                this.savingCurriculum = false;
                return;
            }

            if (block.blockType === 'MANDATORY') {
                const blockSubjects = this.curriculumSubjects.filter(s => s.blockId === block.id);
                block.creditsRequired = blockSubjects.reduce((acc, s) => acc + (s.credits || 0), 0);

                const info = this.getMandatoryCreditsInfo();
                if (info.current > info.total) {
                    this.flashMessage.error(`Tổng tín chỉ bắt buộc (${info.current}) không được vượt quá tổng tín chỉ chương trình (${info.total})`);
                    this.savingCurriculum = false;
                    return;
                }
            }

            if (this.isEditing) {
                if (isNaN(blockId) || blockId <= 0) {
                    this.flashMessage.error('Không tìm thấy định danh khối để cập nhật');
                    this.savingCurriculum = false;
                    return;
                }
                if (!this.hasChanges()) {
                    this.flashMessage.info('Không có thay đổi nào để cập nhật');
                    this.savingCurriculum = false;
                    return;
                }
                const data = {
                    id: blockId,
                    blockCode: block.blockCode,
                    blockName: block.blockName,
                    curriculumId: curriculumId,
                    creditsRequired: Number(block.creditsRequired) || 0,
                    blockType: block.blockType
                };
                this.curriculumService.updateKnowledgeBlock(data.id, data as any).subscribe({
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
                const data = {
                    blockCode: block.blockCode,
                    blockName: block.blockName,
                    curriculumId: curriculumId,
                    creditsRequired: Number(block.creditsRequired) || 0,
                    blockType: block.blockType
                };
                this.curriculumService.createKnowledgeBlock(data as any).subscribe({
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

            if (!subject.curriculumId || subject.curriculumId <= 0) {
                this.flashMessage.error('Vui lòng chọn chương trình đào tạo');
                this.savingCurriculum = false;
                return;
            }
            if (!subject.blockId || subject.blockId <= 0) {
                this.flashMessage.error('Vui lòng chọn khối kiến thức');
                this.savingCurriculum = false;
                return;
            }
            if (!this.isEditing && (!subject.subjectId || subject.subjectId <= 0)) {
                this.flashMessage.error('Vui lòng chọn học phần để thêm vào khung');
                this.savingCurriculum = false;
                return;
            }

            const dataId = Number(subject.id);
            const curriculumId = Number(subject.curriculumId);
            const blockId = Number(subject.blockId);
            const subjectId = Number(subject.subjectId);

            if (isNaN(curriculumId) || curriculumId <= 0) {
                this.flashMessage.error('ID chương trình đào tạo không hợp lệ');
                this.savingCurriculum = false;
                return;
            }
            if (isNaN(blockId) || blockId <= 0) {
                this.flashMessage.error('ID khối kiến thức không hợp lệ');
                this.savingCurriculum = false;
                return;
            }
            if (!this.isEditing && (isNaN(subjectId) || subjectId <= 0)) {
                this.flashMessage.error('ID học phần không hợp lệ');
                this.savingCurriculum = false;
                return;
            }

            const data: any = {
                curriculumId: curriculumId,
                blockId: blockId,
                subjectId: subjectId,
                recommendedSemester: Number(subject.recommendedSemester) || 1
            };

            if (this.isEditing) {
                if (isNaN(dataId) || dataId <= 0) {
                    this.flashMessage.error('Không tìm thấy định danh bản ghi để cập nhật');
                    this.savingCurriculum = false;
                    return;
                }
                data.id = dataId;
                if (!this.hasChanges()) {
                    this.flashMessage.info('Không có thay đổi nào để cập nhật');
                    this.savingCurriculum = false;
                    return;
                }
                this.curriculumService.updateCurriculumSubject(data).subscribe({
                    next: () => {
                        this.flashMessage.success('Cập nhật học phần theo khung thành công');
                        this.syncBlockCredits(data.blockId);
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
                this.curriculumService.addSubjectToCurriculum(data).subscribe({
                    next: () => {
                        this.flashMessage.success('Thêm học phần vào khung thành công');
                        this.syncBlockCredits(data.blockId);
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
            const item = this.curriculumToDelete as any;
            const itemId = Number(item.id);

            if (this.activeTab === 'PROGRAM') {
                if (isNaN(itemId) || itemId <= 0) {
                    this.flashMessage.error('ID chương trình đào tạo không hợp lệ');
                    this.deletingCurriculum = false;
                    return;
                }
                this.curriculumService.deleteCurriculum(itemId).subscribe({
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
                if (isNaN(itemId) || itemId <= 0) {
                    this.flashMessage.error('ID khối kiến thức không hợp lệ');
                    this.deletingCurriculum = false;
                    return;
                }
                this.curriculumService.deleteKnowledgeBlock(itemId).subscribe({
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
                const curriculumId = Number(item.curriculumId);
                const subjectId = Number(item.subjectId);
                const blockId = Number(item.blockId);

                if (isNaN(curriculumId) || curriculumId <= 0 || isNaN(subjectId) || subjectId <= 0) {
                    this.flashMessage.error('ID không hợp lệ để thực hiện xóa');
                    this.deletingCurriculum = false;
                    return;
                }

                this.curriculumService.deleteCurriculumSubject(curriculumId, subjectId).subscribe({
                    next: () => {
                        this.flashMessage.success('Xóa học phần khỏi khung thành công');
                        if (!isNaN(blockId) && blockId > 0) {
                            this.syncBlockCredits(blockId);
                        }
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

    getSearchTerm(): string {
        return this.tabFilters[this.activeTab].searchTerm || '';
    }

    setSearchTerm(val: string): void {
        this.tabFilters[this.activeTab].searchTerm = val;
    }

    getSelectedMajorName(): string {
        const id = this.tabFilters[this.activeTab].majorId;
        if (!id) return 'Tất cả các ngành học';
        const major = this.majors.find(m => m.id === id);
        return major ? major.majorName : 'Tất cả các ngành học';
    }

    getSelectedCurriculumName(): string {
        const id = this.tabFilters[this.activeTab].curriculumId;
        if (!id) return 'Tất cả chương trình';
        const curr = this.curriculums.find(c => c.id === id);
        return curr ? curr.curriculumName : 'Tất cả chương trình';
    }

    getSelectedBlockName(): string {
        const id = this.tabFilters[this.activeTab].blockId;
        if (!id) return 'Tất cả khối';
        const block = this.knowledgeBlocks.find(b => b.id === id);
        return block ? block.blockName : 'Tất cả khối';
    }

    resetFilters(): void {
        const f = this.tabFilters[this.activeTab];
        f.majorId = null;
        f.status = 'ALL';
        f.curriculumId = null;
        f.blockId = null;
        f.searchTerm = '';
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

    getAvailableCurriculumsForFilter(): CurriculumDTO[] {
        const majorId = this.tabFilters[this.activeTab].majorId;
        if (!majorId) return this.curriculums;
        return this.curriculums.filter(c => c.majorId === majorId);
    }

    getAvailableBlocksForFilter(): any[] {
        // In modal or delete modal, handle relation
        if (this.showModal || this.showDeleteModal) {
            const curriculumId = this.currentCurriculum?.curriculumId;
            if (!curriculumId) return this.knowledgeBlocks;
            return this.knowledgeBlocks.filter(b => b.curriculumId === curriculumId);
        }

        // In the filter menu, filter based on current tab's selections
        const filter = this.tabFilters[this.activeTab];

        // If curriculum is selected, show only blocks for that curriculum
        if (filter.curriculumId) {
            return this.knowledgeBlocks.filter(b => b.curriculumId === filter.curriculumId);
        }

        // If only major is selected, show blocks for all curriculums of that major
        if (filter.majorId) {
            const allowedCurriculumIds = this.getAvailableCurriculumsForFilter().map(c => c.id);
            return this.knowledgeBlocks.filter(b => allowedCurriculumIds.includes(b.curriculumId));
        }

        return this.knowledgeBlocks;
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

    getModalBlockTypeLabel(): string {
        const type = (this.currentCurriculum as any).blockType;
        if (type === 'MANDATORY') return 'Bắt buộc';
        if (type === 'ELECTIVE') return 'Tự chọn';
        return 'Chọn loại khối';
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

    getMandatoryCreditsInfo(): { current: number, total: number } {
        const curriculumId = this.currentCurriculum?.curriculumId || this.currentCurriculum?.id;
        if (!curriculumId) return { current: 0, total: 0 };
        const curriculum = this.curriculums.find(c => c.id === Number(curriculumId));
        if (!curriculum) return { current: 0, total: 0 };
        const blocks = this.knowledgeBlocks.filter(b => b.curriculumId === curriculum.id && b.blockType === 'MANDATORY');
        let existingSum = 0;

        // Auto-recalculate current block's credits if it's mandatory
        if (this.activeTab === 'BLOCK' && this.currentCurriculum.blockType === 'MANDATORY') {
            const blockSubjects = this.curriculumSubjects.filter(s => s.blockId === this.currentCurriculum.id);
            this.currentCurriculum.creditsRequired = blockSubjects.reduce((acc, s) => acc + (s.credits || 0), 0);
        }

        blocks.forEach(b => {
            if (this.activeTab === 'BLOCK' && this.isEditing && b.id === this.currentCurriculum.id) return;

            // If it's a mandatory block, we should also auto-calculate its credits based on assigned subjects
            // but for now we rely on its stored value since it was calculated during its own save
            existingSum += (b.creditsRequired || 0);
        });
        const typingCredits = (this.activeTab === 'BLOCK' && this.currentCurriculum.blockType === 'MANDATORY') ? (Number(this.currentCurriculum.creditsRequired) || 0) : 0;
        return { current: existingSum + typingCredits, total: curriculum.totalCreditsRequired };
    }

    syncBlockCredits(blockId: number): void {
        const block = this.knowledgeBlocks.find(b => b.id === blockId);
        if (!block || block.blockType !== 'MANDATORY') return;

        this.curriculumService.getAllCurriculumSubjects().subscribe(subjects => {
            this.curriculumSubjects = subjects;
            const blockSubjects = subjects.filter(s => s.blockId === blockId);
            const totalCredits = blockSubjects.reduce((acc, s) => acc + (s.credits || 0), 0);

            // Only update if credits changed
            if (block.creditsRequired !== totalCredits) {
                const updatedBlock = { ...block, creditsRequired: totalCredits };
                this.curriculumService.updateKnowledgeBlock(blockId, updatedBlock).subscribe(() => {
                    this.loadKnowledgeBlocks();
                });
            }
        });
    }

    navigateToBlocks(item: any): void {
        this.tabFilters['BLOCK'].majorId = item.majorId;
        this.tabFilters['BLOCK'].curriculumId = item.id;
        this.setTab('BLOCK');
        this.onFilter();
    }

    navigateToSubjects(item: any): void {
        const curriculum = this.curriculums.find(c => c.id === item.curriculumId);
        if (curriculum) {
            this.tabFilters['SUBJECT'].majorId = curriculum.majorId;
        } else {
            this.tabFilters['SUBJECT'].majorId = null;
        }
        this.tabFilters['SUBJECT'].curriculumId = item.curriculumId;
        this.tabFilters['SUBJECT'].blockId = item.id;
        this.setTab('SUBJECT');
        this.onFilter();
    }
}

