import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AdministrativeClassDTO, AdministrativeClassService } from '../../../services/administrative-class.service';
import { MajorDTO, MajorService } from '../../../services/major.service';
import { LecturerDTO, LecturerService } from '../../../services/lecturer.service';
import { StudentDTO, StudentService } from '../../../services/student.service';
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
    selectedCohort: number | null = null;
    selectedAdvisorId: number | null = null;
    selectedStatus: string = 'ALL';

    // UI states
    activeDropdown: string = '';
    showFilter: boolean = false;
    loading: boolean = false;

    // Modal State
    showModal = false;
    showDeleteModal = false;
    isEditing = false;
    savingClass = false;
    deletingClass = false;
    currentClass: Partial<AdministrativeClassDTO> = {};
    originalClass: AdministrativeClassDTO | null = null;
    classToDelete: AdministrativeClassDTO | null = null;

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
    currentPage: number = 1;
    itemsPerPage: number = 10;

    constructor(
        private classService: AdministrativeClassService,
        private majorService: MajorService,
        private lecturerService: LecturerService,
        private studentService: StudentService,
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
                this.classes = data.sort((a, b) => (b.id || 0) - (a.id || 0));
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
            const matchesCohort = !this.selectedCohort || c.cohort === Number(this.selectedCohort);
            const matchesAdvisor = !this.selectedAdvisorId || c.advisorId === Number(this.selectedAdvisorId);
            const matchesStatus = this.selectedStatus === 'ALL' || c.status === this.selectedStatus;

            return matchesSearch && matchesMajor && matchesYear && matchesCohort && matchesAdvisor && matchesStatus;
        });

        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedMajorId = null;
        this.selectedYear = '';
        this.selectedCohort = null;
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
        return lecturer ? (lecturer.lastName + ' ' + lecturer.firstName) : 'Tất cả cố vấn';
    }

    get availableCohorts(): number[] {
        const cohorts = this.classes.map(c => c.cohort).filter(c => c !== undefined && c !== null);
        return Array.from(new Set(cohorts)).sort((a, b) => b - a);
    }

    get availableYears(): string[] {
        const years = this.classes.map(c => c.academicYear).filter(y => y !== undefined && y !== null && y !== '');
        return Array.from(new Set(years)).sort((a, b) => b.localeCompare(a));
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

    // Modal Methods
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
        this.studentSearchTerm = '';
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
                this.loading = false;
                this.flashMessage.handleError(err);
            }
        });
    }

    onStudentFilterChange(): void {
        this.filteredStudents = this.students.filter(s => {
            const search = this.studentSearchTerm.toLowerCase();
            return !search ||
                s.studentCode.toLowerCase().includes(search) ||
                (s.fullName && s.fullName.toLowerCase().includes(search));
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
        if (!fullName) return '';
        const parts = fullName.trim().split(' ');
        return parts.length > 0 ? parts[parts.length - 1] : '';
    }

    getStudentLastName(fullName: string): string {
        if (!fullName) return '';
        const parts = fullName.trim().split(' ');
        return parts.length > 1 ? parts.slice(0, parts.length - 1).join(' ') : '';
    }

    getStudentStatusLabel(status: string): string {
        switch (status) {
            case 'STUDYING': return 'Đang học';
            case 'DROPPED': return 'Thôi học';
            case 'GRADUATED': return 'Đã tốt nghiệp';
            case 'SUSPENDED': return 'Đình chỉ';
            default: return status || '---';
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

    openAddModal(): void {
        this.isEditing = false;
        this.currentClass = {
            status: 'ACTIVE'
        };
        this.showModal = true;
    }

    editClass(adminClass: AdministrativeClassDTO): void {
        this.isEditing = true;
        this.currentClass = { ...adminClass };
        this.originalClass = { ...adminClass };
        this.showModal = true;
    }

    deleteClass(adminClass: AdministrativeClassDTO): void {
        this.classToDelete = adminClass;
        this.showDeleteModal = true;
    }

    confirmDelete(): void {
        if (!this.classToDelete) return;

        this.deletingClass = true;
        this.classService.deleteClass(this.classToDelete.id).subscribe({
            next: () => {
                this.flashMessage.success('Xóa lớp thành công!');
                this.loadClasses();
                this.closeDeleteModal();
                this.deletingClass = false;
            },
            error: (err) => {
                this.deletingClass = false;
                this.flashMessage.handleError(err);
            }
        });
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.classToDelete = null;
    }

    closeMainModal(): void {
        this.showModal = false;
        this.currentClass = {};
        this.activeDropdown = '';
    }

    handleBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.closeMainModal();
            this.closeDeleteModal();
        }
    }

    saveClass(): void {
        const c = this.currentClass;
        if (!c.classCode) {
            this.flashMessage.error('Vui lòng nhập mã lớp học');
            return;
        }
        if (!c.className) {
            this.flashMessage.error('Vui lòng nhập tên lớp học');
            return;
        }
        if (!c.majorId) {
            this.flashMessage.error('Vui lòng chọn ngành đào tạo');
            return;
        }
        if (!c.academicYear) {
            this.flashMessage.error('Vui lòng nhập niên khóa (VD: 2020-2024)');
            return;
        }
        if (!c.cohort) {
            this.flashMessage.error('Vui lòng nhập khóa học (VD: 65)');
            return;
        }
        if (!c.advisorId) {
            this.flashMessage.error('Vui lòng chọn cố vấn học tập');
            return;
        }

        if (this.isEditing && !this.hasChanges()) {
            this.flashMessage.info('Không có thay đổi nào để cập nhật');
            return;
        }

        this.savingClass = true;
        const request = this.isEditing
            ? this.classService.updateClass(this.currentClass.id!, this.currentClass)
            : this.classService.createClass(this.currentClass);

        request.subscribe({
            next: () => {
                this.flashMessage.success(this.isEditing ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
                this.loadClasses();
                this.closeMainModal();
                this.savingClass = false;
            },
            error: (err) => {
                this.savingClass = false;
                this.flashMessage.handleError(err);
            }
        });
    }

    selectMajor(id: number | null): void {
        this.selectedMajorId = id;
        this.activeDropdown = '';
        this.onFilterMajorChange();
    }

    onFilterMajorChange(): void {
        const availableAdvisors = this.getAvailableFilterAdvisors();
        if (this.selectedAdvisorId && !availableAdvisors.some(l => l.id === this.selectedAdvisorId)) {
            this.selectedAdvisorId = null;
        }
    }

    getAvailableFilterAdvisors(): LecturerDTO[] {
        if (!this.selectedMajorId) return this.lecturers;
        const selectedMajor = this.majors.find(m => m.id === Number(this.selectedMajorId));
        if (!selectedMajor) return this.lecturers;

        return this.lecturers.filter(l => l.facultyId === selectedMajor.facultyId);
    }

    selectAdvisor(id: number | null): void {
        this.selectedAdvisorId = id;
        this.activeDropdown = '';
    }

    selectStatus(status: string): void {
        this.selectedStatus = status;
        this.activeDropdown = '';
    }

    setModalMajor(id: number): void {
        this.currentClass.majorId = id;
        this.activeDropdown = '';
        this.onMajorChange();
    }

    onMajorChange(): void {
        const availableAdvisors = this.getAvailableModalAdvisors();
        if (this.currentClass.advisorId && !availableAdvisors.some(l => l.id === this.currentClass.advisorId)) {
            this.currentClass.advisorId = undefined;
        }
    }

    getAvailableModalAdvisors(): LecturerDTO[] {
        if (!this.currentClass.majorId) return this.lecturers;
        const selectedMajor = this.majors.find(m => m.id === Number(this.currentClass.majorId));
        if (!selectedMajor) return this.lecturers;

        return this.lecturers.filter(l => l.facultyId === selectedMajor.facultyId);
    }

    setModalAdvisor(id: number | null): void {
        this.currentClass.advisorId = id || undefined;
        this.activeDropdown = '';
    }

    setModalStatus(status: string): void {
        this.currentClass.status = status;
        this.activeDropdown = '';
    }

    hasChanges(): boolean {
        if (!this.originalClass || !this.currentClass) return false;
        return this.currentClass.classCode !== this.originalClass.classCode ||
            this.currentClass.className !== this.originalClass.className ||
            this.currentClass.majorId !== this.originalClass.majorId ||
            this.currentClass.academicYear !== this.originalClass.academicYear ||
            this.currentClass.cohort !== this.originalClass.cohort ||
            this.currentClass.advisorId !== this.originalClass.advisorId ||
            this.currentClass.status !== this.originalClass.status;
    }

    getMajorName(id: any): string {
        if (!id) return 'Chọn ngành học';
        const major = this.majors.find(m => m.id === Number(id));
        return major ? major.majorName : 'Chọn ngành học';
    }

    getAdvisorName(id: any): string {
        if (!id) return 'Chưa phân công';
        const lecturer = this.lecturers.find(l => l.id === Number(id));
        return lecturer ? (lecturer.lastName + ' ' + lecturer.firstName) : 'Chưa phân công';
    }

    changeStudentPage(delta: number): void {
        const newPage = this.studentCurrentPage + delta;
        if (newPage >= 1 && newPage <= this.studentTotalPages) {
            this.studentCurrentPage = newPage;
        }
    }
}