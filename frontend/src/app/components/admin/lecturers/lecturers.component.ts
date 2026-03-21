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
            return !this.filterStatus || l.status === this.filterStatus;
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

    getGenderName(gender: string): string {
        const map: any = { 'Male': 'Nam', 'Female': 'Nữ', 'Other': 'Khác' };
        return map[gender] || 'Khác';
    }

    getStatusLabel(status: string): string {
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

    getStatusClass(status: string): string {
        switch (status) {
            case 'WORKING': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'ON_LEAVE': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'RESIGNED': return 'bg-red-50 text-red-600 border-red-200';
            case 'RETIRED': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    }

    editLecturer(lecturer: LecturerDTO): void {
        console.log('Edit', lecturer);
    }

    deleteLecturer(lecturer: LecturerDTO): void {
        if (confirm(`Xác nhận xóa giảng viên ${lecturer.fullName}?`)) {
            console.log('Delete', lecturer.id);
        }
    }

    openAddModal(): void {
        console.log('Open Add Modal');
    }
}