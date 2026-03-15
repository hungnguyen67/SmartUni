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
    currentUser: any = null;
    loading = false;

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
    }

    loadSemesters() {
        this.semesterService.getAllSemesters().subscribe(res => {
            this.semesters = res;
            if (this.semesters.length > 0) {
                // Cố gắng chọn học kỳ đang diễn ra hoặc học kỳ mới nhất
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
        if (!this.selectedSemesterId) return;
        this.loading = true;
        this.courseClassService.getClassesBySemester(this.selectedSemesterId).subscribe({
            next: (res) => {
                this.availableClasses = res;
                this.loading = false;
            },
            error: (err) => {
                this.flashMessage.error('Lỗi khi tải danh sách lớp học');
                this.loading = false;
            }
        });
    }

    loadRegisteredClasses() {
        if (!this.selectedSemesterId || !this.currentUser) return;
        this.registrationService.getRegistrationsByStudentAndSemester(this.currentUser.id, this.selectedSemesterId).subscribe(res => {
            this.registeredClasses = res;
        });
    }

    isRegistered(classId: number): boolean {
        return this.registeredClasses.some(reg => reg.classId === classId);
    }

    register(classId: number) {
        if (!this.currentUser) return;
        this.registrationService.register(this.currentUser.id, classId).subscribe({
            next: (res) => {
                this.flashMessage.success('Đăng ký học phần thành công!');
                this.loadRegisteredClasses();
                this.loadAvailableClasses(); // Cập nhật sĩ số
            },
            error: (err) => {
                const errorMsg = err.error?.message || 'Có lỗi xảy ra khi đăng ký';
                this.flashMessage.error(errorMsg);
            }
        });
    }

    drop(registrationId: number) {
        if (!confirm('Bạn có chắc chắn muốn hủy đăng ký học phần này?')) return;
        this.registrationService.drop(registrationId).subscribe({
            next: () => {
                this.flashMessage.success('Hủy đăng ký thành công!');
                this.loadRegisteredClasses();
                this.loadAvailableClasses(); // Cập nhật sĩ số
            },
            error: (err) => {
                this.flashMessage.error('Lỗi khi hủy đăng ký');
            }
        });
    }
}
