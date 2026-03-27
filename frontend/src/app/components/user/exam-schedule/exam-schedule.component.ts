import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../auth.service';

@Component({
  selector: 'app-user-exam-schedule',
  templateUrl: './exam-schedule.component.html'
})
export class UserExamScheduleComponent implements OnInit {
  lecturerSchedules: any[] = [];
  studentSchedules: any[] = [];
  filteredLecturerSchedules: any[] = [];
  filteredStudentSchedules: any[] = [];
  activeDropdown: string = '';
  selectedSemester: any = null;
  selectedSubject: any = null;
  searchTerm: string = '';
  userRole: string | null = null;
  currentUser: any = null;
  loading: boolean = false;
  semesters: any[] = [];
  showTable: boolean = false;

  constructor(private http: HttpClient, private authService: AuthService) { }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.activeDropdown = '';
  }

  toggleDropdown(name: string, event: Event): void {
    event.stopPropagation();
    this.activeDropdown = this.activeDropdown === name ? '' : name;
  }

  ngOnInit(): void {
    this.userRole = this.authService.getRole();
    this.currentUser = this.authService.getUserFromStorage();
    this.loadSemesters();
  }

  loadSemesters(): void {
    this.http.get<any[]>('http://localhost:8001/api/semesters').subscribe(res => {
      this.semesters = res
        .filter((s: any) => s.semesterStatus === 'ONGOING' || s.semesterStatus === 'FINISHED')
        .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      // KHÔNG tự động tải dữ liệu — chờ user chọn học kỳ
    });
  }

  onSemesterSelect(sem: any): void {
    this.selectedSemester = sem;
    this.selectedSubject = null; // Reset học phần khi đổi học kỳ
    this.activeDropdown = '';
    this.showTable = false;
    // Tải dữ liệu theo học kỳ mới chọn
    if (this.userRole === 'LECTURER') {
      this.loadLecturerSchedules();
    } else if (this.userRole === 'STUDENT') {
      this.loadStudentSchedules();
    }
  }

  loadLecturerSchedules(): void {
    this.loading = true;
    this.http.get<any[]>(`http://localhost:8001/api/user/exam-schedules/lecturer/${this.currentUser.id}`)
      .subscribe({
        next: (res) => {
          this.lecturerSchedules = res;
          this.applyFilter();
          this.loading = false;
        },
        error: () => this.loading = false
      });
  }

  loadStudentSchedules(): void {
    this.loading = true;
    this.http.get<any[]>(`http://localhost:8001/api/user/exam-schedules/student/${this.currentUser.id}`)
      .subscribe({
        next: (res) => {
          this.studentSchedules = res;
          this.applyFilter();
          this.loading = false;
        },
        error: () => this.loading = false
      });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();

    let baseLecturer = this.lecturerSchedules;
    let baseStudent = this.studentSchedules;

    // Lọc theo học kỳ
    if (this.selectedSemester) {
      if (this.userRole === 'LECTURER') {
        baseLecturer = baseLecturer.filter((s: any) => s.courseClass?.semesterId === this.selectedSemester.id);
      } else {
        baseStudent = baseStudent.filter((s: any) => s.semesterId === this.selectedSemester.id);
      }
    }

    // Lọc theo học phần
    if (this.selectedSubject) {
      if (this.userRole === 'LECTURER') {
        baseLecturer = baseLecturer.filter((s: any) => s.id === this.selectedSubject.id);
      } else {
        baseStudent = baseStudent.filter((s: any) => s.subjectCode === this.selectedSubject.subjectCode);
      }
    }

    if (!term) {
      this.filteredLecturerSchedules = [...baseLecturer];
      this.filteredStudentSchedules = [...baseStudent];
      return;
    }

    if (this.userRole === 'LECTURER') {
      this.filteredLecturerSchedules = baseLecturer.filter((s: any) =>
        s.courseClass?.classCode?.toLowerCase().includes(term) ||
        s.courseClass?.subjectName?.toLowerCase().includes(term)
      );
    } else {
      this.filteredStudentSchedules = baseStudent.filter((s: any) =>
        s.subjectCode?.toLowerCase().includes(term) ||
        s.subjectName?.toLowerCase().includes(term)
      );
    }
  }

  // Danh sách học phần THUỘC HỌC KỲ đang chọn (dùng cho dropdown)
  get semesterSubjects(): any[] {
    if (this.userRole === 'LECTURER') {
      return this.lecturerSchedules.filter((s: any) =>
        !this.selectedSemester || s.courseClass?.semesterId === this.selectedSemester.id
      );
    } else {
      return this.studentSchedules.filter((s: any) =>
        !this.selectedSemester || s.semesterId === this.selectedSemester.id
      );
    }
  }

  onSubjectSelect(subject: any): void {
    this.selectedSubject = subject;
    this.applyFilter();
    this.showTable = true;
    this.activeDropdown = '';
  }

  getExamTypeLabel(type: string): string {
    const map: any = { 'MIDTERM': 'Giữa kỳ', 'FINAL': 'Cuối kỳ', 'RETAKE': 'Thi lại' };
    return map[type] || type;
  }
}
