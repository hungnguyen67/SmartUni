import { Component, OnInit } from '@angular/core';
import { CourseClassService } from '../../../services/course-class.service';
import { RegistrationService } from '../../../services/registration.service';
import { SemesterService } from '../../../services/semester.service';
import { AuthService } from '../../../auth.service';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';

@Component({
    selector: 'app-registration',
    templateUrl: './registration.component.html'
})
export class RegistrationComponent implements OnInit {
    semesters: any[] = [];
    selectedSemesterId: number | null = null;
    availableClasses: any[] = [];
    registeredClasses: any[] = [];
    mandatoryClasses: any[] = [];
    electiveClasses: any[] = [];
    currentUser: any = null;
    loading = false;
    registrationType: string = 'STANDARD';
    studentProfile: any = null;
    selectedProgram: string = 'Đang tải...';

    isClassSelectionMode: boolean = false;
    currentSubject: any = null;
    subjectClasses: any[] = [];
    selectedClassId: number | null = null;

    constructor(
        private courseClassService: CourseClassService,
        private registrationService: RegistrationService,
        private semesterService: SemesterService,
        private auth: AuthService,
        private flashMessage: FlashMessageService
    ) { }

    ngOnInit(): void {
        this.currentUser = this.auth.getUserFromStorage();
        this.loadSemesters();
        this.loadStudentProfile();
    }

    loadStudentProfile() {
        this.auth.getProfile().subscribe({
            next: (res) => {
                this.studentProfile = res;
                if (res.curriculumName) {
                    this.selectedProgram = res.curriculumName;
                } else if (res.majorName) {
                    this.selectedProgram = res.majorName;
                }
            },
            error: (err) => console.error('Error fetching student profile', err)
        });
    }

    loadSemesters() {
        this.semesterService.getAllSemesters().subscribe(res => {
            this.semesters = res;
            if (this.semesters.length > 0) {
                const ongoing = this.semesters.find(s => s.semesterStatus === 'ONGOING' || s.semesterStatus === 'UPCOMING');
                this.selectedSemesterId = ongoing ? ongoing.id : this.semesters[0].id;
                this.onSemesterChange();
            }
        });
    }

    onSemesterChange() {
        if (this.selectedSemesterId) {
            this.loadAvailableClasses();
            this.loadRegisteredClasses();
        }
    }

    loadAvailableClasses() {
        if (!this.selectedSemesterId || !this.currentUser) return;
        this.loading = true;
        this.courseClassService.getGroupedSubjects(this.selectedSemesterId, this.currentUser.id).subscribe({
            next: (res) => {
                this.availableClasses = res;
                this.mandatoryClasses = res.filter((s: any) => s.required);
                this.electiveClasses = res.filter((s: any) => !s.required);
                this.loading = false;
            },
            error: (err) => {
                this.flashMessage.error('Lỗi khi tải danh sách học phần');
                this.loading = false;
            }
        });
    }

    loadRegisteredClasses() {
        if (!this.selectedSemesterId || !this.currentUser) return;
        this.registrationService.getRegistrationsByStudentAndSemester(this.currentUser.id, this.selectedSemesterId).subscribe(res => {
            this.registeredClasses = (res || []).filter(reg => {
                const status = (reg.classStatus || '').toUpperCase();
                return status !== 'CLOSED' && status !== 'CANCELLED';
            });
        });
    }

    isRegistered(classId: number): boolean {
        return this.registeredClasses.some(reg => reg.classId === classId);
    }

    onSelectSubject(subject: any) {
        if (!this.selectedSemesterId) return;
        this.loading = true;
        this.currentSubject = subject;
        this.courseClassService.getClassDetails(this.selectedSemesterId, subject.subjectId).subscribe({
            next: (res) => {
                const filtered = (res || []).filter((cc: any) => {
                    const status = (cc.classStatus || '').toUpperCase();
                    return status === 'OPEN_REGISTRATION' || status === 'FULL';
                });

                if (filtered.length === 0) {
                    this.flashMessage.error('Học phần này hiện không có lớp mở đăng ký');
                    this.loading = false;
                    return;
                }

                this.subjectClasses = filtered;
                this.isClassSelectionMode = true;
                this.loading = false;
            },
            error: (err) => {
                this.flashMessage.error('Lỗi khi tải danh sách lớp học');
                this.loading = false;
            }
        });
    }

    onBackToSubjects() {
        this.isClassSelectionMode = false;
        this.currentSubject = null;
        this.subjectClasses = [];
        this.selectedClassId = null;
    }

    register() {
        if (!this.currentUser || !this.selectedClassId) {
            this.flashMessage.warning('Vui lòng chọn một lớp học phần');
            return;
        }
        this.registrationService.register(this.currentUser.id, this.selectedClassId).subscribe({
            next: (res) => {
                this.flashMessage.success('Đăng ký học phần thành công!');
                this.isClassSelectionMode = false;
                this.loadRegisteredClasses();
                this.loadAvailableClasses();
            },
            error: (err) => {
                const errorMsg = err.error?.message || 'Có lỗi xảy ra khi đăng ký';
                this.flashMessage.error(errorMsg);
            }
        });
    }

    formatSchedule(schedules: any[], startDate?: string, endDate?: string): string {
        if (!schedules || schedules.length === 0) return 'Chưa có lịch';

        const dayNames: { [key: number]: string } = {
            2: 'Thứ Hai', 3: 'Thứ Ba', 4: 'Thứ Tư', 5: 'Thứ Năm', 6: 'Thứ Sáu', 7: 'Thứ Bảy', 8: 'Chủ Nhật'
        };

        const periodTimes: { [key: number]: string } = {
            1: '07:00', 2: '07:55', 3: '08:50', 4: '09:45', 5: '10:40',
            6: '13:00', 7: '13:55', 8: '14:50', 9: '15:45', 10: '16:40',
            11: '17:35', 12: '18:30', 13: '19:25', 14: '20:20', 15: '21:15', 16: '22:10', 17: '23:05'
        };

        const getEndTime = (startTime: string) => {
            if (!startTime) return '??:??';
            const [h, m] = startTime.split(':').map(Number);
            const totalMinutes = h * 60 + m + 50;
            const endH = Math.floor(totalMinutes / 60);
            const endM = totalMinutes % 60;
            return `${endH < 10 ? '0' + endH : endH}:${endM < 10 ? '0' + endM : endM}`;
        };

        const dateRange = (startDate && endDate)
            ? `, ${new Date(startDate).toLocaleDateString('en-GB')}->${new Date(endDate).toLocaleDateString('en-GB')}`
            : '';

        const scheduleStrings = schedules.map(s => {
            const dayName = dayNames[s.dayOfWeek] || `Thứ ${s.dayOfWeek}`;

            const formatTimeStr = (timeStr: string) => {
                if (!timeStr) return '';
                const parts = timeStr.split(':');
                return `${parts[0]}g${parts[1]}`;
            };

            let timeDisplay = '';
            if (s.startTime && s.endTime) {
                timeDisplay = `${formatTimeStr(s.startTime)} - ${formatTimeStr(s.endTime)}`;
            } else if (s.startPeriod && s.endPeriod) {
                const start = periodTimes[s.startPeriod] || '??:??';
                const end = getEndTime(periodTimes[s.endPeriod]);
                timeDisplay = `${start.replace(':', 'g')} - ${end.replace(':', 'g')}`;
            } else {
                timeDisplay = 'Chưa xác định';
            }

            return `${dayName}, ${timeDisplay}, ${s.roomName || 'N/A'}`;
        });

        const uniqueSchedules = [...new Set(scheduleStrings)];

        return uniqueSchedules.join('; ') + dateRange;
    }

    drop(registrationId: number) {
        if (!confirm('Bạn có chắc chắn muốn hủy đăng ký học phần này?')) return;
        this.registrationService.drop(registrationId).subscribe({
            next: () => {
                this.flashMessage.success('Hủy đăng ký thành công!');
                this.loadRegisteredClasses();
                this.loadAvailableClasses();
            },
            error: (err) => {
                this.flashMessage.error('Lỗi khi hủy đăng ký');
            }
        });
    }

    changeClass(reg: any) {
        if (!reg.subjectId) return;
        const mockSubject = {
            subjectId: reg.subjectId,
            subjectName: reg.subjectName
        };
        this.onSelectSubject(mockSubject);
    }

    getSelectedSemesterName(): string {
        const semester = this.semesters.find(s => s.id == this.selectedSemesterId);
        if (!semester) return 'HỌC KỲ ...';
        return `ĐĂNG KÝ HỌC PHẦN ${semester.name}, ${semester.academicYear}`.toUpperCase();
    }

    getTotalCredits(): number {
        return this.registeredClasses.reduce((sum, item) => sum + (item.credits || 0), 0);
    }
}
