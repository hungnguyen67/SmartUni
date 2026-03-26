import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-exam-schedule',
  templateUrl: './exam-schedule.component.html'
})
export class ExamScheduleComponent implements OnInit {
  // List view state
  examSchedules: any[] = [];
  filteredSchedules: any[] = [];
  searchTerm: string = '';
  selectedStatus: string = '';
  selectedSemesterFilter: number | null = null;

  // UI states
  showModal: boolean = false;
  showFilter: boolean = false;
  activeDropdown: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Dropdown data
  semesters: any[] = [];
  allCourseClasses: any[] = [];
  cohorts: number[] = [];
  subjects: any[] = [];
  adminClasses: any[] = [];

  // Form selections (inside Modal)
  selectedSemester: number | null = null;
  selectedCohort: number | null = null;
  selectedSubject: number | null = null;
  selectedAdminClass: number | null = null;
  resolvedCourseClassId: number | null = null;
  resolvedCourseClassIds: number[] = [];

  examType: string | null = null;
  examFormat: string | null = null;
  examDate: string = '';
  durationMinutes: number = 45;
  firstSlotStart: string = '07:30';
  gapDuration: number = 15;

  arrangementMode: string = 'BY_NAME';
  isShuffled: boolean = true;
  hasRollNumbers: boolean = true;

  students: any[] = [];
  assignedRooms: { roomName: string, capacity: number }[] = [];
  selectedRoomIndexes = new Set<number>();
  newRoomName: string = '';
  newRoomCapacity: number = 40;

  isSubmitting: boolean = false;

  constructor(private http: HttpClient) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-menu-wrapper')) {
      this.showFilter = false;
      this.activeDropdown = '';
    }
  }

  toggleFilter(event: MouseEvent) {
    event.stopPropagation();
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.activeDropdown = '';
    }
  }

  getSelectedStatusLabel(): string {
    const map: any = {
      'ARRANGED': 'Đã xếp lịch',
      'PUBLISHED': 'Đã công bố',
      'DRAFT': 'Bản nháp'
    };
    return map[this.selectedStatus] || 'Tất cả Trạng thái';
  }

  ngOnInit(): void {
    this.loadSchedules();
    this.loadSemesters();

    // Load current dates
    const today = new Date();
    // removed auto-init of examDate as requested
  }

  loadSchedules(): void {
    this.http.get<any[]>('http://localhost:8001/api/admin/exam-schedules').subscribe(data => {
      this.examSchedules = data.sort((a, b) => (b.id || 0) - (a.id || 0));
      this.filterSchedules();
    });
  }

  loadSemesters(): void {
    this.http.get<any[]>('http://localhost:8001/api/semesters').subscribe(data => {
      this.semesters = data.filter(s => s.status === 'ONGOING' || s.semesterStatus === 'ONGOING');
      // Auto-select first ongoing semester if available
      if (this.semesters.length > 0 && !this.selectedSemester) {
        this.selectedSemester = this.semesters[0].id;
        this.onSemesterChange();
      }
    });
  }

  filterSchedules(): void {
    let result = this.examSchedules;

    // Search term filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(s =>
        s.courseClass?.className?.toLowerCase().includes(term) ||
        s.courseClass?.subjectName?.toLowerCase().includes(term) ||
        s.courseClass?.classCode?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      result = result.filter(s => s.status === this.selectedStatus);
    }

    // Semester filter
    if (this.selectedSemesterFilter) {
      result = result.filter(s => s.courseClass?.semesterId === this.selectedSemesterFilter);
    }

    this.filteredSchedules = result;
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedSemesterFilter = null;
    this.filterSchedules();
  }

  getSelectedCohortName(): string {
    return this.selectedCohort ? 'Khóa ' + this.selectedCohort : 'Chọn khóa học';
  }

  getSelectedSubjectName(): string {
    const sub = this.subjects.find(s => s.id === this.selectedSubject);
    return sub ? sub.name : 'Chọn học phần';
  }

  getModalExamTypeLabel(): string {
    const map: any = {
      'MIDTERM': 'Giữa kỳ',
      'FINAL': 'Cuối kỳ',
      'RETAKE': 'Thi lại'
    };
    return map[this.examType as string] || 'Chọn loại thi';
  }

  getModalExamFormatLabel(): string {
    return this.examFormat || 'Chọn hình thức';
  }

  getSelectedAdminClassName(): string {
    const ac = this.adminClasses.find(a => a.id === this.selectedAdminClass);
    return ac ? ac.className : 'Chọn lớp học';
  }

  getArrangementModeLabel(): string {
    const map: any = {
      'BY_NAME': 'Theo tên sinh viên',
      'BY_CODE': 'Theo mã sinh viên'
    };
    return map[this.arrangementMode] || 'Chọn cách sắp xếp';
  }

  get paginatedSchedules(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredSchedules.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Removed duplicate totalPages here


  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  get minEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredSchedules.length);
  }

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'ARRANGED': return 'Đã xếp lịch';
      case 'PUBLISHED': return 'Đã công bố';
      case 'DRAFT': return 'Bản nháp';
      default: return status || 'Không xác định';
    }
  }

  getExamTypeLabel(type: string | undefined): string {
    switch (type) {
      case 'MIDTERM': return 'Giữa kỳ';
      case 'FINAL': return 'Cuối kỳ';
      case 'RETAKE': return 'Thi lại';
      default: return type || 'Không xác định';
    }
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'ARRANGED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'PUBLISHED': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'DRAFT': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSchedules.length / this.itemsPerPage) || 1;
  }

  get totalSchedules(): number {
    return this.filteredSchedules.length;
  }

  handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeAddModal();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  openAddModal(): void {
    this.resetForm();
    this.assignedRooms = [
      { roomName: 'VPC2-1203', capacity: 40 },
      { roomName: 'VPC2-1204', capacity: 40 },
      { roomName: 'VPC2-1205', capacity: 40 }
    ];
    this.showModal = true;
  }

  closeAddModal(): void {
    this.showModal = false;
  }

  resetForm(): void {
    this.selectedCohort = null;
    this.selectedSubject = null;
    this.selectedAdminClass = null;
    this.resolvedCourseClassId = null;
    this.resolvedCourseClassIds = [];
    this.students = [];
    this.assignedRooms = [];
    this.selectedRoomIndexes.clear();
    this.examType = null;
    this.examFormat = null;
    this.examDate = '';

    if (this.semesters.length > 0) {
      this.selectedSemester = this.semesters[0].id;
      this.onSemesterChange();
    }
  }

  onSemesterChange(): void {
    if (this.selectedSemester) {
      this.selectedCohort = null;
      this.selectedSubject = null;
      this.selectedAdminClass = null;
      this.http.get<any[]>(`http://localhost:8001/api/course-classes?semesterId=${this.selectedSemester}`)
        .subscribe(data => {
          this.allCourseClasses = data;
          this.cohorts = [...new Set(data.map(c => c.cohort).filter(c => c != null))].sort((a: any, b: any) => Number(b) - Number(a));

          const uniqueSubjects = new Map<number, any>();
          const uniqueAdminClasses = new Map<number, any>();

          data.forEach(c => {
            if (!uniqueSubjects.has(c.subjectId)) {
              uniqueSubjects.set(c.subjectId, { id: c.subjectId, name: c.subjectName });
            }
            if (c.targetClassId && !uniqueAdminClasses.has(c.targetClassId)) {
              uniqueAdminClasses.set(c.targetClassId, { id: c.targetClassId, className: c.targetClassName, cohort: c.cohort });
            }
          });

          this.subjects = Array.from(uniqueSubjects.values());
          this.adminClasses = Array.from(uniqueAdminClasses.values());
          this.resolveCourseClass();
        });
    } else {
      this.allCourseClasses = [];
      this.cohorts = [];
      this.subjects = [];
      this.adminClasses = [];
      this.resolveCourseClass();
    }
  }

  onCohortChange(): void {
    this.selectedSubject = null;
    this.selectedAdminClass = null;
    if (this.selectedCohort) {
      const filtered = this.allCourseClasses.filter(c => c.cohort == this.selectedCohort);
      const uniqueAdminClasses = new Map<number, any>();
      const uniqueSubjects = new Map<number, any>();

      filtered.forEach(c => {
        if (c.targetClassId && !uniqueAdminClasses.has(c.targetClassId)) {
          uniqueAdminClasses.set(c.targetClassId, { id: c.targetClassId, className: c.targetClassName, cohort: c.cohort });
        }
        if (!uniqueSubjects.has(c.subjectId)) {
          uniqueSubjects.set(c.subjectId, { id: c.subjectId, name: c.subjectName });
        }
      });
      this.adminClasses = Array.from(uniqueAdminClasses.values());
      this.subjects = Array.from(uniqueSubjects.values());
    } else {
      this.onSemesterChange(); // Restore all
    }
    this.resolveCourseClass();
  }

  onFilterChange(): void {
    this.resolveCourseClass();
  }

  resolveCourseClass(): void {
    this.resolvedCourseClassId = null;
    this.resolvedCourseClassIds = [];
    this.students = [];
    if (!this.selectedSemester) return;

    const matches = this.allCourseClasses.filter(c => {
      let ok = true;
      if (this.selectedSubject && c.subjectId !== this.selectedSubject) ok = false;
      if (this.selectedAdminClass && c.targetClassId !== this.selectedAdminClass) ok = false;
      if (this.selectedCohort && c.cohort != this.selectedCohort) ok = false;
      return ok;
    });

    this.resolvedCourseClassIds = matches.map(m => m.id);

    if (matches.length === 1) {
      this.resolvedCourseClassId = matches[0].id;
    }

    if (this.selectedSubject || this.selectedAdminClass || this.selectedCohort) {
      const registrationsUrl = matches.map(m => this.http.get<any[]>(`http://localhost:8001/api/registrations/class/${m.id}`));
      
      const requests: any = {
        registrations: forkJoin(registrationsUrl.length > 0 ? registrationsUrl : [of([])])
      };

      if (this.examType) {
        requests.assignedKeys = this.http.get<string[]>(`http://localhost:8001/api/admin/exam-schedules/assigned-keys?semesterId=${this.selectedSemester}&examType=${this.examType}`);
      }

      forkJoin(requests).subscribe((res: any) => {
        const registrationSubmissions = res.registrations as any[][];
        const assignedKeys = new Set((res.assignedKeys || []).map((k: string) => k.toUpperCase()));
        
        const studentsMap = new Map<string, any>();
        
        registrationSubmissions.forEach(data => {
          data.forEach(s => {
            if (!s.studentCode) return;
            const code = s.studentCode.trim().toUpperCase();
            const key = `${code}_${s.subjectId}`;
            
            if (!assignedKeys.has(key)) {
              if (!studentsMap.has(code)) {
                studentsMap.set(code, { 
                  ...s, 
                  subjects: new Set([s.subjectName]) 
                });
              } else {
                studentsMap.get(code).subjects.add(s.subjectName);
              }
            }
          });
        });
        
        this.students = Array.from(studentsMap.values()).map(s => ({
          ...s,
          subjectName: Array.from(s.subjects).join(', ')
        }));
        
        console.log(`Matched classes: ${matches.length}, Assigned entries: ${assignedKeys.size}, Available students: ${this.students.length}`);
      });
    }
  }

  addRoom(): void {
    if (this.newRoomName.trim()) {
      this.assignedRooms.push({
        roomName: this.newRoomName,
        capacity: this.newRoomCapacity
      });
      const newIndex = this.assignedRooms.length - 1;
      this.selectedRoomIndexes.add(newIndex);
      this.newRoomName = '';
      this.newRoomCapacity = 40;
    }
  }

  removeRoom(index: number): void {
    this.assignedRooms.splice(index, 1);
    const updatedSelected = new Set<number>();
    this.assignedRooms.forEach((_, i) => {
      // Simplistic approach: if it was selected before and still exists (shifted) 
      // or just select all if logic gets complex. 
      // For now, let's just clear and re-select others if they were selected.
      // But simpler is to re-build or just select all.
    });
    // better: clear and set if it was there
    this.selectedRoomIndexes.clear();
    this.assignedRooms.forEach((_, i) => this.selectedRoomIndexes.add(i));
  }

  toggleRoom(index: number) {
    if (this.selectedRoomIndexes.has(index)) {
      this.selectedRoomIndexes.delete(index);
    } else {
      this.selectedRoomIndexes.add(index);
    }
  }

  toggleAllRooms() {
    if (this.selectedRoomIndexes.size === this.assignedRooms.length) {
      this.selectedRoomIndexes.clear();
    } else {
      this.assignedRooms.forEach((_, i) => this.selectedRoomIndexes.add(i));
    }
  }

  isRoomSelected(index: number): boolean {
    return this.selectedRoomIndexes.has(index);
  }

  get allRoomsSelected(): boolean {
    return this.assignedRooms.length > 0 && this.selectedRoomIndexes.size === this.assignedRooms.length;
  }

  getTotalCapacity(): number {
    return this.assignedRooms.reduce((sum, r) => sum + r.capacity, 0);
  }

  getSelectedTotalCapacity(): number {
    return Array.from(this.selectedRoomIndexes).reduce((sum, idx) => sum + this.assignedRooms[idx].capacity, 0);
  }

  getArrangementSummary(): string {
    const studentCount = this.students.length;
    const selectedCapacity = this.getSelectedTotalCapacity();
    if (studentCount === 0) return '0 sinh viên';
    if (selectedCapacity === 0) return `${studentCount} sinh viên (Chưa chọn phòng)`;

    const shifts = Math.ceil(studentCount / selectedCapacity);
    return `${studentCount} sinh viên, ${shifts} ca thi`;
  }

  submitAutoArrange(): void {
    const canSubmitBySubject = this.selectedSemester && this.selectedCohort && this.selectedSubject && this.resolvedCourseClassIds.length > 0;
    const canSubmitByClass = this.selectedSemester && this.resolvedCourseClassId;

    if (!(canSubmitBySubject || canSubmitByClass) || this.assignedRooms.filter((_, i) => this.selectedRoomIndexes.has(i)).length === 0) {
      alert("Vui lòng chọn đầy đủ Học kỳ, Khóa học, Học phần và phân bổ ít nhất 1 phòng thi.");
      return;
    }

    const payload = {
      courseClassId: this.resolvedCourseClassId,
      courseClassIds: this.resolvedCourseClassIds,
      examType: this.examType,
      examFormat: this.examFormat,
      examDate: this.examDate,
      durationMinutes: this.durationMinutes,
      firstSlotStart: this.firstSlotStart + ':00',
      gapDuration: this.gapDuration,
      arrangementMode: this.arrangementMode,
      isShuffled: this.isShuffled,
      hasRollNumbers: this.hasRollNumbers,
      rooms: this.assignedRooms.filter((_, i) => this.selectedRoomIndexes.has(i))
    };

    this.isSubmitting = true;
    this.http.post<any>('http://localhost:8001/api/admin/exam-schedules/auto-arrange', payload)
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          alert(res.message || "Xếp lịch thi thành công!");
          this.closeAddModal();
          this.loadSchedules();
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || err.message || "Có lỗi xảy ra";
          alert("Lỗi: " + msg);
        }
      });
  }
}
