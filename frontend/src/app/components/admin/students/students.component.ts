import { Component, OnInit, HostListener } from '@angular/core';
import { StudentDTO, StudentService } from '../../../services/student.service';
import { MajorDTO, MajorService } from '../../../services/major.service';
import { AdministrativeClassDTO, AdministrativeClassService } from '../../../services/administrative-class.service';

@Component({
    selector: 'app-students',
    templateUrl: './students.component.html'
})
export class StudentsComponent implements OnInit {
    students: StudentDTO[] = [];
    paginatedStudents: StudentDTO[] = [];
    majors: MajorDTO[] = [];
    classes: AdministrativeClassDTO[] = [];

    activeDropdown: string = '';

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
    pageSize = 10;

    constructor(
        private studentService: StudentService,
        private majorService: MajorService,
        private classService: AdministrativeClassService
    ) { }

    ngOnInit(): void {
        this.loadMajors();
        this.loadClasses();
        this.loadStudents();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
            this.activeDropdown = '';
        }
    }

    loadMajors(): void {
        this.majorService.getMajors().subscribe(data => this.majors = data);
    }

    loadClasses(): void {
        this.classService.getClasses().subscribe(data => this.classes = data);
    }

    loadStudents(): void {
        this.studentService.getStudents(this.filters).subscribe(data => {
            this.students = data;
            this.currentPage = 1;
            this.updatePagination();
        });
    }

    updatePagination(): void {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.paginatedStudents = this.students.slice(startIndex, endIndex);
    }

    get totalPages(): number {
        return Math.ceil(this.students.length / this.pageSize) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.pageSize, this.students.length);
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

    getSelectedStatusName(): string {
        if (!this.filters.status) return 'Tất cả trạng thái';
        return this.getStatusName(this.filters.status);
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'STUDYING': return 'bg-blue-100 text-blue-700';
            case 'GRADUATED': return 'bg-green-100 text-green-700';
            case 'ACADEMIC_RESERVE': return 'bg-yellow-100 text-yellow-700';
            case 'DROPPED_OUT': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
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
}