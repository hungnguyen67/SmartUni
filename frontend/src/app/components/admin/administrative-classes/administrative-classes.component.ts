import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AdministrativeClassDTO, AdministrativeClassService } from '../../../services/administrative-class.service';
import { MajorDTO, MajorService } from '../../../services/major.service';
import { LecturerDTO, LecturerService } from '../../../services/lecturer.service';
import { RegistrationService } from '../../../services/registration.service';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-administrative-classes',
    templateUrl: './administrative-classes.component.html'
})
export class AdministrativeClassesComponent implements OnInit, OnDestroy {
    private registrationSub?: Subscription;
    // Data lists
    classes: AdministrativeClassDTO[] = [];
    filteredClasses: AdministrativeClassDTO[] = [];
    majors: MajorDTO[] = [];
    lecturers: LecturerDTO[] = [];

    // Filter states
    searchTerm: string = '';
    selectedMajorId: number | null = null;
    selectedYear: string = '';
    selectedAdvisorId: number | null = null;
    selectedStatus: string = 'ALL';

    // UI states
    activeDropdown: string = '';
    showFilter: boolean = false;
    loading: boolean = false;

    // Pagination
    currentPage: number = 1;
    itemsPerPage: number = 10;

    constructor(
        private classService: AdministrativeClassService,
        private majorService: MajorService,
        private lecturerService: LecturerService,
        private registrationService: RegistrationService,
        private flashMessage: FlashMessageService
    ) { }

    ngOnInit(): void {
        this.loadMajors();
        this.loadLecturers();
        this.loadClasses();

        // Cập nhật ngay khi có sự kiện đăng ký (qua WebSocket)
        this.registrationSub = this.registrationService.registrationUpdates$.subscribe(() => {
            this.loadClasses();
        });
    }

    ngOnDestroy(): void {
        if (this.registrationSub) {
            this.registrationSub.unsubscribe();
        }
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

    loadMajors(): void {
        this.majorService.getMajors().subscribe((data: MajorDTO[]) => this.majors = data);
    }

    loadLecturers(): void {
        this.lecturerService.getLecturers().subscribe((data: LecturerDTO[]) => this.lecturers = data);
    }

    loadClasses(): void {
        this.loading = true;
        this.classService.getClasses().subscribe({
            next: (data: AdministrativeClassDTO[]) => {
                this.classes = data;
                this.onSearch();
                this.loading = false;
            },
            error: (err: any) => {
                this.loading = false;
                this.flashMessage.handleError(err);
            }
        });
    }

    onSearch(): void {
        const search = this.searchTerm.toLowerCase();
        this.filteredClasses = this.classes.filter(c => {
            const matchesSearch = !this.searchTerm ||
                c.classCode.toLowerCase().includes(search) ||
                (c.className && c.className.toLowerCase().includes(search)) ||
                (c.majorCode && c.majorCode.toLowerCase().includes(search)) ||
                (c.majorName && c.majorName.toLowerCase().includes(search));

            const matchesMajor = !this.selectedMajorId || c.majorId === Number(this.selectedMajorId);
            const matchesYear = !this.selectedYear || c.academicYear.toLowerCase().includes(this.selectedYear.toLowerCase());
            const matchesAdvisor = !this.selectedAdvisorId || c.advisorId === Number(this.selectedAdvisorId);
            const matchesStatus = this.selectedStatus === 'ALL' || c.status === this.selectedStatus;

            return matchesSearch && matchesMajor && matchesYear && matchesAdvisor && matchesStatus;
        });

        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedMajorId = null;
        this.selectedYear = '';
        this.selectedAdvisorId = null;
        this.selectedStatus = 'ALL';
        this.loadClasses();
    }

    refreshData(): void {
        this.loadMajors();
        this.loadLecturers();
        this.loadClasses();
    }

    getSelectedMajorName(): string {
        if (!this.selectedMajorId) return 'Tất cả các ngành học';
        const major = this.majors.find(m => m.id === Number(this.selectedMajorId));
        return major ? major.majorName : 'Tất cả các ngành học';
    }

    getSelectedAdvisorName(): string {
        if (!this.selectedAdvisorId) return 'Tất cả cố vấn';
        const lecturer = this.lecturers.find(l => l.id === Number(this.selectedAdvisorId));
        return lecturer ? lecturer.fullName : 'Tất cả cố vấn';
    }

    get totalPages(): number {
        return Math.ceil(this.filteredClasses.length / this.itemsPerPage) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredClasses.length);
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    getStatusLabel(status: string | undefined): string {
        const s = status || 'ALL';
        const map: any = { 
            'ACTIVE': 'Đang hoạt động', 
            'INACTIVE': 'Ngưng hoạt động', 
            'GRADUATED': 'Đã tốt nghiệp',
            'DRAFT': 'Bản nháp',
            'ALL': 'Tất cả trạng thái'
        };
        return map[s] || s;
    }

    getStatusClass(status: string | undefined): string {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'INACTIVE': return 'bg-red-50 text-red-600 border-red-200';
            case 'GRADUATED': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'DRAFT': return 'bg-amber-50 text-amber-600 border-amber-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    }

    get paginatedClasses(): AdministrativeClassDTO[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredClasses.slice(start, start + this.itemsPerPage);
    }

    editClass(item: any) { console.log('Edit', item); }
    deleteClass(item: any) { if (confirm('Xác nhận xóa lớp này?')) console.log('Delete', item); }
    openAddModal() { console.log('Open Add Class Modal'); }
}