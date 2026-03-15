import { Component, OnInit, HostListener } from '@angular/core';
import { LecturerService, LecturerDTO } from '../../../services/lecturer.service';
import { FacultyService, FacultyDTO } from '../../../services/faculty.service';

@Component({
    selector: 'app-lecturers',
    templateUrl: './lecturers.component.html'
})
export class LecturersComponent implements OnInit {

    lecturers: LecturerDTO[] = [];
    paginatedLecturers: LecturerDTO[] = [];
    faculties: FacultyDTO[] = [];

    searchTerm: string = '';
    filterFaculty: number | null = null;
    activeDropdown: string = '';

    currentPage: number = 1;
    itemsPerPage: number = 10;

    constructor(
        private lecturerService: LecturerService,
        private facultyService: FacultyService
    ) { }

    ngOnInit(): void {
        this.loadFaculties();
        this.loadLecturers();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
            this.activeDropdown = '';
        }
    }

    loadFaculties(): void {
        this.facultyService.getFaculties().subscribe(data => this.faculties = data);
    }

    loadLecturers(): void {
        this.lecturerService.getLecturers(this.searchTerm, this.filterFaculty || undefined).subscribe(data => {
            this.lecturers = data;
            this.currentPage = 1;
            this.updatePagination();
        });
    }

    updatePagination(): void {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.paginatedLecturers = this.lecturers.slice(startIndex, endIndex);
    }

    onSearch(): void {
        this.loadLecturers();
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.filterFaculty = null;
        this.loadLecturers();
    }

    getSelectedFacultyName(): string {
        if (!this.filterFaculty) return 'Tất cả các khoa';
        const faculty = this.faculties.find(f => f.id === this.filterFaculty);
        return faculty ? faculty.facultyName : 'Tất cả các khoa';
    }

    get totalPages(): number {
        return Math.ceil(this.lecturers.length / this.itemsPerPage) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.lecturers.length);
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

    editLecturer(lecturer: LecturerDTO): void {
        console.log('Edit', lecturer);
    }

    deleteLecturer(lecturer: LecturerDTO): void {
        if (confirm(`Xác nhận xóa giảng viên ${lecturer.fullName}?`)) {
            console.log('Delete', lecturer.id);
        }
    }
}