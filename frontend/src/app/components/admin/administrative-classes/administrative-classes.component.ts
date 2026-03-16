import { Component, OnInit, HostListener } from '@angular/core';
import { AdministrativeClassDTO, AdministrativeClassService } from '../../../services/administrative-class.service';
import { MajorDTO, MajorService } from '../../../services/major.service';
import { LecturerDTO, LecturerService } from '../../../services/lecturer.service';

@Component({
    selector: 'app-administrative-classes',
    templateUrl: './administrative-classes.component.html'
})
export class AdministrativeClassesComponent implements OnInit {
    // Data lists
    classes: AdministrativeClassDTO[] = [];
    paginatedClasses: AdministrativeClassDTO[] = [];
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
        private lecturerService: LecturerService
    ) { }

    ngOnInit(): void {
        this.loadMajors();
        this.loadLecturers();
        this.loadClasses();
    }

    // Tương tác: Click bên ngoài vùng chứa (.dropdown-container) sẽ tự đóng menu
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown-container')) {
            this.activeDropdown = '';
        }
    }

    loadMajors(): void {
        this.majorService.getMajors().subscribe(data => this.majors = data);
    }

    loadLecturers(): void {
        this.lecturerService.getLecturers().subscribe(data => this.lecturers = data);
    }

    loadClasses(): void {
        this.loading = true;
        this.classService.getClasses().subscribe({
            next: (data) => {
                this.classes = data;
                this.onSearch(); // Sử dụng tên hàm onSearch giống code mẫu
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    onSearch(): void {
        const search = this.searchTerm.toLowerCase();
        const filtered = this.classes.filter(c => {
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
        this.updatePagination(filtered);
        this.filteredCount = filtered.length;
    }

    private filteredCount = 0;

    updatePagination(data: AdministrativeClassDTO[] = this.classes): void {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.paginatedClasses = data.slice(startIndex, endIndex);
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedMajorId = null;
        this.selectedYear = '';
        this.selectedAdvisorId = null;
        this.selectedStatus = 'ALL';
        this.onSearch();
    }

    // Getters cho giao diện
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
        return Math.ceil(this.filteredCount / this.itemsPerPage) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredCount);
    }

    get totalItems(): number {
        return this.filteredCount;
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadClasses();
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadClasses();
        }
    }

    getStatusLabel(status: string): string {
        const map: any = { 
            'ACTIVE': 'Đang hoạt động', 
            'INACTIVE': 'Ngưng hoạt động', 
            'GRADUATED': 'Đã tốt nghiệp',
            'DRAFT': 'Bản nháp'
        };
        return map[status] || status || 'Không xác định';
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'INACTIVE': return 'bg-red-50 text-red-600 border-red-200';
            case 'GRADUATED': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'DRAFT': return 'bg-amber-50 text-amber-600 border-amber-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    }

    editClass(item: any) { console.log('Edit', item); }
    deleteClass(item: any) { if (confirm('Xác nhận xóa lớp này?')) console.log('Delete', item); }
    openAddModal() { console.log('Open Add Class Modal'); }
}