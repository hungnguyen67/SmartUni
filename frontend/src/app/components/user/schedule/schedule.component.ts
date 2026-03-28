import { Component, OnInit, Renderer2 } from '@angular/core';
import { ScheduleService } from '../../../services/schedule.service';
import { SemesterService } from '../../../services/semester.service';
import { AuthService } from '../../../auth.service';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';
import { forkJoin, map, of } from 'rxjs';

@Component({
  selector: 'app-user-schedule',
  templateUrl: './schedule.component.html'
})
export class UserScheduleComponent implements OnInit {
  semesters: any[] = [];
  selectedSemesterId: number | null = null;
  scheduleItems: any[] = [];
  loading: boolean = false;
  errorMessage: string = '';
  isLecturer: boolean = false;
  showModal: boolean = false;
  showExamModal: boolean = false;
  selectedSession: any = null;
  selectedExam: any = null;
  monthExams: any[] = [];
  loadingModal: boolean = false;
  periods = Array.from({ length: 17 }, (_, i) => i + 1);
  periodTimes: { [key: number]: string } = {
    1: '07:00', 2: '08:00', 3: '09:00', 4: '10:00', 5: '11:00',
    6: '12:00', 7: '13:00', 8: '14:00', 9: '15:00', 10: '16:00',
    11: '17:00', 12: '18:00', 13: '19:00', 14: '20:00', 15: '21:00', 16: '22:00', 17: '23:00'
  };
  realPeriodTimes: { [key: number]: string } = {
    1: '07:00', 2: '07:55', 3: '08:50', 4: '09:45', 5: '10:40',
    6: '13:00', 7: '13:55', 8: '14:50', 9: '15:45', 10: '16:40',
    11: '17:35', 12: '18:30', 13: '19:25', 14: '20:20', 15: '21:15', 16: '22:10', 17: '23:05'
  };
  periodEndTimes: { [key: number]: string } = {
    1: '07:50', 2: '08:45', 3: '09:40', 4: '10:35', 5: '11:30',
    6: '13:55', 7: '14:50', 8: '15:45', 9: '16:40', 10: '17:30',
    11: '18:25', 12: '19:20', 13: '20:15', 14: '21:10', 15: '22:05', 16: '23:00', 17: '23:55'
  };
  weekDays: any[] = [];
  currentWeekStart: Date = new Date();
  attendanceCodeInput: string = '';
  attendanceCodeForStudents: string = '';
  headerCheck: string = '';



  constructor(
    private scheduleService: ScheduleService,
    private semesterService: SemesterService,
    private authService: AuthService,
    private renderer: Renderer2,
    private flashMessageService: FlashMessageService
  ) { }

  ngOnInit(): void {
    this.calculateWeekDays();
    this.loadSemesters();
  }

  loadSemesters(): void {
    this.semesterService.getAllSemesters().subscribe((res: any[]) => {
      this.semesters = res;
      if (this.semesters.length > 0) {
        const active = this.semesters.find(s => s.semesterStatus === 'ONGOING') || this.semesters[this.semesters.length - 1];
        this.selectedSemesterId = active.id;
        this.loadSchedule();
      }
    });
  }

  loadSchedule(): void {
    const user = this.authService.getUserFromStorage();
    console.log('DEBUG: Current User from Storage:', user);

    if (!user) {
      this.errorMessage = 'Vui lòng đăng nhập để xem lịch.';
      return;
    }

    const userId = user.studentId || user.id;
    if (!userId) {
      this.errorMessage = 'Không tìm thấy thông tin định danh người dùng.';
      return;
    }

    if (!this.selectedSemesterId) {
      this.errorMessage = 'Vui lòng chọn học kỳ.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.scheduleItems = [];

    this.isLecturer = user.role === 'LECTURER';

    const scheduleObservable = this.isLecturer
      ? this.scheduleService.getLecturerSchedule(userId, this.selectedSemesterId)
      : this.scheduleService.getStudentSchedule(userId, this.selectedSemesterId);

    const examObservable = this.isLecturer
      ? this.scheduleService.getLecturerExamSchedules(userId)
      : this.scheduleService.getStudentExamSchedules(userId);

    forkJoin({
      regular: scheduleObservable,
      exams: examObservable
    }).subscribe({
      next: (result) => {
        const normalizedExams = result.exams.flatMap(e => this.normalizeExams(e));
        this.scheduleItems = [...result.regular, ...normalizedExams];
        this.loading = false;
        this.updateDisplayedPeriods();
        if (this.scheduleItems.length === 0) {
          this.errorMessage = 'Không có lịch nào trong tuần này.';
        }
      },
      error: (err) => {
        console.error('Lỗi tải lịch:', err);
        this.errorMessage = 'Đã xảy ra lỗi khi tải lịch. Vui lòng thử lại sau.';
        this.loading = false;
      }
    });
  }

  ensureStringDate(date: any): string {
    if (!date) return '';
    if (Array.isArray(date)) {
      // Chuyển mảng [yyyy, m, d] sang yyyy-MM-dd để đảm bảo filter lưới lịch (yyyy-mm-dd) không bị lỗi
      const y = date[0];
      const m = String(date[1]).padStart(2, '0');
      const d = String(date[2]).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return String(date);
  }

  normalizeExams(exam: any): any[] {
    const isLecturer = this.authService.getRole() === 'LECTURER';
    
    // Nếu là giảng viên và có các ca thi (slots), gộp chúng thành 1 khối LIỀN MẠCH
    if (isLecturer && exam.slots && exam.slots.length > 0) {
      // Tìm thời gian bắt đầu của ca đầu và kết thúc của ca cuối
      const sortedSlots = [...exam.slots].sort((a,b) => String(a.startTime).localeCompare(String(b.startTime)));
      const overallStartTime = sortedSlots[0].startTime;
      const overallEndTime = sortedSlots[sortedSlots.length - 1].endTime;

      return [{
        id: exam.id,
        scheduleDate: this.ensureStringDate(exam.examDate),
        startTime: overallStartTime,
        endTime: overallEndTime,
        duration: null, // Dùng endTime thực tế
        subjectName: exam.courseClass?.subjectName,
        roomName: exam.rooms?.map((r: any) => r.roomName).join(', '),
        isExam: true,
        examFormat: exam.examFormat,
        startPeriod: this.timeToPeriod(overallStartTime),
        allSlots: exam.slots 
      }];
    }

    // Nếu là sinh viên (hoặc là GV nhưng k có slot - fallback), trả về 1 mục duy nhất
    return [{
      id: exam.id,
      scheduleDate: this.ensureStringDate(exam.examDate),
      startTime: isLecturer ? exam.firstSlotStart : exam.startTime,
      endTime: isLecturer ? null : exam.endTime,
      duration: isLecturer ? exam.durationMinutes : exam.duration,
      subjectName: isLecturer ? exam.courseClass?.subjectName : exam.subjectName,
      roomName: isLecturer ? (exam.rooms?.map((r: any) => r.roomName).join(', ')) : exam.roomName,
      isExam: true,
      examFormat: exam.examFormat,
      studentCode: exam.studentCode,
      rollNumber: exam.rollNumber,
      startPeriod: this.timeToPeriod(isLecturer ? exam.firstSlotStart : exam.startTime)
    }];
  }

  openExamDetail(item: any): void {
    console.log('DEBUG: Opening Exam Detail', item);
    this.selectedExam = item;
    this.showExamModal = true;
    this.renderer.addClass(document.body, 'overflow-hidden');

    // Lọc lịch thi trong cùng tháng
    const dateStr = this.ensureStringDate(item.scheduleDate);
    if (dateStr) {
      // Vì đã chuyển về yyyy-mm-dd, ta lấy 7 ký tự đầu là yyyy-mm
      const monthPrefix = dateStr.substring(0, 7); 
      this.monthExams = this.scheduleItems
        .filter(i => i.isExam && i.scheduleDate && this.ensureStringDate(i.scheduleDate).startsWith(monthPrefix))
        .sort((a, b) => this.ensureStringDate(a.scheduleDate).localeCompare(this.ensureStringDate(b.scheduleDate)));
    }
  }

  closeExamDetail(): void {
    this.showExamModal = false;
    this.renderer.removeClass(document.body, 'overflow-hidden');
    this.selectedExam = null;
    this.monthExams = [];
  }

  timeToPeriod(time: any): number {
    if (!time) return 1;
    const timeStr = this.formatBackendTime(time);
    const mins = this.timeToMinutes(timeStr);

    // Logic: Find the closest period starting at or before this time
    for (let p = 17; p >= 1; p--) {
      if (mins >= this.timeToMinutes(this.realPeriodTimes[p])) return p;
    }
    return 1;
  }

  calculateWeekDays(): void {
    const start = new Date(this.currentWeekStart);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));

    this.weekDays = [];
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const dayOfMonth = d.getDate().toString().padStart(2, '0');
      const localIsoDate = `${year}-${month}-${dayOfMonth}`;

      this.weekDays.push({
        label: labels[i],
        date: d.toLocaleDateString('vi-VN'),
        displayDate: `${dayOfMonth}/${month}/${year}`,
        isoDate: localIsoDate,
        fullDate: new Date(d)
      });
    }
    this.updateDisplayedPeriods();
  }

  updateDisplayedPeriods(): void {
    if (!this.scheduleItems || this.scheduleItems.length === 0) {
      this.periods = [];
      return;
    }

    const currentWeekDates = this.weekDays.map(d => d.isoDate);
    const itemsThisWeek = this.scheduleItems.filter(i => currentWeekDates.includes(i.scheduleDate));

    if (itemsThisWeek.length === 0) {
      this.periods = [];
      return;
    }

    let minMins = 24 * 60;
    let maxMins = 0;

    for (const item of itemsThisWeek) {
      const sMins = this.timeToMinutes(this.getStartTime(item));
      const eMins = this.timeToMinutes(this.getEndTime(item));
      if (sMins < minMins) minMins = sMins;
      if (eMins > maxMins) maxMins = eMins;
    }

    let minHour = Math.floor(minMins / 60);
    let maxHour = Math.ceil(maxMins / 60);

    if (minHour < 7) minHour = 7;
    if (maxHour > 23) maxHour = 23;

    const startP = Math.max(1, minHour - 6);
    const endP = Math.min(17, maxHour - 6);

    const newPeriods = [];
    for (let i = startP; i <= endP; i++) {
      newPeriods.push(i);
    }
    this.periods = newPeriods;
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.calculateWeekDays();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.calculateWeekDays();
  }

  goToToday(): void {
    this.currentWeekStart = new Date();
    this.calculateWeekDays();
  }

  onDateSelected(date: Date): void {
    this.currentWeekStart = date;
    this.calculateWeekDays();
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  openSessionDetail(instanceId: number): void {
    this.showModal = true;
    this.renderer.addClass(document.body, 'overflow-hidden');
    this.loadingModal = true;
    this.selectedSession = null;
    this.headerCheck = '';

    this.scheduleService.getSessionDetail(instanceId).subscribe({
      next: (res) => {
        this.selectedSession = res;
        this.loadingModal = false;
        const user = this.authService.getUserFromStorage();

        if (this.isLecturer) {
          // Faculty sees the PIN defined for the session
          this.attendanceCodeInput = res.attendanceCode || '';
        } else {
          // Students see ONLY what they previously entered
          const currentStudent = res.students?.find((s: any) => s.id === (user.studentId || user.id));
          this.attendanceCodeForStudents = currentStudent?.enteredCode || '';

          // DO NOT leak the correct PIN to students
          this.selectedSession.attendanceCode = undefined;
        }
      },
      error: (err) => {
        console.error('Lỗi tải chi tiết buổi học:', err);
        this.loadingModal = false;
        this.showModal = false;
        this.renderer.removeClass(document.body, 'overflow-hidden');
      }
    });
  }

  closeSessionDetail(): void {
    this.showModal = false;
    this.renderer.removeClass(document.body, 'overflow-hidden');
    this.selectedSession = null;
    this.headerCheck = '';
  }

  getItemsStartingAt(isoDate: string, period: number): any[] {
    return this.scheduleItems.filter(item =>
      item.scheduleDate === isoDate &&
      item.startPeriod === period
    );
  }

  getItemHeight(item: any): number {
    const startMins = this.timeToMinutes(this.getStartTime(item));
    const endMins = this.timeToMinutes(this.getEndTime(item));
    return ((endMins - startMins) / 60) * 64;
  }

  getTopOffset(item: any): number {
    const startMins = this.timeToMinutes(this.getStartTime(item));
    const rowMins = this.timeToMinutes(this.getPeriodTime(item.startPeriod));
    // Cộng 32px do label thời gian ở cột bên trái đã được căn nguyên bản ở Vertical Center (nửa dòng h-16)
    return ((startMins - rowMins) / 60) * 64 + 32;
  }

  timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  getSubjectColor(subjectName: string): string {
    const colors = ['#f97316', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981'];
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
      hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  formatBackendTime(time: any): string {
    if (!time) return '';
    if (Array.isArray(time)) {
      return `${String(time[0]).padStart(2, '0')}:${String(time[1]).padStart(2, '0')}`;
    }
    return time.length > 5 ? time.substring(0, 5) : time;
  }

  getStartTime(item: any): string {
    if (item.startTime) {
      return this.formatBackendTime(item.startTime);
    }
    return this.realPeriodTimes[item.startPeriod] || '';
  }

  getEndTime(item: any): string {
    if (item.endTime) {
      return this.formatBackendTime(item.endTime);
    }

    if (item.isExam && item.duration) {
      const sMins = this.timeToMinutes(this.getStartTime(item));
      const eMins = sMins + (item.duration || 60);
      const h = Math.floor(eMins / 60);
      const m = eMins % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    const endPeriod = item.endPeriod;
    if (this.periodEndTimes[endPeriod]) {
      return this.periodEndTimes[endPeriod];
    }
    const [h, m] = (this.realPeriodTimes[endPeriod] || '07:00').split(':').map(Number);
    return `${h + 1}:${m.toString().padStart(2, '0')}`;
  }

  getPeriodTime(period: number): string {
    return this.periodTimes[period] || '';
  }

  isRealToday(isoDate: string): boolean {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const dayOfMonth = d.getDate().toString().padStart(2, '0');
    const localIsoDate = `${year}-${month}-${dayOfMonth}`;
    return isoDate === localIsoDate;
  }

  getPresentCount(): number {
    if (!this.selectedSession || !this.selectedSession.students) return 0;
    return this.selectedSession.students.filter((s: any) => s.present).length;
  }

  getAbsentCount(): number {
    if (!this.selectedSession || !this.selectedSession.students) return 0;
    return this.selectedSession.students.filter((s: any) => s.absent || s.excused).length;
  }

  getStudentSessionPeriods(): number {
    if (!this.selectedSession || !this.selectedSession.students) return 0;

    // Hide until lecturer finalizes (closedAt exists)
    if (!this.selectedSession.closedAt) return 0;

    const user = this.authService.getUserFromStorage();
    const student = this.selectedSession.students.find((s: any) => s.id === (user.studentId || user.id));

    if (!student) return 0;

    const totalSessionPeriods = (this.selectedSession.endPeriod - this.selectedSession.startPeriod) + 1;

    // Logic: Total - Absent
    return Math.max(0, totalSessionPeriods - (student.sessionAbsentPeriods || 0));
  }

  getAbsentStats(): string {
    if (!this.selectedSession || !this.selectedSession.students) return '0/0/0%';
    // Find CURRENT user in student list
    const user = this.authService.getUserFromStorage();
    const student = this.selectedSession.students.find((s: any) => s.id === (user.studentId || user.id));
    if (student) {
      return `${student.absentSessions}/${student.absentPeriods}/${student.absentPercent}%`;
    }
    return '0/0/0%';
  }

  onStatusChange(student: any, status: string, isChecked: boolean, isBulk: boolean = false): void {
    if (!isBulk) {
      this.headerCheck = '';
    }

    // Reset everything first
    student.excused = false;
    student.absent = false;
    student.present = false;
    student.tempStatus = null;

    if (!isChecked && !isBulk) {
      // Toggled off
      student.sessionAbsentPeriods = 0;
      return;
    }

    // Set new status
    student[status.toLowerCase()] = true;
    student.tempStatus = status;

    if (status === 'EXCUSED' || status === 'ABSENT') {
      const totalPeriods = (this.selectedSession.endPeriod - this.selectedSession.startPeriod) + 1;
      if (!student.sessionAbsentPeriods || student.sessionAbsentPeriods === 0) {
        student.sessionAbsentPeriods = totalPeriods;
      }
    } else {
      student.sessionAbsentPeriods = 0;
    }
  }

  onPresentPeriodsChange(student: any, presentPeriods: number): void {
    if (presentPeriods === null || presentPeriods === undefined) return;
    const totalSessionPeriods = (this.selectedSession.endPeriod - this.selectedSession.startPeriod) + 1;
    student.sessionAbsentPeriods = Math.max(0, totalSessionPeriods - presentPeriods);
    // Removed auto-switching of columns to avoid UI jumping
  }
  toggleAllStatus(status: string): void {
    if (!this.selectedSession || !this.selectedSession.students) return;

    if (this.headerCheck === status) {
      // Second click on same header checkbox -> CLEAR EVERYONE
      this.headerCheck = '';
      this.selectedSession.students.forEach((student: any) => {
        student.excused = false;
        student.absent = false;
        student.present = false;
        student.tempStatus = null;
        student.sessionAbsentPeriods = 0;
      });
    } else {
      const targetStatus = status;
      this.selectedSession.students.forEach((student: any) => {
        // Pass 'true' for isBulk, and 'true' for isChecked
        this.onStatusChange(student, targetStatus, true, true);
      });
      // Set AFTER the loop
      this.headerCheck = targetStatus;
    }
  }

  onOpenAttendance(): void {
    if (!this.attendanceCodeInput.trim()) {
      this.flashMessageService.warning('Vui lòng nhập mã điểm danh!');
      return;
    }
    this.scheduleService.openAttendance(this.selectedSession.id, this.attendanceCodeInput).subscribe({
      next: () => this.flashMessageService.success('Đã mở điểm danh tự động!'),
      error: (err) => this.flashMessageService.error('Lỗi: ' + (err.error?.message || err.message))
    });
  }

  onFinalizeAutoAttendance(): void {
    if (!this.selectedSession?.attendanceCode) {
      this.flashMessageService.warning('Bạn chưa lưu từ khóa điểm danh! Vui lòng nhập mã và nhấn "Lưu từ khóa" trước.');
      return;
    }

    if (this.attendanceCodeInput !== this.selectedSession.attendanceCode) {
      this.flashMessageService.warning('Từ khóa điểm danh vừa thay đổi chưa được lưu. Hãy nhấn "Lưu từ khóa" trước khi chốt!');
      return;
    }

    this.scheduleService.finalizeAttendance(this.selectedSession.id).subscribe({
      next: () => {
        this.flashMessageService.success('Chốt danh sách thành công!');
        this.openSessionDetail(this.selectedSession.id);
      },
      error: (err) => this.flashMessageService.error('Lỗi: ' + (err.error?.message || err.message))
    });
  }

  onSaveManualAttendance(): void {
    const records = this.selectedSession.students.map((s: any) => ({
      studentId: s.id,
      status: s.tempStatus || (s.excused ? 'EXCUSED' : (s.absent ? 'ABSENT' : 'PRESENT')),
      absentPeriods: s.sessionAbsentPeriods || 0
    }));

    this.scheduleService.submitManualAttendance({
      scheduleInstanceId: this.selectedSession.id,
      records: records
    }).subscribe({
      next: () => {
        this.flashMessageService.success('Lưu điểm danh thành công!');
        this.openSessionDetail(this.selectedSession.id);
      },
      error: (err) => this.flashMessageService.error('Lỗi: ' + (err.error?.message || err.message))
    });
  }

  onSelfAttend(): void {
    if (!this.attendanceCodeForStudents.trim()) {
      this.flashMessageService.warning('Vui lòng nhập mã điểm danh!');
      return;
    }
    const user = this.authService.getUserFromStorage();
    this.scheduleService.selfAttend(this.attendanceCodeForStudents, user.studentId || user.id, this.selectedSession.id).subscribe({
      next: () => {
        this.flashMessageService.success('Điểm danh thành công!');
        // Refresh to show "✓ (Tiết ...)"
        this.openSessionDetail(this.selectedSession.id);
      },
      error: (err) => this.flashMessageService.error('Lỗi: ' + (err.error?.message || err.message))
    });
  }
}
