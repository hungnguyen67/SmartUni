import { Component, OnInit, HostListener } from '@angular/core';
import { StudentDTO, StudentService } from '../../../services/student.service';
import { MajorDTO, MajorService } from '../../../services/major.service';
import { AdministrativeClassDTO, AdministrativeClassService } from '../../../services/administrative-class.service';
import { CurriculumDTO, CurriculumService } from '../../../services/curriculum.service';
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
    curriculums: CurriculumDTO[] = [];
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

    // Modal State
    showModal = false;
    showDeleteModal = false;
    isEditing = false;
    savingStudent = false;
    deletingStudent = false;
    currentStudent: Partial<StudentDTO> = {};
    originalStudent: StudentDTO | null = null;
    studentToDelete: StudentDTO | null = null;
    emailError: string | null = null;

    constructor(
        private studentService: StudentService,
        private majorService: MajorService,
        private classService: AdministrativeClassService,
        private curriculumService: CurriculumService,
        private flashMessage: FlashMessageService
    ) { }

    ngOnInit(): void {
        this.loadMajors();
        this.loadClasses();
        this.loadCurriculums();
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

    loadCurriculums(): void {
        this.curriculumService.getCurriculums().subscribe((data: CurriculumDTO[]) => this.curriculums = data);
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

    getGenderName(gender: string | undefined): string {
        const map: any = { 'Male': 'Nam', 'Female': 'Nữ', 'Other': 'Khác' };
        return map[gender || 'Other'] || 'Khác';
    }

    editStudent(student: StudentDTO): void {
        this.isEditing = true;
        this.currentStudent = { ...student };
        this.originalStudent = { ...student };
        this.showModal = true;
    }

    deleteStudent(student: StudentDTO): void {
        this.studentToDelete = student;
        this.showDeleteModal = true;
    }

    confirmDelete(): void {
        if (!this.studentToDelete) return;

        this.deletingStudent = true;
        this.studentService.deleteStudent(this.studentToDelete.id).subscribe({
            next: () => {
                this.flashMessage.success('Xóa sinh viên thành công!');
                this.loadStudents();
                this.closeDeleteModal();
                this.deletingStudent = false;
            },
            error: (err: any) => {
                this.deletingStudent = false;
                this.flashMessage.handleError(err);
            }
        });
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.studentToDelete = null;
    }

    openAddModal(): void {
        this.isEditing = false;
        this.currentStudent = {
            status: 'STUDYING',
            gender: 'Male',
            enrollmentYear: new Date().getFullYear(),
            totalCreditsEarned: 0,
            currentGpa: 0,
            currentGpa10: 0,
            password: 'Abc123',
            isEmailVerified: true,
            avatar: 'https://ui-avatars.com/api/?name=Student'
        };
        this.emailError = null;
        this.showModal = true;
    }

    closeMainModal(): void {
        this.showModal = false;
        this.currentStudent = {};
        this.emailError = null;
        this.activeDropdown = '';
    }

    onEnrollmentYearChange(): void {
        const availableClasses = this.getAvailableModalClasses();
        // If the current class is not in the available list for the new year, reset it
        if (this.currentStudent.classId && !availableClasses.some(c => c.id === this.currentStudent.classId)) {
            this.currentStudent.classId = undefined;
            this.currentStudent.className = '';
        }
    }

    getAvailableModalClasses(): AdministrativeClassDTO[] {
        if (!this.currentStudent.enrollmentYear) return this.classes;
        return this.classes.filter(c => Number(c.cohort) === Number(this.currentStudent.enrollmentYear));
    }

    handleBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.closeMainModal();
            this.closeDeleteModal();
        }
    }

    setModalClass(id: number, code: string): void {
        this.currentStudent.classId = id;
        this.currentStudent.className = code;
        this.activeDropdown = '';
        this.onClassChange();
    }

    onClassChange(): void {
        const availableCurriculums = this.getAvailableModalCurriculums();
        // If the current curriculum is not in the available list for the new class, reset it
        if (this.currentStudent.curriculumId && !availableCurriculums.some(c => c.id === this.currentStudent.curriculumId)) {
            this.currentStudent.curriculumId = undefined;
            this.currentStudent.curriculumName = '';
        }
    }

    getAvailableModalCurriculums(): CurriculumDTO[] {
        if (!this.currentStudent.classId) return this.curriculums;
        const selectedClass = this.classes.find(c => c.id === Number(this.currentStudent.classId));
        if (!selectedClass) return this.curriculums;
        
        return this.curriculums.filter(curr => Number(curr.majorId) === Number(selectedClass.majorId));
    }

    setModalCurriculum(id: number, name: string): void {
        this.currentStudent.curriculumId = id;
        this.currentStudent.curriculumName = name;
        this.activeDropdown = '';
    }

    setModalGender(gender: string): void {
        this.currentStudent.gender = gender;
        this.activeDropdown = '';
    }

    setModalStatus(status: string): void {
        this.currentStudent.status = status;
        this.activeDropdown = '';
    }

    hasChanges(): boolean {
        if (!this.originalStudent || !this.currentStudent) return false;
        return this.currentStudent.studentCode !== this.originalStudent.studentCode ||
               this.currentStudent.lastName !== this.originalStudent.lastName ||
               this.currentStudent.firstName !== this.originalStudent.firstName ||
               this.currentStudent.email !== this.originalStudent.email ||
               this.currentStudent.phone !== this.originalStudent.phone ||
               this.currentStudent.birthday !== this.originalStudent.birthday ||
               this.currentStudent.address !== this.originalStudent.address ||
               this.currentStudent.classId !== this.originalStudent.classId ||
               this.currentStudent.enrollmentYear !== this.originalStudent.enrollmentYear ||
               this.currentStudent.gender !== this.originalStudent.gender ||
               this.currentStudent.status !== this.originalStudent.status ||
               this.currentStudent.curriculumId !== this.originalStudent.curriculumId;
    }

    getClassName(id: any): string {
        if (!id) return 'Chọn lớp học';
        const clazz = this.classes.find(c => c.id === Number(id));
        return clazz ? clazz.classCode : 'Chọn lớp học';
    }

    getCurriculumName(id: any): string {
        if (!id) return 'Chọn chương trình đào tạo';
        const curriculum = this.curriculums.find(c => c.id === Number(id));
        return curriculum ? curriculum.curriculumName : 'Chọn chương trình đào tạo';
    }

    saveStudent(): void {
        if (!this.currentStudent.studentCode || !this.currentStudent.lastName || !this.currentStudent.firstName || !this.currentStudent.classId || !this.currentStudent.email) {
            this.flashMessage.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        this.emailError = null;

        if (this.isEditing && !this.hasChanges()) {
            this.flashMessage.info('Không có thay đổi nào để cập nhật');
            return;
        }

        const emailExists = this.students.some(s => s.email === this.currentStudent.email && (!this.isEditing || s.id !== this.currentStudent.id));
        if (emailExists) {
            this.flashMessage.error('Email này đã tồn tại trong hệ thống!');
            return;
        }

        this.savingStudent = true;
        const request = this.isEditing
            ? this.studentService.updateStudent(this.currentStudent.id!, this.currentStudent)
            : this.studentService.createStudent(this.currentStudent);

        request.subscribe({
            next: () => {
                this.flashMessage.success(this.isEditing ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
                this.loadStudents();
                this.closeMainModal();
                this.savingStudent = false;
            },
            error: (err: any) => {
                this.savingStudent = false;
                const message = err?.error?.message || err?.message || 'Có lỗi xảy ra!';
                if (message.toLowerCase().includes('email')) {
                    this.emailError = message;
                }
                this.flashMessage.handleError(err);
            }
        });
    }

    getDeleteSubmitLabel(): string {
        return this.deletingStudent ? 'Đang xóa...' : 'Xác nhận';
    }
}