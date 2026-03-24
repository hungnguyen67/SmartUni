import { Component, OnInit, HostListener } from '@angular/core';
import { SubjectService, SubjectDTO } from '../../../services/subject.service';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';

@Component({
    selector: 'app-subjects',
    templateUrl: './subjects.component.html'
})
export class SubjectsComponent implements OnInit {

    subjects: SubjectDTO[] = [];
    filteredSubjects: SubjectDTO[] = [];
    searchTerm: string = '';

    currentPage: number = 1;
    itemsPerPage: number = 10;

    showFilter: boolean = false;
    activeDropdown: string = '';
    selectedStatus: string = 'ALL';

    showModal: boolean = false;
    isEditing: boolean = false;
    currentSubject: Partial<SubjectDTO> = {};
    originalSubject: SubjectDTO | null = null;

    showDeleteModal: boolean = false;
    subjectToDelete: SubjectDTO | null = null;
    deletingSubject: boolean = false;
    savingSubject: boolean = false;

    constructor(
        private subjectService: SubjectService,
        private flashMessage: FlashMessageService
    ) { }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.filter-menu-wrapper')) {
            this.showFilter = false;
        }
        
        // Reset activeDropdown if clicking outside any relative container (which houses our dropdowns)
        if (!target.closest('.relative')) {
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
        this.loadSubjects();
    }

    loadSubjects(): void {
        this.subjectService.getAllSubjects().subscribe(data => {
            this.subjects = data;
            this.onSearch();
        });
    }

    onSearch(): void {
        this.filteredSubjects = this.subjects.filter(s => {
            const matchesSearch = !this.searchTerm ||
                s.subjectCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (s.description && s.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

            const matchesStatus = this.selectedStatus === 'ALL' || s.status === this.selectedStatus;
            return matchesSearch && matchesStatus;
        });
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedStatus = 'ALL';
        this.onSearch();
    }

    get paginatedSubjects(): SubjectDTO[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredSubjects.slice(start, start + this.itemsPerPage);
    }

    get totalPages(): number {
        return Math.ceil(this.filteredSubjects.length / this.itemsPerPage) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredSubjects.length);
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
        this.currentSubject = {
            subjectCode: '',
            name: '',
            credits: 0,
            theoryPeriods: 0,
            practicalPeriods: 0,
            description: '',
            status: 'ACTIVE',
            relations: []
        };
        this.showModal = true;
    }

    editSubject(subject: SubjectDTO): void {
        this.isEditing = true;
        this.originalSubject = JSON.parse(JSON.stringify(subject));
        this.currentSubject = JSON.parse(JSON.stringify(subject));
        if (!this.currentSubject.relations) this.currentSubject.relations = [];
        this.showModal = true;
    }

    hasChanges(): boolean {
        if (!this.isEditing) return true;
        if (!this.originalSubject) return false;

        const baseChanges = this.currentSubject.subjectCode !== this.originalSubject.subjectCode ||
            this.currentSubject.name !== this.originalSubject.name ||
            this.currentSubject.credits !== this.originalSubject.credits ||
            this.currentSubject.theoryPeriods !== this.originalSubject.theoryPeriods ||
            this.currentSubject.practicalPeriods !== this.originalSubject.practicalPeriods ||
            this.currentSubject.description !== this.originalSubject.description ||
            this.currentSubject.status !== this.originalSubject.status;

        const relationsChanged = JSON.stringify(this.currentSubject.relations) !== JSON.stringify(this.originalSubject.relations);

        return baseChanges || relationsChanged;
    }

    closeModal(): void {
        this.showModal = false;
        this.originalSubject = null;
        this.activeDropdown = '';
    }

    saveSubject(): void {
        if (!this.currentSubject.subjectCode) {
            this.flashMessage.error('Vui lòng nhập mã học phần');
            return;
        }
        if (!this.currentSubject.name) {
            this.flashMessage.error('Vui lòng nhập tên học phần');
            return;
        }
        if (this.currentSubject.credits === undefined || this.currentSubject.credits === null) {
            this.flashMessage.error('Vui lòng nhập số tín chỉ');
            return;
        }

        // Prepare relations: filter out empty ones
        if (this.currentSubject.relations) {
            this.currentSubject.relations = this.currentSubject.relations
                .filter(r => r.subjectCode)
                .map(r => ({
                    ...r,
                    effectiveFrom: r.effectiveFrom || null,
                    effectiveTo: r.effectiveTo || null
                }));
        }

        // Satisfy DB constraint: credits = theoryCredits + practicalCredits
        // Rule: 15 periods LT = 1 credit, 30 periods TH = 1 credit (approx)
        // But we must follow the sum constraint strictly.
        const theoryCredits = Math.floor((this.currentSubject.theoryPeriods || 0) / 15);
        this.currentSubject.theoryCredits = Math.min(theoryCredits, this.currentSubject.credits || 0);
        this.currentSubject.practicalCredits = (this.currentSubject.credits || 0) - this.currentSubject.theoryCredits;

        if (this.isEditing) {
            if (!this.hasChanges()) {
                this.flashMessage.info('Không có thay đổi nào để cập nhật');
                return;
            }
            this.savingSubject = true;
            this.subjectService.updateSubject(this.currentSubject.id!, this.currentSubject).subscribe({
                next: () => {
                    this.flashMessage.success('Cập nhật học phần thành công');
                    this.loadSubjects();
                    this.closeModal();
                    this.savingSubject = false;
                },
                error: (err) => {
                    this.savingSubject = false;
                    this.flashMessage.handleError(err);
                }
            });
        } else {
            this.savingSubject = true;
            this.subjectService.createSubject(this.currentSubject).subscribe({
                next: () => {
                    this.flashMessage.success('Thêm học phần thành công');
                    this.loadSubjects();
                    this.closeModal();
                    this.savingSubject = false;
                },
                error: (err) => {
                    this.savingSubject = false;
                    this.flashMessage.handleError(err);
                }
            });
        }
    }

    deleteSubject(subject: SubjectDTO): void {
        this.subjectToDelete = subject;
        this.showDeleteModal = true;
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.subjectToDelete = null;
        this.deletingSubject = false;
    }

    confirmDelete(): void {
        if (this.subjectToDelete) {
            this.deletingSubject = true;
            this.subjectService.deleteSubject(this.subjectToDelete.id).subscribe({
                next: () => {
                    this.flashMessage.success(`Đã xóa học phần ${this.subjectToDelete?.name}`);
                    this.loadSubjects();
                    this.closeDeleteModal();
                },
                error: (err) => {
                    this.deletingSubject = false;
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

    // Relation Helpers
    getRelation(type: 'PREREQUISITE' | 'EQUIVALENT'): any {
        if (!this.currentSubject.relations) this.currentSubject.relations = [];
        let rel = this.currentSubject.relations.find(r => r.relationType === type);
        if (!rel) {
            rel = {
                relationType: type,
                subjectCode: '',
                subjectName: '',
                minGrade: 'D',
                isParallel: false,
                effectiveFrom: '',
                effectiveTo: ''
            };
            this.currentSubject.relations.push(rel);
        }
        return rel;
    }

    updateRelationSubject(type: 'PREREQUISITE' | 'EQUIVALENT', event: Event) {
        const select = event.target as HTMLSelectElement;
        const code = select.value;
        const rel = this.getRelation(type);
        rel.subjectCode = code;
        const sub = this.subjects.find(s => s.subjectCode === code);
        rel.subjectName = sub ? sub.name : '';
    }

    getBindingConditions(subject: SubjectDTO): string {
        if (!subject.relations || subject.relations.length === 0) return '';
        return subject.relations
            .filter(rel => rel.subjectCode) // Only show relations with a selected subject
            .map(rel => {
                const label = rel.relationType === 'PREREQUISITE' ? 'Tiên quyết' : 'Tương đương';
                return `${label}(${rel.subjectName})`;
            }).join(', ');
    }

    getSubjectNameByCode(code: string): string {
        const sub = this.subjects.find(s => s.subjectCode === code);
        return sub ? sub.name : '';
    }

    selectRelationSubject(type: 'PREREQUISITE' | 'EQUIVALENT', code: string) {
        const rel = this.getRelation(type);
        rel.subjectCode = code;
        rel.subjectName = this.getSubjectNameByCode(code);
    }
}
