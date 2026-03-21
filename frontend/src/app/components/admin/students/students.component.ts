import { Component, OnInit, HostListener } from '@angular/core';
import { StudentDTO, StudentService } from '../../../services/student.service';
import { MajorDTO, MajorService } from '../../../services/major.service';
import { AdministrativeClassDTO, AdministrativeClassService } from '../../../services/administrative-class.service';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';

@Component({
    selector: 'app-students',
    templateUrl: './students.component.html'
})
export class StudentsComponent implements OnInit {
    students: StudentDTO[] = [];
    paginatedStudents: StudentDTO[] = [];
    majors: MajorDTO[] = [];
    classes: AdministrativeClassDTO[] = [];
    enrollmentYears: number[] = [];

    activeDropdown: string = '';
    showFilter: boolean = false;
    loading: boolean = false;

    filters = {
        searchTerm: '',
        majorId: null as number | null,
        classId: null as number | null,
        enrollmentYear: null as number | null,
        status: '',
        minGpa: null as number | null,
        maxGpa: null as number | null
    };

    currentPage = 1;
    itemsPerPage = 10;

    constructor(
        private studentService: StudentService,
        private majorService: MajorService,
        private classService: AdministrativeClassService,
        private flashMessage: FlashMessageService
    ) { }

    ngOnInit(): void {
        this.loadMajors();
        this.loadClasses();
        this.loadEnrollmentYears();
        this.loadStudents();
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

    loadClasses(): void {
        this.classService.getClasses().subscribe((data: AdministrativeClassDTO[]) => this.classes = data);
    }

    loadEnrollmentYears(): void {
        this.studentService.getEnrollmentYears().subscribe((data: number[]) => this.enrollmentYears = data);
    }

    loadStudents(): void {
        this.loading = true;
        this.studentService.getStudents(this.filters).subscribe({
            next: (data: StudentDTO[]) => {
                this.students = data;
                this.currentPage = 1;
                this.updatePagination();
                this.loading = false;
            },
            error: (err: any) => {
                this.loading = false;
                this.flashMessage.handleError(err);
            }
        });
    }

    updatePagination(): void {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.paginatedStudents = this.students.slice(startIndex, endIndex);
    }

    get totalPages(): number {
        return Math.ceil(this.students.length / this.itemsPerPage) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.students.length);
    }

    applyFilters(): void {
        this.loadStudents();
    }

    resetFilters(): void {
        this.filters = {
            searchTerm: '',
            majorId: null,
            classId: null,
            enrollmentYear: null,
            status: '',
            minGpa: null,
            maxGpa: null
        };
        this.applyFilters();
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

    getSelectedMajorName(): string {
        if (!this.filters.majorId) return 'Tất cả các ngành học';
        const major = this.majors.find(m => Number(m.id) === Number(this.filters.majorId));
        return major ? major.majorName : 'Tất cả các ngành học';
    }

    getSelectedClassName(): string {
        if (!this.filters.classId) return 'Tất cả các lớp';
        const clazz = this.classes.find(c => Number(c.id) === Number(this.filters.classId));
        return clazz ? clazz.classCode : 'Tất cả các lớp';
    }

    getSelectedYearLabel(): string {
        if (!this.filters.enrollmentYear) return 'Tất cả các khóa';
        return 'Khóa ' + this.filters.enrollmentYear;
    }

    getSelectedStatusLabel(): string {
        if (!this.filters.status) return 'Tất cả trạng thái';
        return this.getStatusName(this.filters.status);
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'STUDYING': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'GRADUATED': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'ACADEMIC_RESERVE': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'DROPPED_OUT':
            case 'SUSPENDED': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    }

    getStatusName(status: string): string {
        const map: any = {
            'STUDYING': 'Đang học',
            'GRADUATED': 'Đã tốt nghiệp',
            'ACADEMIC_RESERVE': 'Bảo lưu',
            'DROPPED_OUT': 'Thôi học'
        };
        return map[status] || status || '---';
    }

    editStudent(student: StudentDTO): void {
        console.log('Edit', student);
    }

    deleteStudent(student: StudentDTO): void {
        if (confirm(`Xóa sinh viên ${student.fullName}?`)) {
            console.log('Delete', student.id);
        }
    }

    openAddModal(): void {
        console.log('Open Add Modal');
    }
}