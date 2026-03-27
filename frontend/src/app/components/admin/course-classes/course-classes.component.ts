import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CourseClassService, CourseSubjectGroup, CourseClass, ClassSchedule } from '../../../services/course-class.service';
import { Semester, SemesterService } from '../../../services/semester.service';
import { SubjectService, SubjectDTO } from '../../../services/subject.service';
import { LecturerService, LecturerDTO } from '../../../services/lecturer.service';
import { MajorService, MajorDTO } from '../../../services/major.service';
import { StudentService } from '../../../services/student.service';
import { CurriculumService, CurriculumDTO } from '../../../services/curriculum.service';
import { AdministrativeClassService, AdministrativeClassDTO } from '../../../services/administrative-class.service';
import { RegistrationService } from '../../../services/registration.service';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-course-classes',
    templateUrl: './course-classes.component.html'
})
export class CourseClassesComponent implements OnInit, OnDestroy {
    private registrationSub?: Subscription;

    // Data lists
    subjects: CourseSubjectGroup[] = [];
    filteredSubjects: CourseSubjectGroup[] = [];
    allCourseClasses: CourseClass[] = [];
    filteredCourseClasses: CourseClass[] = [];
    selectedSubjectClasses: CourseClass[] = [];
    semesters: Semester[] = [];
    allSubjects: SubjectDTO[] = [];
    allLecturers: LecturerDTO[] = [];
    majors: MajorDTO[] = [];
    demandAnalysis: any[] = [];
    filteredDemandAnalysis: any[] = [];
    stats: any = {
        totalStudents: 0,
        mandatorySubjects: 0,
        subjectsToOpen: 0,
        totalClassesCreated: 0
    };
    activeTab: 'statistics' | 'list' = 'list';
    isSelectionModalOpen = false;
    showAnalysisTable = false;
    selectedDemandKeys = new Set<string>();
    allSelected = false;

    // Pagination - Bảng Thống kê dự kiến
    demandCurrentPage = 1;
    demandItemsPerPage = 9999;
    demandTotalItems = 0;
    get demandTotalPages(): number { return Math.max(1, Math.ceil(this.demandTotalItems / this.demandItemsPerPage)); }
    get demandMinEnd(): number { return Math.min(this.demandCurrentPage * this.demandItemsPerPage, this.demandTotalItems); }
    pagedDemandAnalysis: any[] = [];

    // Pagination - Bảng Danh sách Lớp HP
    subjectCurrentPage = 1;
    subjectItemsPerPage = 10;
    subjectTotalItems = 0;
    get subjectTotalPages(): number { return Math.max(1, Math.ceil(this.subjectTotalItems / this.subjectItemsPerPage)); }
    get subjectMinEnd(): number { return Math.min(this.subjectCurrentPage * this.subjectItemsPerPage, this.subjectTotalItems); }
    pagedSubjects: any[] = [];
    classCurrentPage = 1;
    classItemsPerPage = 10;
    classTotalItems = 0;
    get classTotalPages(): number { return Math.max(1, Math.ceil(this.classTotalItems / this.classItemsPerPage)); }
    get classMinEnd(): number { return Math.min(this.classCurrentPage * this.classItemsPerPage, this.classTotalItems); }
    pagedClasses: CourseClass[] = [];

    loading = false;
    loadingDetails = false;
    isSubmitting = false;
    listSearchTerm = '';
    selectedSemesterId: number | null = null;
    listMajorId: number | null = null;
    listYear: number | null = null;
    listAdminClassId: number | null = null;
    listStatus: string | null = null;
    listStatusOptions: string[] = ['PLANNING', 'OPEN', 'ONGOING', 'CLOSED', 'CANCELLED'];

    selectionSearchTerm = '';
    selectionMajorId: number | null = null;
    selectionYear: number | null = null;
    selectionAdminClassId: number | null = null;
    groupBy: 'both' | 'subject' = 'both';
    activeDropdown: string = '';
    showFilter = false;

    allCohorts: number[] = [];
    administrativeClasses: AdministrativeClassDTO[] = [];

    listFilteredAdminClasses: AdministrativeClassDTO[] = [];
    selectionFilteredAdminClasses: AdministrativeClassDTO[] = [];
    curriculums: CurriculumDTO[] = [];
    selectedSubject: CourseSubjectGroup | null = null;
    selectedDemand: any = null;

    isModalOpen = false;
    isDeleteModalOpen = false;
    modalMode: 'ADD' | 'EDIT' = 'ADD';
    courseClassForm: any = this.getEmptyForm();
    courseClassToDeleteId: number | null = null;
    deletingFaculty: boolean = false;
    courseClassToDelete: any = null;
    originalFormJson: string = '';

    isDetailModalOpen = false;
    selectedClassDetails: any = null;
    classRegistrations: any[] = [];
    registrationSearchText = '';

    constructor(
        private courseClassService: CourseClassService,
        private semesterService: SemesterService,
        private subjectService: SubjectService,
        private lecturerService: LecturerService,
        private majorService: MajorService,
        private studentService: StudentService,
        private curriculumService: CurriculumService,
        private adminClassService: AdministrativeClassService,
        private registrationService: RegistrationService,
        private flashMessage: FlashMessageService
    ) { }

    ngOnInit(): void {
        this.loadSemesters();
        this.loadInitialData();

        // 1. Tự động cập nhật khi có tín hiệu từ RegistrationService (trong cùng phiên)
        this.registrationSub = this.registrationService.registrationUpdates$.subscribe(() => {
            console.log('Phát hiện thay đổi sĩ số, đang cập nhật...');
            this.loadAllClasses();
            if (this.selectedSubject) {
                this.loadClassDetails(this.selectedSubject.subjectId);
            }
        });

        // 2. Polling đã được thay thế bằng WebSocket thực thụ (qua WebSocketService)
    }

    ngOnDestroy(): void {
        if (this.registrationSub) {
            this.registrationSub.unsubscribe();
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.filter-menu-wrapper') && !target.closest('.relative')) {
            this.showFilter = false;
            this.activeDropdown = '';
        }
    }

    handleBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.closeModal();
            this.closeDetailModal();
            this.isDeleteModalOpen = false;
            this.isSelectionModalOpen = false;
        }
    }

    loadInitialData(): void {
        this.subjectService.getAllSubjects().subscribe(data => this.allSubjects = data);
        this.lecturerService.getLecturers().subscribe(data => this.allLecturers = data);

        // Load enrollment years
        this.studentService.getEnrollmentYears().subscribe(years => {
            this.allCohorts = years;
            // No hardcoded default year, letting user choose or defaulting to null
            this.selectionYear = null;
            this.listYear = null;
        });

        // Load majors and set default
        this.majorService.getMajors().subscribe(data => {
            this.majors = data;
        });

        this.adminClassService.getClasses().subscribe(data => {
            this.administrativeClasses = data;
            this.listFilteredAdminClasses = data;
            this.selectionFilteredAdminClasses = data;
        });
    }

    onListMajorChange(): void {
        this.listFilteredAdminClasses = this.listMajorId
            ? this.administrativeClasses.filter(c => c.majorId == this.listMajorId)
            : this.administrativeClasses;
    }

    onSelectionMajorChange(): void {
        this.selectionAdminClassId = null;
        this.filterSelectionAdminClasses();
        this.loadAnalysis();
    }

    onSelectionYearChange(): void {
        this.selectionAdminClassId = null;
        this.filterSelectionAdminClasses();
        this.loadAnalysis();
    }

    filterSelectionAdminClasses(): void {
        this.selectionFilteredAdminClasses = this.administrativeClasses.filter(c => {
            const matchesMajor = !this.selectionMajorId || c.majorId == this.selectionMajorId;
            const matchesYear = !this.selectionYear || c.cohort == this.selectionYear;
            return matchesMajor && matchesYear;
        });
    }

    onGroupByChange(): void {
        this.listYear = null;
        this.listAdminClassId = null;
        this.onListFilterChange();
    }

    resetListFilters(): void {
        this.listSearchTerm = '';
        this.listMajorId = null;
        this.listYear = null;
        this.listAdminClassId = null;
        this.listStatus = null;
        this.onListFilterChange();
    }

    refreshData(): void {
        this.loadSemesters();
        this.loadInitialData();
        this.loadSubjects();
        this.loadAllClasses();
    }

    resetSelectionFilters(): void {
        this.selectionYear = null;
        this.selectionAdminClassId = null;
        this.selectionMajorId = null;
        this.selectionSearchTerm = '';
        this.onSelectionMajorChange();
    }

    getListMajorName(): string {
        if (!this.listMajorId) return 'Tất cả các ngành học';
        const major = this.majors.find(m => m.id == this.listMajorId);
        return major ? major.majorName : 'Tất cả các ngành học';
    }

    getSelectionMajorName(): string {
        if (!this.selectionMajorId) return 'Chọn ngành đào tạo';
        const major = this.majors.find(m => m.id == this.selectionMajorId);
        return major ? major.majorName : 'Chọn ngành đào tạo';
    }

    getListAdminClassName(): string {
        if (!this.listAdminClassId) return 'Tất cả lớp học';
        const adminClass = this.administrativeClasses.find(c => c.id == this.listAdminClassId);
        return adminClass ? adminClass.className : 'Tất cả lớp học';
    }

    getSelectionAdminClassName(): string {
        if (!this.selectionAdminClassId) return 'Chọn lớp học';
        const adminClass = this.administrativeClasses.find(c => c.id == this.selectionAdminClassId);
        return adminClass ? adminClass.className : 'Chọn lớp học';
    }

    getListYearLabel(): string {
        if (!this.listYear) return 'Tất cả các khóa';
        return 'Khóa ' + this.listYear;
    }

    getSelectionYearLabel(): string {
        if (!this.selectionYear) return 'Chọn khóa học';
        return 'Khóa ' + this.selectionYear;
    }

    onSearch(): void {
        this.onListFilterChange();
    }

    onSelectionSearch(): void {
        this.onSelectionFilterChange();
    }

    loadSemesters(): void {
        this.semesterService.getAllSemesters().subscribe(data => {
            // Chỉ hiện Đang diễn ra và Sắp tới, ưu tiên Đang diễn ra lên đầu
            this.semesters = data.filter(s => s.semesterStatus === 'ONGOING' || s.semesterStatus === 'UPCOMING')
                .sort((a, b) => a.semesterStatus === 'ONGOING' ? -1 : 1);

            if (this.semesters.length > 0) {
                this.selectedSemesterId = this.semesters[0].id;
                this.loadSubjects();
                this.loadAllClasses();
            }
        });
    }

    loadAllClasses(): void {
        if (!this.selectedSemesterId) return;
        this.courseClassService.getClassesBySemester(this.selectedSemesterId).subscribe(data => {
            this.allCourseClasses = data.sort((a, b) => (b.id || 0) - (a.id || 0));
            this.onListFilterChange();
        });
    }

    getSelectedSemesterName(): string {
        if (!this.selectedSemesterId) return 'Chọn học kỳ';
        const s = this.semesters.find(s => s.id == this.selectedSemesterId);
        return s ? `${s.name}` : 'Chọn học kỳ';
    }

    loadSubjects(): void {
        if (!this.selectedSemesterId) return;
        this.loading = true;
        this.courseClassService.getGroupedSubjects(this.selectedSemesterId).subscribe({
            next: (data) => {
                this.subjects = data.sort((a, b) => (b.subjectId || 0) - (a.subjectId || 0));
                this.filteredSubjects = this.subjects;
                this.loadAnalysis();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading subjects', err);
                this.loading = false;
            }
        });
    }

    loadAnalysis(): void {
        if (!this.selectedSemesterId) return;

        // Reset selections to prevent stale data usage
        this.selectedDemandKeys.clear();
        this.allSelected = false;

        this.courseClassService.getDemandAnalysis(
            this.selectedSemesterId,
            this.selectionYear || undefined,
            this.selectionMajorId || undefined
        ).subscribe({
            next: (data) => {
                this.demandAnalysis = data;
                this.onSelectionFilterChange();
                this.calculateOverallStats();
            },
            error: (err) => {
                console.error('Lỗi tải dữ liệu dự kiến', err);
            }
        });
    }

    calculateOverallStats(): void {
        this.stats = {
            totalStudents: this.demandAnalysis.reduce((sum, a) => sum + (a.totalNeeded || 0), 0),
            mandatorySubjects: this.demandAnalysis.filter(a => a.mandatoryStudents > 0).length,
            subjectsToOpen: this.demandAnalysis.filter(a => a.suggestedMoreClasses > 0).length,
            totalClassesCreated: this.subjects.reduce((sum, s) => sum + s.classCount, 0)
        };
    }

    toggleSelectAll(): void {
        const canSelect = this.filteredDemandAnalysis.filter(d => d.openedClasses === 0);
        if (canSelect.length === 0) {
            this.allSelected = false;
            return;
        }

        this.allSelected = !this.allSelected;
        canSelect.forEach(d => {
            const key = `${d.subjectId}_${d.adminClassId}`;
            if (this.allSelected) {
                this.selectedDemandKeys.add(key);
            } else {
                this.selectedDemandKeys.delete(key);
            }
        });
    }

    getEligibleCount(): number {
        return this.filteredDemandAnalysis.filter(d => d.openedClasses === 0).length;
    }

    getVisibleSelectionCount(): number {
        return this.filteredDemandAnalysis.filter(d =>
            this.isDemandSelected(d) && d.openedClasses === 0
        ).length;
    }

    toggleSelect(demand: any): void {
        if (demand.openedClasses > 0) return;
        const key = `${demand.subjectId}_${demand.adminClassId}`;
        if (this.selectedDemandKeys.has(key)) {
            this.selectedDemandKeys.delete(key);
        } else {
            this.selectedDemandKeys.add(key);
        }

        const canSelect = this.filteredDemandAnalysis.filter(d => d.openedClasses === 0);
        this.allSelected = canSelect.length > 0 &&
            canSelect.every(d => this.selectedDemandKeys.has(`${d.subjectId}_${d.adminClassId}`));
    }

    isDemandSelected(demand: any): boolean {
        return this.selectedDemandKeys.has(`${demand.subjectId}_${demand.adminClassId}`);
    }

    generateBatchClasses(): void {
        const demandsToCreate = this.filteredDemandAnalysis.filter(d =>
            this.isDemandSelected(d) && d.openedClasses === 0
        );

        if (demandsToCreate.length === 0) {
            this.flashMessage.warning('Vui lòng chọn ít nhất một môn học để khởi tạo!');
            this.selectedDemandKeys.clear();
            this.allSelected = false;
            return;
        }

        this.loading = true;
        this.courseClassService.generateAutoBatch(this.selectedSemesterId!, demandsToCreate)
            .subscribe({
                next: (res) => {
                    this.flashMessage.success('Khởi tạo thành công!');
                    this.isSelectionModalOpen = false;
                    this.selectedDemandKeys.clear();
                    this.allSelected = false;
                    this.loadAnalysis();
                    this.loadSubjects();
                    this.loadAllClasses();
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Batch creation failed', err);
                    this.flashMessage.error('Khởi tạo hàng loạt thất bại!');
                    this.loading = false;
                }
            });
    }

    onListFilterChange(): void {
        const search = this.listSearchTerm.toLowerCase();
        const selectedMajorName = this.getListMajorName();
        // Lấy mã lớp (classCode) để so khớp vì bảng hiển thị mã lớp
        const selectedAdminClass = this.administrativeClasses.find(ac => ac.id == this.listAdminClassId);
        const selectedAdminClassCode = selectedAdminClass ? selectedAdminClass.classCode : null;

        // 1. Thực hiện lọc danh sách lớp hệ chính (Main list)
        let filteredClasses = this.allCourseClasses.filter(c => {
            // Lọc theo từ khóa tìm kiếm (Mã môn, Tên môn, Mã lớp)
            const matchesSearch = !search ||
                (c.subjectName || '').toLowerCase().includes(search) ||
                (c.subjectCode || '').toLowerCase().includes(search) ||
                (c.classCode || '').toLowerCase().includes(search);

            // Lọc theo Ngành học (So khớp tên vì DTO trả về tên)
            const matchesMajor = !this.listMajorId || c.majorName === selectedMajorName;

            // Lọc theo Khóa học (Cohort)
            const matchesYear = !this.listYear || c.cohort == this.listYear;

            // Lọc theo Lớp hành chính (So khớp mã lớp - classCode)
            const matchesAdminClass = !this.listAdminClassId || c.targetClassName === selectedAdminClassCode;

            // Lọc theo Trạng thái
            const matchesStatus = !this.listStatus || c.classStatus === this.listStatus;

            return matchesSearch && matchesMajor && matchesYear && matchesAdminClass && matchesStatus;
        });

        // 2. Cập nhật thông tin phân trang và hiển thị
        this.classTotalItems = filteredClasses.length;
        this.classCurrentPage = 1;
        this.updateClassPage(filteredClasses);
    }

    onSelectionFilterChange(): void {
        const search = this.selectionSearchTerm.toLowerCase();

        // 1. Nếu chưa có bất kỳ bộ lọc chính nào, ép bảng về rỗng để đồng bộ với UI
        if (!this.selectionMajorId && !this.selectionYear && !this.selectionAdminClassId) {
            this.demandTotalItems = 0;
            this.updateDemandPage([]);
            this.allSelected = false;
            return;
        }

        // 2. Chỉ thực hiện lọc khi đã chọn ít nhất một thông tin Ngành/Khóa/Lớp
        let filteredDemand = this.demandAnalysis.filter(d => {
            const matchesSearch = !search ||
                d.subjectName.toLowerCase().includes(search) ||
                d.subjectCode.toLowerCase().includes(search);

            const matchesAdminClass = !this.selectionAdminClassId || d.adminClassId == this.selectionAdminClassId;

            return matchesSearch && matchesAdminClass;
        });

        this.demandTotalItems = filteredDemand.length;
        this.demandCurrentPage = 1;
        this.updateDemandPage(filteredDemand);

        // Sync allSelected based on the new visible results
        const canSelect = filteredDemand.filter(d => d.openedClasses === 0);
        this.allSelected = canSelect.length > 0 &&
            canSelect.every(d => this.selectedDemandKeys.has(`${d.subjectId}_${d.adminClassId}`));
    }

    private _allFilteredClasses: CourseClass[] = [];

    updateClassPage(allData?: CourseClass[]): void {
        if (allData) this._allFilteredClasses = allData;
        const start = (this.classCurrentPage - 1) * this.classItemsPerPage;
        this.pagedClasses = this._allFilteredClasses.slice(start, start + this.classItemsPerPage);
        this.filteredCourseClasses = this.pagedClasses;
    }

    classPrevPage(): void { if (this.classCurrentPage > 1) { this.classCurrentPage--; this.updateClassPage(); } }
    classNextPage(): void { if (this.classCurrentPage < this.classTotalPages) { this.classCurrentPage++; this.updateClassPage(); } }

    private _allFilteredDemand: any[] = [];
    private _allFilteredSubjects: any[] = [];

    updateDemandPage(allData?: any[]): void {
        if (allData) this._allFilteredDemand = allData;
        const start = (this.demandCurrentPage - 1) * this.demandItemsPerPage;
        this.pagedDemandAnalysis = this._allFilteredDemand.slice(start, start + this.demandItemsPerPage);
        this.filteredDemandAnalysis = this.pagedDemandAnalysis;
    }

    updateSubjectPage(allData?: any[]): void {
        if (allData) this._allFilteredSubjects = allData;
        const start = (this.subjectCurrentPage - 1) * this.subjectItemsPerPage;
        this.pagedSubjects = this._allFilteredSubjects.slice(start, start + this.subjectItemsPerPage);
        this.filteredSubjects = this.pagedSubjects;
    }

    demandPrevPage(): void { if (this.demandCurrentPage > 1) { this.demandCurrentPage--; this.updateDemandPage(); } }
    demandNextPage(): void { if (this.demandCurrentPage < this.demandTotalPages) { this.demandCurrentPage++; this.updateDemandPage(); } }
    subjectPrevPage(): void { if (this.subjectCurrentPage > 1) { this.subjectCurrentPage--; this.updateSubjectPage(); } }
    subjectNextPage(): void { if (this.subjectCurrentPage < this.subjectTotalPages) { this.subjectCurrentPage++; this.updateSubjectPage(); } }

    selectSubject(subject: CourseSubjectGroup): void {
        this.selectedSubject = subject;
        this.loadClassDetails(subject.subjectId);
    }

    loadClassDetails(subjectId: number): void {
        if (!this.selectedSemesterId) return;
        this.loadingDetails = true;
        this.courseClassService.getClassDetails(this.selectedSemesterId, subjectId).subscribe({
            next: (data) => {
                this.selectedSubjectClasses = data;
                this.loadingDetails = false;
            },
            error: (err) => {
                console.error('Error loading class details', err);
                this.loadingDetails = false;
            }
        });
    }

    closeDetails(): void {
        this.selectedSubject = null;
        this.selectedSubjectClasses = [];
    }

    openAddModal(subjectId?: number): void {
        this.modalMode = 'ADD';
        this.courseClassForm = this.getEmptyForm();
        if (subjectId) {
            this.courseClassForm.subjectId = subjectId;
            this.onSubjectSelect();
            this.autoSuggest();
        }
        this.isSelectionModalOpen = false;
        this.isModalOpen = true;
    }

    openSelectionModal(): void {
        this.isSelectionModalOpen = true;
        this.loadAnalysis();
    }

    closeSelectionModal(): void {
        this.isSelectionModalOpen = false;
        this.selectedDemandKeys.clear();
        this.allSelected = false;
    }

    onSubjectSelect(): void {
        if (!this.courseClassForm.subjectId) {
            this.selectedDemand = null;
            return;
        }
        this.selectedDemand = this.demandAnalysis.find(a => a.subjectId == this.courseClassForm.subjectId);
        if (this.selectedDemand) {
            this.courseClassForm.theoryPeriods = this.selectedDemand.theoryPeriods || 0;
            this.courseClassForm.practicalPeriods = this.selectedDemand.practicalPeriods || 0;
            if (this.modalMode === 'ADD') {
                this.courseClassForm.classCount = this.selectedDemand.suggestedMoreClasses || 1;
                this.onBatchCountChange();
            }
        }
    }

    autoSuggest(): void {
        if (!this.selectedDemand) return;

        const subjectCode = this.selectedDemand.subjectCode;
        const nextNum = (this.selectedDemand.openedClasses || 0) + 1;
        this.courseClassForm.classCode = `${subjectCode}_${nextNum.toString().padStart(2, '0')}`;
        this.courseClassForm.maxStudents = 12;
        this.courseClassForm.classStatus = 'PLANNING';

        this.onBatchCountChange();
    }

    openEditModal(cc: any): void {
        this.modalMode = 'EDIT';
        this.courseClassForm = {
            id: cc.id,
            classCode: cc.classCode,
            subjectId: cc.subjectId,
            lecturerId: cc.lecturerId,
            maxStudents: cc.maxStudents,
            classStatus: cc.classStatus,
            currentEnrolled: cc.currentEnrolled,
            registrationStart: cc.registrationStart ? cc.registrationStart.split('T')[0] : null,
            registrationEnd: cc.registrationEnd ? cc.registrationEnd.split('T')[0] : null,
            attendanceWeight: cc.attendanceWeight || 0.1,
            midtermWeight: cc.midtermWeight || 0.3,
            finalWeight: cc.finalWeight || 0.6,
            expectedRoom: cc.expectedRoom,
            targetClassId: cc.targetClassId,
            theoryPeriods: cc.theoryPeriods || 0,
            practicalPeriods: cc.practicalPeriods || 0,
            schedules: cc.schedules ? cc.schedules.map((s: any) => ({ ...s })) : []
        };
        this.courseClassForm.classCount = 1;

        // Capture exactly how the payload will look before submission to ensure accurate comparison in saveCourseClass
        const originalPayload = this.preparePayload({ ...this.courseClassForm });
        this.originalFormJson = JSON.stringify(originalPayload);
        this.isModalOpen = true;
    }

    private preparePayload(form: any): any {
        const payload = { ...form };

        if (payload.registrationStart) {
            // If already has 'T', it's formatted; if not, add 'T00:00:00'
            if (!payload.registrationStart.includes('T')) payload.registrationStart += 'T00:00:00';
        } else payload.registrationStart = null;

        if (payload.registrationEnd) {
            if (!payload.registrationEnd.includes('T')) payload.registrationEnd += 'T23:59:59';
        } else payload.registrationEnd = null;

        if (payload.startDate) {
            if (!payload.startDate.includes('T')) payload.startDate += 'T00:00:00';
        } else payload.startDate = null;

        if (payload.endDate) {
            if (!payload.endDate.includes('T')) payload.endDate += 'T00:00:00';
        } else payload.endDate = null;

        return payload;
    }

    closeModal(): void {
        this.isModalOpen = false;
    }

    openClassDetail(cc: any): void {
        this.selectedClassDetails = cc;
        this.loading = true;
        this.registrationService.getRegistrationsByClass(cc.id).subscribe({
            next: (data) => {
                this.classRegistrations = data.map((reg: any) => {
                    let firstName = reg.firstName || '';
                    let lastName = reg.lastName || '';

                    if (!firstName && !lastName && reg.studentName) {
                        const name = reg.studentName.trim();
                        const lastSpaceIndex = name.lastIndexOf(' ');
                        if (lastSpaceIndex !== -1) {
                            firstName = name.substring(lastSpaceIndex + 1);
                            lastName = name.substring(0, lastSpaceIndex);
                        } else {
                            firstName = name;
                            lastName = '';
                        }
                    }

                    return {
                        ...reg,
                        firstName,
                        lastName
                    };
                }).sort((a: any, b: any) => a.id - b.id);
                this.isDetailModalOpen = true;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading class registrations', err);
                this.flashMessage.error('Không thể tải danh sách sinh viên');
                this.loading = false;
            }
        });
    }

    closeDetailModal(): void {
        this.isDetailModalOpen = false;
        this.selectedClassDetails = null;
        this.classRegistrations = [];
        this.registrationSearchText = '';
    }

    get filteredClassRegistrations(): any[] {
        if (!this.registrationSearchText?.trim()) return this.classRegistrations;
        const term = this.registrationSearchText.toLowerCase().trim();
        return this.classRegistrations.filter(reg =>
            reg.studentName?.toLowerCase().includes(term) ||
            reg.studentCode?.toLowerCase().includes(term) ||
            reg.lastName?.toLowerCase().includes(term) ||
            reg.firstName?.toLowerCase().includes(term) ||
            reg.adminClassCode?.toLowerCase().includes(term)
        );
    }

    getEmptyForm(): any {
        return {
            classCode: '',
            subjectId: null,
            lecturerId: null,
            maxStudents: 12,
            classStatus: 'PLANNING',
            currentEnrolled: 0,
            registrationStart: null,
            registrationEnd: null,
            attendanceWeight: 0.10,
            midtermWeight: 0.30,
            finalWeight: 0.60,
            classCount: 1,
            batchLecturers: [null],
            schedules: []
        };
    }

    addSchedule(): void {
        this.courseClassForm.schedules.push({
            dayOfWeek: 2,
            startPeriod: 1,
            endPeriod: 3,
            roomName: '',
            sessionType: 'THEORY'
        });
    }

    removeSchedule(index: number): void {
        this.courseClassForm.schedules.splice(index, 1);
    }

    saveCourseClass(): void {
        if (!this.selectedSemesterId) return;
        this.isSubmitting = true;

        if (this.modalMode === 'ADD' && this.courseClassForm.classCount > 1) {
            this.createBatch();
            return;
        }

        // Sanitize date fields to prevent Jackson parsing errors (400 Bad Request)
        const payload = this.preparePayload(this.courseClassForm);

        // Detect if anything changed for EDIT mode
        if (this.modalMode === 'EDIT') {
            const hasChanged = JSON.stringify(payload) !== this.originalFormJson;
            if (!hasChanged) {
                this.flashMessage.info('Không có thay đổi nào để cập nhật');
                this.isSubmitting = false;
                return;
            }
        }

        if (payload.classStatus === 'OPEN' && (!payload.registrationStart || !payload.registrationEnd)) {
            this.flashMessage.error('Vui lòng nhập Thời gian đăng ký khi mở lớp!');
            this.isSubmitting = false;
            return;
        }

        // Validate full schedule before opening registration
        if (payload.classStatus === 'OPEN') {
            const requiredPeriods = (payload.theoryPeriods || 0) + (payload.practicalPeriods || 0);
            const weeklyScheduled = payload.schedules.reduce((sum: number, s: any) => sum + (s.endPeriod - s.startPeriod + 1), 0);

            // Assuming a standard 15-week semester for the validation estimate
            const estimatedTotal = weeklyScheduled * 15;

            if (weeklyScheduled === 0) {
                this.flashMessage.error('Vui lòng xếp lịch học (thời khóa biểu hàng tuần) trước khi mở đăng ký!');
                this.isSubmitting = false;
                return;
            }

            if (estimatedTotal < requiredPeriods) {
                this.flashMessage.warning(`Lưu ý: Lịch học hàng tuần (${weeklyScheduled} tiết/tuần) có thể chưa đủ cho tổng số ${requiredPeriods} tiết của môn học. Hệ thống vẫn cho phép lưu nhưng bạn nên kiểm tra lại.`);
            }
        }

        const totalWeight = (payload.attendanceWeight || 0) + (payload.midtermWeight || 0) + (payload.finalWeight || 0);
        if (Math.abs(totalWeight - 1.0) > 0.001) {
            this.flashMessage.error(`Tổng trọng số điểm phải bằng 100% (Hiện tại là ${Math.round(totalWeight * 100)}%)`);
            this.isSubmitting = false;
            return;
        }

        const request = this.modalMode === 'ADD'
            ? this.courseClassService.createCourseClass(this.selectedSemesterId!, payload)
            : this.courseClassService.updateCourseClass(this.courseClassForm.id, payload);

        request.subscribe({
            next: () => {
                this.flashMessage.success(this.modalMode === 'EDIT' ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
                this.loadAllClasses();
                this.finishSubmit();
            },
            error: (err) => {
                console.error('Error saving course class', err);
                this.flashMessage.error(err.error?.message || 'Có lỗi xảy ra khi lưu thông tin');
                this.isSubmitting = false;
            }
        });
    }

    createBatch(): void {
        const batch = [];
        // Use subjectCode as base for batch to avoid double suffix if classCode already has one
        const baseCode = this.selectedDemand ? this.selectedDemand.subjectCode : (this.courseClassForm.classCode.split('-')[0].split('_')[0]);

        for (let i = 0; i < this.courseClassForm.classCount; i++) {
            const cc = {
                ...this.courseClassForm,
                schedules: this.courseClassForm.schedules.map((s: any) => ({ ...s }))
            };
            cc.classCode = `${baseCode}-${(i + 1).toString().padStart(2, '0')}`;
            cc.lecturerId = this.courseClassForm.batchLecturers[i] || this.courseClassForm.lecturerId;
            batch.push(cc);
        }

        this.courseClassService.createBatchClasses(this.selectedSemesterId!, batch).subscribe({
            next: () => this.finishSubmit(),
            error: (err) => {
                console.error('Error creating batch', err);
                this.isSubmitting = false;
            }
        });
    }

    finishSubmit(): void {
        this.isSubmitting = false;
        this.closeModal();
        if (this.selectedSubject) {
            this.loadClassDetails(this.selectedSubject.subjectId);
        }
        this.loadSubjects();
        this.loadAllClasses();
    }

    onBatchCountChange(): void {
        const count = this.courseClassForm.classCount;
        while (this.courseClassForm.batchLecturers.length < count) {
            this.courseClassForm.batchLecturers.push(null);
        }
        if (this.courseClassForm.batchLecturers.length > count) {
            this.courseClassForm.batchLecturers = this.courseClassForm.batchLecturers.slice(0, count);
        }
    }

    openDeleteConfirmation(id: number): void {
        this.courseClassToDeleteId = id;
        this.courseClassToDelete = this.allCourseClasses.find(c => c.id === id) ||
            this.selectedSubjectClasses.find(c => c.id === id);
        this.isDeleteModalOpen = true;
    }

    deleteCourseClass(): void {
        if (!this.courseClassToDeleteId) return;
        this.isSubmitting = true;
        this.deletingFaculty = true;
        this.courseClassService.deleteCourseClass(this.courseClassToDeleteId).subscribe({
            next: () => {
                this.flashMessage.success('Xóa lớp học phần thành công!');
                this.isSubmitting = false;
                this.deletingFaculty = false;
                this.isDeleteModalOpen = false;
                if (this.selectedSubject) {
                    this.loadClassDetails(this.selectedSubject.subjectId);
                }
                this.loadSubjects();
                this.loadAllClasses();
            },
            error: (err) => {
                console.error('Error deleting course class', err);
                this.isSubmitting = false;
                this.deletingFaculty = false;
            }
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'PLANNING': return 'bg-[#f3f4f6] text-[#6b7280] border-[#d1d5db]';
            case 'OPEN': return 'bg-[#ecfdf5] text-[#059669] border-[#10b981]';
            case 'ONGOING': return 'bg-[#eff6ff] text-[#2563eb] border-[#3b82f6]';
            case 'CLOSED': return 'bg-[#f9fafb] text-[#4b5563] border-[#9ca3af]';
            case 'CANCELLED': return 'bg-[#fef2f2] text-[#dc2626] border-[#ef4444]';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'PLANNING': return 'Lên kế hoạch';
            case 'OPEN': return 'Mở đăng ký';
            case 'ONGOING': return 'Đang học';
            case 'CLOSED': return 'Đã khóa sổ';
            case 'CANCELLED': return 'Đã hủy';
            default: return status || 'Tất cả trạng thái';
        }
    }

    formatSchedule(schedules: any[]): string {
        if (!schedules || schedules.length === 0) return 'Chưa có lịch';
        return schedules.map(s => `Thứ ${s.dayOfWeek}: Tiết ${s.startPeriod}-${s.endPeriod}${s.roomName ? ' Phòng ' + s.roomName : ''}`).join(', ');
    }

    formatRooms(schedules: any[]): string {
        if (!schedules || schedules.length === 0) return '--';
        const rooms = schedules.map(s => s.roomName || 'N/A').filter((v, i, a) => a.indexOf(v) === i);
        return rooms.join(', ');
    }
}
