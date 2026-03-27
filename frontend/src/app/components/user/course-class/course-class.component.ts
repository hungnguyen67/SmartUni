import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CourseClassService, CourseClass } from '../../../services/course-class.service';
import { Semester, SemesterService } from '../../../services/semester.service';
import { AuthService } from '../../../auth.service';
import { RegistrationService } from '../../../services/registration.service';
import { SubjectService, SubjectDTO } from '../../../services/subject.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-course-class',
    templateUrl: './course-class.component.html'
})
export class CourseClassComponent implements OnInit, OnDestroy {
    private registrationSub?: Subscription;

    allCourseClasses: CourseClass[] = [];
    filteredCourseClasses: CourseClass[] = [];
    semesters: Semester[] = [];
    subjects: SubjectDTO[] = [];
    availableCohorts: number[] = [];

    loading = false;
    isUpdatingStatus = false;
    searchTerm = '';
    selectedSemesterId: number | null = null;
    selectedSubjectId: number | null = null;
    selectedCohort: number | null = null;
    selectedStatus: string = '';

    currentUser: any;
    showFilter = false;
    activeDropdown = '';

    ongoingCount = 0;

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalItems = 0;

    // Grade Management
    isGradeModalOpen = false;
    selectedClassForGrades: CourseClass | null = null;
    registrations: any[] = [];
    searchText = '';
    isSavingGrades = false;

    constructor(
        private courseClassService: CourseClassService,
        private semesterService: SemesterService,
        private subjectService: SubjectService,
        private authService: AuthService,
        private registrationService: RegistrationService
    ) { }

    ngOnInit(): void {
        this.currentUser = this.authService.getUserFromStorage();
        this.loadSemesters();
        this.loadSubjects();

        // Tự động cập nhật khi có sinh viên đăng ký/hủy môn trong cùng phiên làm việc
        this.registrationSub = this.registrationService.registrationUpdates$.subscribe(() => {
            console.log('Lecturer view: Enrollment update detected, refreshing...');
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
        if (!target.closest('.filter-menu-wrapper') && !target.closest('.relative')) {
            this.showFilter = false;
            this.activeDropdown = '';
        }
    }

    toggleFilter(event: MouseEvent): void {
        event.stopPropagation();
        this.showFilter = !this.showFilter;
    }

    loadSemesters(): void {
        this.semesterService.getAllSemesters().subscribe(data => {
            // Chỉ hiện Đang diễn ra và Sắp tới, ưu tiên Đang diễn ra lên đầu
            this.semesters = data.filter(s => s.semesterStatus === 'ONGOING' || s.semesterStatus === 'UPCOMING')
                .sort((a, b) => a.semesterStatus === 'ONGOING' ? -1 : 1);

            if (this.semesters.length > 0) {
                this.selectedSemesterId = this.semesters[0].id;
                this.loadMyClasses();
            }
        });
    }

    loadSubjects(): void {
        this.subjectService.getAllSubjects().subscribe(data => {
            this.subjects = data;
        });
    }

    loadMyClasses(): void {
        if (!this.selectedSemesterId || !this.currentUser?.id) return;
        this.loading = true;
        this.courseClassService.getClassesByLecturer(this.currentUser.id, this.selectedSemesterId).subscribe({
            next: (data) => {
                this.allCourseClasses = data;
                this.ongoingCount = data.filter(c => c.classStatus === 'ONGOING').length;
                this.availableCohorts = Array.from(new Set(data.map(c => c.cohort).filter(c => !!c) as number[])).sort((a, b) => b - a);
                this.onFilterChange();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading my classes', err);
                this.loading = false;
            }
        });
    }

    onFilterChange(): void {
        const search = this.searchTerm.toLowerCase();
        this.filteredCourseClasses = this.allCourseClasses.filter(c => {
            const matchesSearch = !search ||
                c.classCode.toLowerCase().includes(search) ||
                c.className.toLowerCase().includes(search) ||
                c.subjectCode.toLowerCase().includes(search);

            const matchesSubject = !this.selectedSubjectId || c.subjectId == this.selectedSubjectId;
            const matchesStatus = !this.selectedStatus || c.classStatus === this.selectedStatus;
            const matchesCohort = !this.selectedCohort || c.cohort === this.selectedCohort;

            return matchesSearch && matchesSubject && matchesStatus && matchesCohort;
        });
        this.totalItems = this.filteredCourseClasses.length;
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedSubjectId = null;
        this.selectedCohort = null;
        this.selectedStatus = '';
        this.loadMyClasses();
    }

    refreshData(): void {
        this.loadSemesters();
        this.loadSubjects();
        this.loadMyClasses();
    }

    get pagedClasses(): CourseClass[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredCourseClasses.slice(start, start + this.itemsPerPage);
    }

    get totalPages(): number { return Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage)); }
    get minEnd(): number { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }

    prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
    nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }

    getSelectedSemesterName(): string {
        const s = this.semesters.find(s => s.id == this.selectedSemesterId);
        return s ? `${s.name}` : 'Chọn học kỳ';
    }

    getSelectedSubjectName(): string {
        if (!this.selectedSubjectId) return 'Chọn học phần';
        const s = this.availableSubjects.find(s => s.subjectId == this.selectedSubjectId);
        return s ? s.subjectName : 'Chọn học phần';
    }

    get availableSubjects(): { subjectId: number; subjectName: string }[] {
        const map = new Map<number, string>();
        this.allCourseClasses.forEach(c => {
            if (c.subjectId && c.subjectName) {
                map.set(c.subjectId, c.subjectName);
            }
        });
        return Array.from(map.entries())
            .map(([subjectId, subjectName]) => ({ subjectId, subjectName }))
            .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
    }

    getStatusLabel(status: string): string {
        const map: any = {
            'PLANNING': 'Kế hoạch',
            'OPEN': 'Mở đăng ký',
            'ONGOING': 'Đang học',
            'GRADING': 'Đang lên điểm',
            'CLOSED': 'Đã khóa sổ',
            'CANCELLED': 'Bị hủy'
        };
        return map[status] || status;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'PLANNING': return 'bg-[#f3f4f6] text-[#6b7280] border-[#d1d5db]';
            case 'OPEN': return 'bg-[#ecfdf5] text-[#059669] border-[#10b981]';
            case 'ONGOING': return 'bg-[#eff6ff] text-[#2563eb] border-[#3b82f6]';
            case 'GRADING': return 'bg-[#faf5ff] text-[#9333ea] border-[#a855f7]';
            case 'CLOSED': return 'bg-[#f9fafb] text-[#4b5563] border-[#9ca3af]';
            case 'CANCELLED': return 'bg-[#fef2f2] text-[#dc2626] border-[#ef4444]';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    }

    openGradeModal(cc: CourseClass): void {
        this.selectedClassForGrades = cc;
        this.isGradeModalOpen = true;
        this.loading = true;
        this.registrationService.getRegistrationsByClass(cc.id).subscribe({
            next: (data) => {
                console.log('Fetched registrations for class:', data);
                // Hiển thị các SV: STUDYING (đang học), REGISTERED (đã đk), COMPLETED (đã khóa sổ)
                this.registrations = data
                    .filter((reg: any) => {
                        const s = reg.status || reg.registrationStatus;
                        return s === 'STUDYING' || s === 'REGISTERED' || s === 'COMPLETED';
                    })
                    .map((reg: any) => {
                        let firstName = '';
                        let lastName = '';
                        if (reg.studentName) {
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
                            lastName,
                            attendanceScore: reg.attendanceScore,
                            midtermScore: reg.midtermScore,
                            finalScore: reg.finalScore
                        };
                    });
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading registrations', err);
                this.loading = false;
            }
        });
    }

    closeGradeModal(): void {
        this.isGradeModalOpen = false;
        this.selectedClassForGrades = null;
        this.registrations = [];
    }

    get filteredRegistrations(): any[] {
        if (!this.searchText?.trim()) return this.registrations;
        const term = this.searchText.toLowerCase().trim();
        return this.registrations.filter(reg =>
            reg.studentName?.toLowerCase().includes(term) ||
            reg.studentCode?.toLowerCase().includes(term) ||
            reg.lastName?.toLowerCase().includes(term) ||
            reg.firstName?.toLowerCase().includes(term)
        );
    }

    onGradeChange(reg: any): void {
        const cc = this.selectedClassForGrades;
        if (!cc) return;

        // Only calculate if all scores are present
        if (reg.attendanceScore == null || reg.midtermScore == null || reg.finalScore == null) {
            reg.totalScore = null;
            reg.gradeLetter = null;
            return;
        }

        const total = (reg.attendanceScore * (cc.attendanceWeight || 0.1)) +
            (reg.midtermScore * (cc.midtermWeight || 0.3)) +
            (reg.finalScore * (cc.finalWeight || 0.6));

        reg.totalScore = Math.round(total * 100) / 100;
        reg.gradeLetter = this.calculateGradeLetter(reg.totalScore);
    }

    calculateGradeLetter(score: number): string {
        if (score >= 8.5) return 'A';
        if (score >= 7.0) return 'B';
        if (score >= 5.5) return 'C';
        if (score >= 4.0) return 'D';
        return 'F';
    }

    saveAllGrades(): void {
        if (!this.selectedClassForGrades) return;

        // Calculate all grades before saving
        this.registrations.forEach(reg => {
            this.onGradeChange(reg);
        });

        this.isSavingGrades = true;
        this.registrationService.updateGrades(this.registrations).subscribe({
            next: () => {
                this.isSavingGrades = false;
                alert('Đã tính toán và lưu điểm thành công cho toàn bộ lớp!');
            },
            error: (err) => {
                console.error('Error saving grades', err);
                this.isSavingGrades = false;
                alert('Lỗi khi lưu điểm!');
            }
        });
    }

    startTeaching(cc: any): void {
        if (confirm(`BẮT ĐẦU GIẢNG DẠY LỚP: ${cc.className}?\n\n- Toàn bộ SV đăng ký sẽ được chuyển sang trạng thái STUDYING.\n- Khóa cổng đăng ký của lớp.`)) {
            this.isUpdatingStatus = true;
            this.courseClassService.updateStatus(cc.id, 'ONGOING').subscribe({
                next: () => {
                    cc.classStatus = 'ONGOING';
                    this.isUpdatingStatus = false;
                    alert('Lớp đã bắt đầu giảng dạy!');
                },
                error: (err: any) => {
                    console.error('Error starting teaching', err);
                    this.isUpdatingStatus = false;
                    alert('Lỗi hệ thống!');
                }
            });
        }
    }

    lockGrades(): void {
        if (!this.selectedClassForGrades) return;
        if (confirm('BẠN CÓ CHẮC CHẮN MUỐN XÁC NHẬN & CHỐT ĐIỂM?\n\n- Trạng thái lớp sẽ chuyển sang CLOSED.\n- Trạng thái sinh viên sẽ chuyển sang COMPLETED.\n- Mọi dữ liệu điểm sẽ bị KHÓA, không thể chỉnh sửa.')) {
            this.registrationService.lockGrades(this.selectedClassForGrades.id).subscribe({
                next: () => {
                    if (this.selectedClassForGrades) {
                        this.selectedClassForGrades.classStatus = 'CLOSED';
                    }
                    alert('Đã xác nhận & khóa sổ bảng điểm thành công!');
                    this.closeGradeModal();
                    this.loadMyClasses(); // Refresh list to see updated status
                },
                error: (err) => {
                    console.error('Error locking grades', err);
                    alert('Lỗi hệ thống khi chốt điểm!');
                }
            });
        }
    }
}
