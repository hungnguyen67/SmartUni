import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../../auth.service';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';

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
  lecturers: any[] = [];
  selectedProctorIds: number[] = [];
  createdByName: string = '';

  arrangementMode: string = 'BY_NAME';
  isShuffled: boolean = true;
  hasRollNumbers: boolean = true;

  students: any[] = [];
  assignedRooms: { roomName: string, capacity: number }[] = [];
  selectedRoomIndexes = new Set<number>();
  newRoomName: string = '';
  newRoomCapacity: number = 40;

  isSubmitting: boolean = false;
  currentUserId: number | null = null;

  // New states for Edit/Delete
  isEditing: boolean = false;
  selectedSchedule: any = null;
  originalScheduleData: any = null;

  // Detailed Modal Filtering
  showDetailFilter = false;
  selectedDetailClass = '';
  selectedDetailTime = '';
  selectedDetailRoom = '';
  selectedDetailProctor = '';
  detailClasses: string[] = [];
  detailTimes: string[] = [];
  detailRooms: string[] = [];
  detailProctors: string[] = [];
  
  // Temporary selections for Detail Filter (Apply/Reset pattern)
  tempDetailClass = '';
  tempDetailTime = '';
  tempDetailRoom = '';
  tempDetailProctor = '';

  showDeleteModal: boolean = false;
  scheduleToDelete: any = null;

  // New states for detailed view
  showDetailModal: boolean = false;
  selectedScheduleDetails: any = null;
  detailSearchTerm: string = '';
  filteredDetailStudents: any[] = [];

  constructor(private http: HttpClient, private authService: AuthService, private flashMessage: FlashMessageService) { }


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

  getSelectedSemesterFilterName(): string {
    if (!this.selectedSemesterFilter) return 'Chọn học kỳ';
    const s = this.semesters.find(s => s.id === this.selectedSemesterFilter);
    return s ? s.name : 'Chọn học kỳ';
  }

  ngOnInit(): void {
    this.loadSchedules();
    this.loadSemesters();
    this.loadLecturers();

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-menu-wrapper') && !target.closest('.relative')) {
      this.showFilter = false;
      this.showDetailFilter = false;
      this.activeDropdown = '';
    }
  }

  toggleDetailFilter(event: MouseEvent): void {
    event.stopPropagation();
    this.showDetailFilter = !this.showDetailFilter;
    if (this.showDetailFilter) {
      this.tempDetailClass = this.selectedDetailClass;
      this.tempDetailTime = this.selectedDetailTime;
      this.tempDetailRoom = this.selectedDetailRoom;
      this.tempDetailProctor = this.selectedDetailProctor;
      this.activeDropdown = 'detFilter';
    } else {
      this.activeDropdown = '';
    }
  }

  loadSemesters(): void {
    this.http.get<any[]>('http://localhost:8001/api/semesters').subscribe(data => {
      // Chỉ hiện Đang diễn ra và Sắp tới, ưu tiên Đang diễn ra lên đầu
      this.semesters = data.filter(s => s.semesterStatus === 'ONGOING' || s.semesterStatus === 'UPCOMING')
        .sort((a, b) => a.semesterStatus === 'ONGOING' ? -1 : 1);

      // Auto-select first ongoing semester if available
      if (this.semesters.length > 0) {
        this.selectedSemester = this.semesters[0].id;
        this.selectedSemesterFilter = this.semesters[0].id;
        this.onSemesterChange();
        this.filterSchedules();
      }
    });
  }

  loadLecturers(): void {
    this.http.get<any[]>('http://localhost:8001/api/lecturers').subscribe(res => this.lecturers = res);
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

  getModalProctorLabel(): string {
    if (this.selectedProctorIds.length === 0) return 'Chọn cán bộ coi thi';
    if (this.selectedProctorIds.length === 1) {
      const p = this.lecturers.find(l => l.id === this.selectedProctorIds[0]);
      return p ? (p.firstName + ' ' + p.lastName) : 'Chọn cán bộ coi thi';
    }
    return `Đã chọn ${this.selectedProctorIds.length} cán bộ`;
  }

  isProctorSelected(id: number): boolean {
    return this.selectedProctorIds.includes(id);
  }

  toggleProctor(id: number): void {
    const index = this.selectedProctorIds.indexOf(id);
    if (index > -1) {
      this.selectedProctorIds.splice(index, 1);
    } else {
      this.selectedProctorIds.push(id);
    }
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

  handleBackdropClick(event: MouseEvent, type: 'add' | 'delete'): void {
    if (event.target === event.currentTarget) {
      if (type === 'add') {
        this.closeAddModal();
      } else {
        this.closeDeleteModal();
      }
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
    // Load tên và ID người tạo từ thông tin đăng nhập
    const user = this.authService.getUserFromStorage();
    if (user) {
      this.createdByName = user.fullName || user.firstName + ' ' + user.lastName || user.email || '...';
      this.currentUserId = user.id;
    } else {
      this.createdByName = '...';
      this.currentUserId = null;
    }
    this.showModal = true;
  }

  closeAddModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.selectedSchedule = null;
  }

  confirmDelete(schedule: any): void {
    this.scheduleToDelete = schedule;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.scheduleToDelete = null;
  }

  deleteSchedule(): void {
    if (!this.scheduleToDelete) return;
    this.isSubmitting = true;
    this.http.delete(`http://localhost:8001/api/admin/exam-schedules/${this.scheduleToDelete.id}`).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.flashMessage.success("Xóa lịch thi thành công!");
        this.closeDeleteModal();
        this.loadSchedules();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.flashMessage.handleError(err);
      }
    });
  }

  openEditModal(schedule: any): void {
    this.isEditing = true;
    this.selectedSchedule = schedule;
    this.selectedSemester = schedule.courseClass?.semesterId;
    
    // First, we need to ensure allCourseClasses for this semester are loaded
    this.http.get<any[]>(`http://localhost:8001/api/course-classes?semesterId=${this.selectedSemester}`)
      .subscribe(data => {
        this.allCourseClasses = data;
        
        // Re-populate the filtering lists (cohorts, subjects, adminClasses)
        // Only ongoing classes for general selection, but for editing we might need historical ones 
        // For simplicity, let's just use all for the lists in edit mode
        const ongoingClasses = data; 

        this.cohorts = [...new Set(ongoingClasses.map(c => c.cohort).filter(c => c != null))].sort((a: any, b: any) => Number(b) - Number(a));

        const uniqueSubjects = new Map<number, any>();
        const uniqueAdminClasses = new Map<number, any>();

        ongoingClasses.forEach(c => {
          if (!uniqueSubjects.has(c.subjectId)) {
            uniqueSubjects.set(c.subjectId, { id: c.subjectId, name: c.subjectName });
          }
          if (c.targetClassId && !uniqueAdminClasses.has(c.targetClassId)) {
            uniqueAdminClasses.set(c.targetClassId, { id: c.targetClassId, className: c.targetClassName, cohort: c.cohort });
          }
        });

        this.subjects = Array.from(uniqueSubjects.values());
        this.adminClasses = Array.from(uniqueAdminClasses.values());

        // Now set the selected values for this specific schedule
        this.selectedCohort = schedule.courseClass?.cohort;
        this.selectedSubject = schedule.courseClass?.subjectId;
        
        // Chỉ tự động chọn lớp học nếu tổng sinh viên của lịch thi khớp với sĩ số của lớp học đó.
        // Nếu không khớp (ví dụ 24 SV vs 12 SV), khả năng cao đây là lịch thi gộp nhiều lớp của cùng học phần.
        if (schedule.totalStudents === schedule.courseClass?.currentEnrolled) {
          this.selectedAdminClass = schedule.courseClass?.targetClassId;
        } else {
          this.selectedAdminClass = null;
        }
        
        this.resolvedCourseClassId = schedule.courseClass?.id;

        this.examType = schedule.examType;
        this.examFormat = schedule.examFormat;
        
        // Format date properly for <input type="date"> (YYYY-MM-DD)
        if (schedule.examDate) {
          if (typeof schedule.examDate === 'string') {
            this.examDate = schedule.examDate.substring(0, 10);
          } else if (schedule.examDate instanceof Date) {
            this.examDate = schedule.examDate.toISOString().substring(0, 10);
          } else {
            this.examDate = schedule.examDate;
          }
        } else {
          this.examDate = '';
        }

        this.durationMinutes = schedule.durationMinutes;
        this.firstSlotStart = schedule.firstSlotStart;
        this.gapDuration = schedule.gapDuration || 15;
        this.selectedProctorIds = schedule.proctorId ? [schedule.proctorId] : [];
        if (schedule.proctorIds) this.selectedProctorIds = schedule.proctorIds;
        
        this.assignedRooms = schedule.rooms.map((r: any) => ({ roomName: r.roomName, capacity: r.capacity || 40 }));
        this.selectedRoomIndexes.clear();
        this.assignedRooms.forEach((_, i) => this.selectedRoomIndexes.add(i));
        
        this.resolveCourseClass();
        
        // Capture original state for change detection
        this.originalScheduleData = {
          examType: this.examType,
          examFormat: this.examFormat,
          examDate: this.examDate,
          durationMinutes: this.durationMinutes,
          firstSlotStart: this.formatTime(this.firstSlotStart),
          gapDuration: this.gapDuration,
          proctorIds: [...this.selectedProctorIds].sort(),
          rooms: this.assignedRooms.filter((_, i) => this.selectedRoomIndexes.has(i))
            .map(r => ({ roomName: r.roomName, capacity: r.capacity }))
        };

        this.showModal = true;
      });
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
    this.selectedProctorIds = [];
    this.createdByName = '';

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

          // Chỉ lấy lớp HP đang học (ONGOING) để hiển thị trong dropdown
          const ongoingClasses = data.filter(c => c.classStatus === 'ONGOING');

          this.cohorts = [...new Set(ongoingClasses.map(c => c.cohort).filter(c => c != null))].sort((a: any, b: any) => Number(b) - Number(a));

          const uniqueSubjects = new Map<number, any>();
          const uniqueAdminClasses = new Map<number, any>();

          ongoingClasses.forEach(c => {
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
      // Chỉ lấy lớp HP đang học (ONGOING) trong khóa đã chọn
      const filtered = this.allCourseClasses.filter(c => c.cohort == this.selectedCohort && c.classStatus === 'ONGOING');
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
        let keysUrl = `http://localhost:8001/api/admin/exam-schedules/assigned-keys?semesterId=${this.selectedSemester}&examType=${this.examType}`;
        if (this.isEditing && this.selectedSchedule) {
          keysUrl += `&excludeScheduleId=${this.selectedSchedule.id}`;
        }
        requests.assignedKeys = this.http.get<string[]>(keysUrl);
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
    if (this.isEditing && this.selectedSchedule) {
      this.updateSchedule();
      return;
    }

    const canSubmitBySubject = this.selectedSemester && this.selectedCohort && this.selectedSubject && this.resolvedCourseClassIds.length > 0;
    const canSubmitByClass = this.selectedSemester && this.resolvedCourseClassId;

    if (!(canSubmitBySubject || canSubmitByClass)) {
      this.flashMessage.warning("Vui lòng chọn đầy đủ Học kỳ, Khóa học và Học phần/Lớp học.");
      return;
    }

    if (!this.examType || !this.examFormat || !this.examDate || this.selectedProctorIds.length === 0) {
      this.flashMessage.warning("Vui lòng nhập đầy đủ thông tin: Loại thi, Hình thức thi, Ngày thi và Cán bộ coi thi.");
      return;
    }

    if (this.selectedProctorIds.length !== this.selectedRoomIndexes.size) {
      this.flashMessage.warning(`Số lượng cán bộ (${this.selectedProctorIds.length}) phải bằng số lượng phòng thi (${this.selectedRoomIndexes.size}).`);
      return;
    }

    if (this.assignedRooms.filter((_, i) => this.selectedRoomIndexes.has(i)).length === 0) {
      this.flashMessage.warning("Vui lòng phân bổ ít nhất 1 phòng thi.");
      return;
    }

    if (this.students.length === 0) {
      this.flashMessage.warning("Không có sinh viên nào thỏa mãn để xếp lịch thi. Vui lòng kiểm tra lại học phần hoặc danh sách sinh viên.");
      return;
    }

    const payload = {
      courseClassId: this.resolvedCourseClassId,
      courseClassIds: this.resolvedCourseClassIds,
      examType: this.examType,
      examFormat: this.examFormat,
      examDate: this.examDate,
      durationMinutes: this.durationMinutes,
      firstSlotStart: this.formatTime(this.firstSlotStart),
      gapDuration: this.gapDuration,
      arrangementMode: this.arrangementMode,
      isShuffled: this.isShuffled,
      hasRollNumbers: this.hasRollNumbers,
      rooms: this.assignedRooms.filter((_, i) => this.selectedRoomIndexes.has(i)),
      proctorIds: this.selectedProctorIds,
      createdById: this.currentUserId
    };

    this.isSubmitting = true;
    this.http.post<any>('http://localhost:8001/api/admin/exam-schedules/auto-arrange', payload)
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.flashMessage.success(res.message || "Xếp lịch thi thành công!");
          this.closeAddModal();
          this.loadSchedules();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.flashMessage.handleError(err);
        }
      });
  }

  formatTime(time: string): string {
    if (!time) return '';
    // If it's HH:mm (len 5), add :00
    if (time.length === 5) return time + ':00';
    // If it's already HH:mm:ss (len 8), return as is
    if (time.length === 8) return time;
    // Handle other possible formats (like T prefix)
    if (time.includes('T')) {
      const parts = time.split('T');
      if (parts.length > 1) return this.formatTime(parts[1].substring(0, 8));
    }
    return time;
  }

  hasScheduleChanges(): boolean {
    if (!this.isEditing || !this.originalScheduleData) return true;

    const currentRooms = this.assignedRooms.filter((_, i) => this.selectedRoomIndexes.has(i))
      .map(r => ({ roomName: r.roomName, capacity: r.capacity }));
    const originalRooms = this.originalScheduleData.rooms;

    const roomsChanged = JSON.stringify(currentRooms) !== JSON.stringify(originalRooms);
    const proctorsChanged = JSON.stringify([...this.selectedProctorIds].sort()) !== JSON.stringify(this.originalScheduleData.proctorIds);

    return this.examType !== this.originalScheduleData.examType ||
      this.examFormat !== this.originalScheduleData.examFormat ||
      this.examDate !== this.originalScheduleData.examDate ||
      this.durationMinutes !== this.originalScheduleData.durationMinutes ||
      this.formatTime(this.firstSlotStart) !== this.originalScheduleData.firstSlotStart ||
      this.gapDuration !== this.originalScheduleData.gapDuration ||
      roomsChanged ||
      proctorsChanged;
  }

  updateSchedule(): void {
    if (!this.selectedSchedule) return;

    if (this.isEditing && !this.hasScheduleChanges()) {
      this.flashMessage.info('Không có thay đổi nào để cập nhật');
      return;
    }

    if (!this.examType || !this.examFormat || !this.examDate || this.selectedProctorIds.length === 0) {
      this.flashMessage.warning("Vui lòng nhập đầy đủ thông tin: Loại thi, Hình thức thi, Ngày thi và Cán bộ coi thi.");
      return;
    }

    if (this.selectedProctorIds.length !== this.selectedRoomIndexes.size) {
      this.flashMessage.warning(`Số lượng cán bộ (${this.selectedProctorIds.length}) phải bằng số lượng phòng thi (${this.selectedRoomIndexes.size}).`);
      return;
    }

    const payload = {
      examType: this.examType,
      examFormat: this.examFormat,
      examDate: this.examDate,
      durationMinutes: this.durationMinutes,
      firstSlotStart: this.formatTime(this.firstSlotStart),
      gapDuration: this.gapDuration,
      proctorIds: this.selectedProctorIds,
      notes: this.selectedSchedule.notes,
      rooms: this.assignedRooms.filter((_, i) => this.selectedRoomIndexes.has(i))
    };

    this.isSubmitting = true;
    this.http.put(`http://localhost:8001/api/admin/exam-schedules/${this.selectedSchedule.id}`, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.flashMessage.success("Cập nhật lịch thi thành công!");
        this.closeAddModal();
        this.loadSchedules();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.flashMessage.handleError(err);
      }
    });
  }

  viewScheduleDetails(id: number): void {
    this.http.get<any>(`http://localhost:8001/api/admin/exam-schedules/${id}/details`).subscribe({
      next: (res) => {
        this.selectedScheduleDetails = res;
        this.filteredDetailStudents = res.assignedStudents || [];
        this.showDetailModal = true;

        // Extract unique lists for filters
        if (res.assignedStudents) {
          this.detailClasses = [...new Set(res.assignedStudents.map((s: any) => s.className).filter((v: any) => !!v))].sort() as string[];
          this.detailTimes = [...new Set(res.assignedStudents.map((s: any) => s.examTime).filter((v: any) => !!v))].sort() as string[];
          this.detailRooms = [...new Set(res.assignedStudents.map((s: any) => s.roomName).filter((v: any) => !!v))].sort() as string[];
          this.detailProctors = [...new Set(res.assignedStudents.map((s: any) => s.proctorName).filter((v: any) => !!v))].sort() as string[];
        }
      },
      error: (err) => {
        this.flashMessage.handleError(err);
      }
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedScheduleDetails = null;
    this.detailSearchTerm = '';
    this.showDetailFilter = false;
    this.selectedDetailClass = '';
    this.selectedDetailTime = '';
    this.selectedDetailRoom = '';
    this.selectedDetailProctor = '';
    this.tempDetailClass = '';
    this.tempDetailTime = '';
    this.tempDetailRoom = '';
    this.tempDetailProctor = '';
  }

  onDetailSearch(): void {
    if (!this.selectedScheduleDetails || !this.selectedScheduleDetails.assignedStudents) return;
    const term = this.detailSearchTerm.toLowerCase().trim();

    this.filteredDetailStudents = this.selectedScheduleDetails.assignedStudents.filter((s: any) => {
      const matchesSearch = !term ||
        s.studentCode.toLowerCase().includes(term) ||
        s.fullName.toLowerCase().includes(term) ||
        (s.className && s.className.toLowerCase().includes(term)) ||
        (s.roomName && s.roomName.toLowerCase().includes(term)) ||
        (s.proctorName && s.proctorName.toLowerCase().includes(term));

      const matchesClass = !this.selectedDetailClass || s.className === this.selectedDetailClass;
      const matchesTime = !this.selectedDetailTime || s.examTime === this.selectedDetailTime;
      const matchesRoom = !this.selectedDetailRoom || s.roomName === this.selectedDetailRoom;
      const matchesProctor = !this.selectedDetailProctor || s.proctorName === this.selectedDetailProctor;

      return matchesSearch && matchesClass && matchesTime && matchesRoom && matchesProctor;
    });
  }

  applyDetailFilters(): void {
    this.selectedDetailClass = this.tempDetailClass;
    this.selectedDetailTime = this.tempDetailTime;
    this.selectedDetailRoom = this.tempDetailRoom;
    this.selectedDetailProctor = this.tempDetailProctor;
    this.onDetailSearch();
    this.showDetailFilter = false;
  }

  resetDetailFilterDrafts(): void {
    this.tempDetailClass = '';
    this.tempDetailTime = '';
    this.tempDetailRoom = '';
    this.tempDetailProctor = '';
    this.selectedDetailClass = '';
    this.selectedDetailTime = '';
    this.selectedDetailRoom = '';
    this.selectedDetailProctor = '';
    this.onDetailSearch();
  }
}
