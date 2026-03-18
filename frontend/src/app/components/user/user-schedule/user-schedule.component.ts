import { Component, OnInit, Renderer2 } from '@angular/core';
import { ScheduleService } from '../../../services/schedule.service';
import { SemesterService } from '../../../services/semester.service';
import { AuthService } from '../../../auth.service';

@Component({
  selector: 'app-user-schedule',
  templateUrl: './user-schedule.component.html'
})
export class UserScheduleComponent implements OnInit {
  semesters: any[] = [];
  selectedSemesterId: number | null = null;
  scheduleItems: any[] = [];
  loading: boolean = false;
  errorMessage: string = '';
  isLecturer: boolean = false;
  showModal: boolean = false;
  selectedSession: any = null;
  loadingModal: boolean = false;
  periods = Array.from({ length: 17 }, (_, i) => i + 1);
  periodTimes: { [key: number]: string } = {
    1: '07:00', 2: '08:00', 3: '09:00', 4: '10:00', 5: '11:00',
    6: '12:00', 7: '13:00', 8: '14:00', 9: '15:00', 10: '16:00',
    11: '17:00', 12: '18:00', 13: '19:00', 14: '20:00', 15: '21:00', 16: '22:00', 17: '23:00'
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
    private renderer: Renderer2
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

    scheduleObservable.subscribe({
      next: (res) => {
        this.scheduleItems = res;
        this.loading = false;
        if (this.scheduleItems.length === 0) {
          this.errorMessage = 'Không có lịch nào trong học kỳ này.';
        }
      },
      error: (err) => {
        console.error('Lỗi tải lịch:', err);
        this.errorMessage = 'Đã xảy ra lỗi khi tải lịch. Vui lòng thử lại sau.';
        this.loading = false;
      }
    });
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
    const span = (item.endPeriod - item.startPeriod) + 1;
    return span * 64;
  }

  getSubjectColor(subjectName: string): string {
    const colors = ['#f97316', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981'];
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
      hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getEndTime(item: any): string {
    const endPeriod = item.endPeriod;
    if (this.periodTimes[endPeriod + 1]) {
      return this.periodTimes[endPeriod + 1];
    }
    const [h, m] = this.periodTimes[endPeriod].split(':').map(Number);
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
      alert('Vui lòng nhập mã điểm danh!');
      return;
    }
    this.scheduleService.openAttendance(this.selectedSession.id, this.attendanceCodeInput).subscribe({
      next: () => alert('Đã mở điểm danh tự động!'),
      error: (err) => alert('Lỗi: ' + (err.error?.message || err.message))
    });
  }

  onFinalizeAutoAttendance(): void {
    if (!confirm('Bạn có chắc chắn muốn chốt danh sách điểm danh? Những sinh viên chưa điểm danh sẽ bị đánh vắng.')) {
      return;
    }
    this.scheduleService.finalizeAttendance(this.selectedSession.id).subscribe({
      next: () => {
        alert('Chốt danh sách thành công!');
        this.openSessionDetail(this.selectedSession.id);
      },
      error: (err) => alert('Lỗi: ' + (err.error?.message || err.message))
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
        alert('Lưu điểm danh thành công!');
        this.openSessionDetail(this.selectedSession.id);
      },
      error: (err) => alert('Lỗi: ' + (err.error?.message || err.message))
    });
  }

  onSelfAttend(): void {
    if (!this.attendanceCodeForStudents.trim()) {
      alert('Vui lòng nhập mã điểm danh!');
      return;
    }
    const user = this.authService.getUserFromStorage();
    this.scheduleService.selfAttend(this.attendanceCodeForStudents, user.studentId || user.id, this.selectedSession.id).subscribe({
      next: () => {
        alert('Điểm danh thành công!');
        // Refresh to show "✓ (Tiết ...)"
        this.openSessionDetail(this.selectedSession.id);
      },
      error: (err) => alert('Lỗi: ' + (err.error?.message || err.message))
    });
  }
}
