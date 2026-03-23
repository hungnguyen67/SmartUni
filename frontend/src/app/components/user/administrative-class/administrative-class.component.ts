import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AdministrativeClassService, AdministrativeClassDTO } from '../../../services/administrative-class.service';
import { StudentService, StudentDTO } from '../../../services/student.service';
import { AuthService } from '../../../auth.service';
import { FacultyService, FacultyDTO } from '../../../services/faculty.service';
import { RegistrationService } from '../../../services/registration.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-administrative-class',
    templateUrl: './administrative-class.component.html'
})
export class AdministrativeClassComponent implements OnInit, OnDestroy {
    private registrationSub?: Subscription;
    allClasses: AdministrativeClassDTO[] = [];
    filteredClasses: AdministrativeClassDTO[] = [];
    faculties: FacultyDTO[] = [];
    
    loading = false;
    searchTerm = '';
    selectedFacultyId: number | null = null;
    selectedCohort: number | null = null;
    selectedStatus: string = '';
    
    activeDropdown = '';
    showFilter = false;
    availableCohorts: number[] = [];

    // Modal State
    showStudentModal = false;
    selectedClass: AdministrativeClassDTO | null = null;
    students: StudentDTO[] = [];
    filteredStudents: StudentDTO[] = [];
    studentSearchTerm = '';
    
    // Pagination for students
    studentCurrentPage = 1;
    studentItemsPerPage = 10;
    studentTotalItems = 0;

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalItems = 0;

    constructor(
        private classService: AdministrativeClassService,
        private studentService: StudentService,
        private authService: AuthService,
        private facultyService: FacultyService,
        private registrationService: RegistrationService
    ) { }

    ngOnInit(): void {
        this.loadFaculties();
        this.loadMyClasses();

        // Tự động cập nhật khi có tín hiệu đăng ký mới (Real-time qua WebSocket)
        this.registrationSub = this.registrationService.registrationUpdates$.subscribe(() => {
            this.loadMyClasses();
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

    loadFaculties(): void {
        this.facultyService.getFaculties().subscribe({
            next: (data) => this.faculties = data,
            error: (err) => console.error('Error loading faculties', err)
        });
    }

    loadMyClasses(): void {
        const currentUser = this.authService.getUserFromStorage();
        if (!currentUser || !currentUser.id) return;

        this.loading = true;
        this.classService.getClassesByAdvisor(currentUser.id).subscribe({
            next: (data) => {
                this.allClasses = data;
                this.availableCohorts = Array.from(new Set(data.map(c => c.cohort).filter(c => !!c) as number[])).sort((a,b) => b-a);
                this.onFilterChange();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading classes', err);
                this.loading = false;
            }
        });
    }

    onFilterChange(): void {
        this.filteredClasses = this.allClasses.filter(c => {
            const matchesSearch = !this.searchTerm || 
                c.classCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                c.className.toLowerCase().includes(this.searchTerm.toLowerCase());
            
            const matchesFaculty = !this.selectedFacultyId || c.majorId === this.selectedFacultyId; // Assuming majorId maps to faculty or similar
            const matchesStatus = !this.selectedStatus || c.status === this.selectedStatus;
            const matchesCohort = !this.selectedCohort || c.cohort === this.selectedCohort;

            return matchesSearch && matchesStatus && matchesCohort;
        });

        this.totalItems = this.filteredClasses.length;
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedFacultyId = null;
        this.selectedCohort = null;
        this.selectedStatus = '';
        this.onFilterChange();
    }

    get pagedClasses(): AdministrativeClassDTO[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredClasses.slice(startIndex, startIndex + this.itemsPerPage);
    }

    get totalPages(): number {
        return Math.ceil(this.totalItems / this.itemsPerPage) || 1;
    }

    get activeClassesCount(): number {
        return this.allClasses.filter(c => c.status === 'ACTIVE').length;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    }

    prevPage(): void {
        if (this.currentPage > 1) this.currentPage--;
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) this.currentPage++;
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'ACTIVE': return 'Đang hoạt động';
            case 'INACTIVE': return 'Tạm ngưng';
            case 'GRADUATED': return 'Đã tốt nghiệp';
            case 'DRAFT': return 'Nháp';
            default: return status;
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'INACTIVE': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'GRADUATED': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'DRAFT': return 'bg-slate-50 text-slate-600 border-slate-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    }

    getAverageGpaClass(gpa: number | undefined): string {
        if (!gpa) return 'text-slate-400';
        if (gpa >= 3.6) return 'text-emerald-600 font-bold';
        if (gpa >= 3.2) return 'text-blue-600 font-bold';
        if (gpa >= 2.5) return 'text-slate-800';
        if (gpa >= 2.0) return 'text-amber-600';
        return 'text-red-600 font-bold';
    }

    // Student Detail Methods
    viewClassDetails(adminClass: AdministrativeClassDTO): void {
        this.selectedClass = adminClass;
        this.showStudentModal = true;
        this.loadStudents();
    }

    closeStudentModal(): void {
        this.showStudentModal = false;
        this.selectedClass = null;
        this.students = [];
        this.filteredStudents = [];
    }

    loadStudents(): void {
        if (!this.selectedClass) return;
        this.loading = true;
        this.studentService.getStudents({ classId: this.selectedClass.id }).subscribe({
            next: (data) => {
                this.students = data;
                this.onStudentFilterChange();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading students', err);
                this.loading = false;
            }
        });
    }

    onStudentFilterChange(): void {
        this.filteredStudents = this.students.filter(s => {
            const search = this.studentSearchTerm.toLowerCase();
            return !search || 
                s.studentCode.toLowerCase().includes(search) ||
                s.fullName.toLowerCase().includes(search);
        });
        this.studentTotalItems = this.filteredStudents.length;
        this.studentCurrentPage = 1;
    }

    get pagedStudents(): StudentDTO[] {
        const startIndex = (this.studentCurrentPage - 1) * this.studentItemsPerPage;
        return this.filteredStudents.slice(startIndex, startIndex + this.studentItemsPerPage);
    }

    get studentTotalPages(): number {
        return Math.ceil(this.studentTotalItems / this.studentItemsPerPage) || 1;
    }

    get studentMinEnd(): number {
        return Math.min(this.studentCurrentPage * this.studentItemsPerPage, this.studentTotalItems);
    }

    getStudentFirstName(fullName: string): string {
        const parts = fullName.trim().split(' ');
        return parts.length > 0 ? parts[parts.length - 1] : '';
    }

    getStudentLastName(fullName: string): string {
        const parts = fullName.trim().split(' ');
        return parts.length > 1 ? parts.slice(0, parts.length - 1).join(' ') : '';
    }

    getStudentStatusLabel(status: string): string {
        switch (status) {
            case 'STUDYING': return 'Đang học';
            case 'DROPPED': return 'Thôi học';
            case 'GRADUATED': return 'Đã tốt nghiệp';
            case 'SUSPENDED': return 'Đình chỉ';
            default: return status;
        }
    }

    getStudentStatusClass(status: string): string {
        switch (status) {
            case 'STUDYING': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'DROPPED': return 'bg-red-50 text-red-600 border-red-100';
            case 'GRADUATED': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'SUSPENDED': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    }
}
