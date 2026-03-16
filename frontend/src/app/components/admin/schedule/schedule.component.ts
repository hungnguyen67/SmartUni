import { Component, OnInit, HostListener } from '@angular/core';
import { ScheduleService, ConflictInfo } from '../../../services/schedule.service';
import { SemesterService, Semester } from '../../../services/semester.service';
import { CourseClassService, CourseClass } from '../../../services/course-class.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MajorService, MajorDTO } from '../../../services/major.service';
import { AdministrativeClassService, AdministrativeClassDTO } from '../../../services/administrative-class.service';
import { LecturerService, LecturerDTO } from '../../../services/lecturer.service';
import { forkJoin, map } from 'rxjs';
import { FlashMessageService } from '../../../shared/components/flash-message/flash-message.component';

@Component({
    selector: 'app-schedule',
    templateUrl: './schedule.component.html'
})
export class ScheduleComponent implements OnInit {
    currentDate = new Date();
    weekDays: any[] = [];
    viewMode: 'GRID' | 'LIST' = 'GRID';
    activeBottomTab: 'CLASSES' | 'SCHEDULED' = 'CLASSES';
    timeSlots = [
        '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    semesters: Semester[] = [];
    selectedSemesterId: number | null = null;

    majors: MajorDTO[] = [];
    selectedMajorId: number | null = null;

    cohorts: number[] = [];
    selectedCohort: number | null = null;

    adminClasses: AdministrativeClassDTO[] = [];
    filteredAdminClasses: AdministrativeClassDTO[] = [];
    selectedAdminClass: AdministrativeClassDTO | null = null;
    isBacklogVisible: boolean = false;

    lecturers: LecturerDTO[] = [];

    classes: CourseClass[] = [];
    scheduleItems: any[] = [];
    allInstances: any[] = [];
    selectedScheduleItem: any = null;
    activeDropdown: string = '';
    searchTerm: string = '';

    loading = false;
    conflicts: ConflictInfo[] = [];

    isResizing = false;
    resizingItem: any = null;
    resizingItemObject: any = null; // Snapshot của item tại thời điểm bắt đầu resize
    resizingOriginalDuration: number = 0;
    newEndPeriod: number | null = null;
    periods: number[] = Array.from({ length: 17 }, (_, i) => i + 1);

    showPatternModal = false;
    newPattern: any = {
        dayOfWeek: 2,
        startPeriod: 1,
        endPeriod: 3,
        fromWeek: 1,
        toWeek: 15,
        roomName: '',
        sessionType: 'THEORY'
    };

    contextMenu = {
        visible: false,
        x: 0,
        y: 0,
        item: null as any
    };

    clipboardItem: any = null;

    showCopyModal = false;
    copyOptions = {
        type: '',
        fromWeek: null as number | null,
        toWeek: null as number | null,
        isAlternateWeek: false,
        alternateWeekCount: 1
    };

    constructor(
        private scheduleService: ScheduleService,
        private semesterService: SemesterService,
        private courseClassService: CourseClassService,
        private majorService: MajorService,
        private adminClassService: AdministrativeClassService,
        private lecturerService: LecturerService,
        private flashMessage: FlashMessageService
    ) { }

    ngOnInit(): void {
        this.loadSemesters();
        this.loadMajors();
        this.loadAdminClasses();
        this.loadLecturers();
        this.updateWeekDays();
    }
    private draggedCourseClass: CourseClass | null = null;

    loadSemesters(): void {
        this.semesterService.getAllSemesters().subscribe(res => {
            this.semesters = res;
            if (this.semesters.length > 0) {
                const ongoing = this.semesters.find(s => s.semesterStatus === 'ONGOING');
                this.selectedSemesterId = ongoing ? ongoing.id : this.semesters[0].id;
            }
        });
    }

    loadMajors(): void {
        this.majorService.getMajors().subscribe(res => this.majors = res);
    }

    loadAdminClasses(): void {
        this.adminClassService.getClasses().subscribe(res => {
            this.adminClasses = res;
            this.cohorts = [...new Set(res.map(c => c.cohort))].sort((a, b) => b - a);
            this.onFilterChange();
        });
    }

    loadLecturers(): void {
        this.lecturerService.getLecturers().subscribe(res => this.lecturers = res);
    }

    onFilterChange(): void {
        if (!this.selectedMajorId && !this.selectedCohort && !this.searchTerm) {
            this.filteredAdminClasses = [];
            return;
        }

        this.filteredAdminClasses = this.adminClasses.filter(c => {
            const matchesMajor = !this.selectedMajorId || c.majorId === this.selectedMajorId;
            const matchesCohort = !this.selectedCohort || c.cohort === this.selectedCohort;
            const matchesSearch = !this.searchTerm ||
                c.classCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (c.className && c.className.toLowerCase().includes(this.searchTerm.toLowerCase()));
            return matchesMajor && matchesCohort && matchesSearch;
        });
    }

    getRelativeSemester(ac: AdministrativeClassDTO): number | string {
        if (!this.selectedSemesterId || !ac.cohort) return '-';
        const semester = this.semesters.find(s => s.id === this.selectedSemesterId);
        if (!semester) return '-';

        const startYear = parseInt(semester.academicYear.split('-')[0]);
        const semesterOrder = semester.semesterOrder || 1;

        return (startYear - ac.cohort) * 2 + semesterOrder;
    }

    onSemesterChange(): void {
        this.onFilterChange();
        if (this.selectedAdminClass && this.selectedSemesterId) {
            this.loadBacklog();
            this.loadScheduleForAdminClass();
        }
    }

    selectAdminClass(ac: AdministrativeClassDTO): void {
        this.selectedAdminClass = ac;
        this.goToWeekOne();
        if (this.selectedSemesterId) {
            this.loadBacklog();
            this.loadScheduleForAdminClass();
        }
    }

    onAdminClassDoubleClick(ac: AdministrativeClassDTO): void {
        this.selectedAdminClass = ac;
        this.isBacklogVisible = true;
        this.goToWeekOne();
        if (this.selectedSemesterId) {
            this.loadBacklog();
            this.loadScheduleForAdminClass();
        }
    }

    goToWeekOne(): void {
        if (!this.selectedSemesterId) return;
        const semester = this.semesters.find(s => s.id === this.selectedSemesterId);
        if (semester && semester.startDate) {
            const start = new Date(semester.startDate);
            const day = start.getDay();
            const diff = start.getDate() - (day === 0 ? 6 : day - 1);

            const startMonday = new Date(start.getFullYear(), start.getMonth(), diff);

            if (day !== 1) {
                startMonday.setDate(startMonday.getDate() + 7);
            }

            this.currentDate = startMonday;
            this.updateWeekDays();
        }
    }

    loadBacklog(): void {
        if (!this.selectedAdminClass || !this.selectedSemesterId) return;
        this.courseClassService.getClassesBySemester(this.selectedSemesterId).subscribe(res => {
            this.classes = res.filter(c =>
                c.targetClassName === this.selectedAdminClass!.classCode ||
                (c.classCode && c.classCode.includes(this.selectedAdminClass!.classCode))
            );
        });
    }

    loadScheduleForAdminClass(): void {
        if (!this.selectedAdminClass || !this.selectedSemesterId) return;
        this.loading = true;

        this.courseClassService.getClassesBySemester(this.selectedSemesterId).subscribe(classes => {
            const targetClasses = classes.filter(c =>
                c.targetClassName === this.selectedAdminClass!.classCode ||
                (c.classCode && c.classCode.includes(this.selectedAdminClass!.classCode))
            );

            this.classes = targetClasses;

            if (targetClasses.length === 0) {
                this.scheduleItems = [];
                this.allInstances = [];
                this.loading = false;
                return;
            }

            const requests = targetClasses.map(c =>
                this.scheduleService.getScheduleByCourseClass(c.id).pipe(
                    map(data => ({ class: c, instances: data }))
                )
            );

            forkJoin(requests).subscribe(results => {
                const newAllInstances: any[] = [];
                const newScheduleItems: any[] = [];

                results.forEach(res => {
                    newAllInstances.push(...res.instances);
                    newScheduleItems.push(...this.mapBackendData(res.instances, res.class));
                });

                this.allInstances = newAllInstances;
                this.scheduleItems = newScheduleItems;

                if (this.selectedScheduleItem) {
                    const updated = this.scheduleItems.find(i =>
                        i.scheduleDate === this.selectedScheduleItem.scheduleDate &&
                        i.startPeriod === this.selectedScheduleItem.startPeriod
                    );
                    if (updated) this.selectedScheduleItem = updated;
                }
                this.loading = false;
            });
        });
    }

    onClassChange(): void {
    }

    loadSchedule(): void {
        if (!this.selectedAdminClass) {
            this.scheduleItems = [];
            this.allInstances = [];
            this.loading = false;
            return;
        }
        this.loadScheduleForAdminClass();
    }

    onDateSelected(date: Date) {
        this.currentDate = date;
        this.updateWeekDays();
    }

    updateWeekDays() {
        const curr = new Date(this.currentDate);
        const day = curr.getDay();
        const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(curr.setDate(diff));

        const labels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
        const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        this.weekDays = names.map((name, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return {
                name: name,
                label: labels[i],
                date: this.formatDate(d),
                isoDate: this.toISODateString(d),
                fullDate: d
            };
        });
    }

    getDayOfWeekName(dateStr: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[date.getDay()];
    }

    getDayOfWeekNumber(dateStr: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = date.getDay(); // 0 is Sunday
        return day === 0 ? 'CN' : (day + 1).toString();
    }

    formatDate(date: Date): string {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    }

    toISODateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    isSelectedDay(dayName: string): boolean {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[this.currentDate.getDay()] === dayName;
    }

    isRealToday(isoDate: string): boolean {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}` === isoDate;
    }

    formatBackendDate(date: any): string {
        if (!date) return '';
        if (Array.isArray(date)) {
            return `${date[0]}-${String(date[1]).padStart(2, '0')}-${String(date[2]).padStart(2, '0')}`;
        }
        return date.toString().split('T')[0];
    }

    formatBackendTime(time: any): string {
        if (!time) return '';
        if (Array.isArray(time)) {
            return `${String(time[0]).padStart(2, '0')}:${String(time[1]).padStart(2, '0')}`;
        }
        return time.length > 5 ? time.substring(0, 5) : time;
    }

    mapBackendData(data: any[], courseClass?: CourseClass): any[] {
        const typeColors: { [key: string]: string } = {
            'THEORY': 'bg-blue-600',
            'PRACTICE': 'bg-green-600',
            'EXAM_THEORY': 'bg-yellow-500',
            'EXAM_PRACTICE': 'bg-orange-500',
            'CANCELLED': 'bg-red-500'
        };

        const periodTimes: { [key: number]: string } = {
            1: '07:00', 2: '07:55', 3: '08:50', 4: '09:45', 5: '10:40',
            6: '13:00', 7: '13:55', 8: '14:50', 9: '15:45', 10: '16:40',
            11: '17:35', 12: '18:30', 13: '19:25', 14: '20:20', 15: '21:15', 16: '22:10', 17: '23:05'
        };

        return data.map((item) => {
            const startTime = this.formatBackendTime(item.startTime || periodTimes[item.startPeriod] || '07:00');
            const endTime = this.formatBackendTime(item.endTime || periodTimes[item.endPeriod] || '17:35');
            const scheduleDate = this.formatBackendDate(item.scheduleDate);

            const startMinutes = this.timeToMinutes(startTime);
            const endMinutes = this.timeToMinutes(endTime);

            return {
                ...item,
                courseClass: courseClass,
                title: item.subjectName || 'N/A',
                subjectCode: item.subjectCode || '',
                classCode: item.classCode || courseClass?.classCode || '',
                lecturerName: item.lecturerName || courseClass?.lecturerName || '',
                room: item.roomName,
                time: `${startTime} - ${endTime}`,
                slot: `Tiết ${item.startPeriod}-${item.endPeriod}`,
                scheduleDate: scheduleDate,
                startTime: startTime,
                endTime: endTime,
                durationMinutes: endMinutes - startMinutes,
                color: item.status === 'CANCELLED' ? typeColors['CANCELLED'] : (typeColors[item.type] || 'bg-slate-500'),
                textColor: 'text-white',
                status: item.status,
                type: item.type,
                targetClassName: item.targetClassName || courseClass?.targetClassName || '',
                majorName: courseClass?.majorName || '',
                credits: courseClass?.credits || 0,
                maxStudents: courseClass?.maxStudents || 0,
                dayOfWeekName: this.getDayOfWeekName(scheduleDate),
                dayOfWeekNumber: this.getDayOfWeekNumber(scheduleDate)
            };
        });
    }

    timeToMinutes(time: string): number {
        if (!time || typeof time !== 'string') return 0;
        const parts = time.split(':');
        if (parts.length < 2) return 0;
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        return hours * 60 + (minutes || 0);
    }

    calculateHeight(durationMinutes: number): number {
        return (durationMinutes / 60) * 100;
    }

    calculateTopOffset(startTime: string, slotTime: string): number {
        return ((this.timeToMinutes(startTime) - this.timeToMinutes(slotTime)) / 60) * 100;
    }

    getItemsForDayAndPeriod(dayDateStr: string, period: number): any[] {
        return this.scheduleItems.filter(item => {
            return item.scheduleDate === dayDateStr && item.startPeriod === period;
        });
    }

    selectScheduleItem(item: any): void {
        this.selectedScheduleItem = item;
        if (item && item.scheduleDate) {
            const parts = item.scheduleDate.split('-');
            if (parts.length === 3) {
                this.currentDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                this.updateWeekDays();
            }
        }
    }

    onItemContextMenu(event: MouseEvent, item: any): void {
        event.preventDefault();
        event.stopPropagation();

        this.selectScheduleItem(item);

        this.contextMenu = {
            visible: true,
            x: event.clientX,
            y: event.clientY,
            item: item
        };
    }

    closeContextMenu(): void {
        this.contextMenu.visible = false;
    }

    copyScheduleItem(): void {
        if (!this.contextMenu.item) return;
        this.clipboardItem = { ...this.contextMenu.item };
        this.closeContextMenu();

        const currentWeek = this.getCurrentWeek();
        this.copyOptions.fromWeek = currentWeek !== null ? currentWeek + 1 : null;
        this.copyOptions.toWeek = currentWeek !== null ? currentWeek + 1 : null;
        this.copyOptions.type = '';
        this.copyOptions.isAlternateWeek = false;
        this.copyOptions.alternateWeekCount = 1;

        this.showCopyModal = true;
    }

    closeCopyModal(): void {
        this.showCopyModal = false;
        this.clipboardItem = null;
    }

    submitCopySchedule(): void {
        if (!this.clipboardItem || !this.clipboardItem.classId) return;

        if (!this.copyOptions.type) {
            alert('Vui lòng chọn một tùy chọn sao chép!');
            return;
        }

        const currentWeek = this.getCurrentWeek();
        if (currentWeek === null) {
            alert('Lịch học hiện tại nằm ngoài khoảng thời gian học kỳ!');
            return;
        }

        const classId = this.clipboardItem.classId;
        const itemDate = new Date(this.clipboardItem.scheduleDate);
        let dayOfWeekInt = itemDate.getDay() + 1;
        if (dayOfWeekInt === 1) dayOfWeekInt = 8;

        const patternData = {
            dayOfWeek: dayOfWeekInt,
            startPeriod: this.clipboardItem.startPeriod,
            endPeriod: this.clipboardItem.endPeriod,
            roomName: this.clipboardItem.room || 'Chưa xếp',
            sessionType: this.clipboardItem.type || 'THEORY'
        };

        let fromWeek = currentWeek + 1;
        let toWeek = currentWeek + 1;

        if (this.copyOptions.type === 'NEXT_WEEK') {
            fromWeek = currentWeek + 1;
            toWeek = currentWeek + 1;
        } else if (this.copyOptions.type === 'RANGE') {
            fromWeek = this.copyOptions.fromWeek || (currentWeek + 1);
            toWeek = this.copyOptions.toWeek || (currentWeek + 1);
        } else if (this.copyOptions.type === 'ALL') {
            let remainingPeriods = 0;
            const courseClass = this.classes.find(c => c.id === classId);
            if (courseClass) {
                remainingPeriods = this.getRemainingPeriods(courseClass);
            }

            if (remainingPeriods <= 0) {
                return;
            }

            const periodsPerPattern = patternData.endPeriod - patternData.startPeriod + 1;
            const weeksNeeded = Math.ceil(remainingPeriods / periodsPerPattern);

            fromWeek = currentWeek + 1;
            if (this.copyOptions.isAlternateWeek) {
                const step = (this.copyOptions.alternateWeekCount || 1) + 1;
                toWeek = fromWeek + (weeksNeeded - 1) * step;
            } else {
                toWeek = fromWeek + weeksNeeded - 1;
            }
        }

        // Kiểm tra xem toWeek có vượt quá thời gian học kỳ không
        if (this.selectedSemesterId && this.semesters.length > 0) {
            const semester = this.semesters.find(s => s.id === this.selectedSemesterId);
            if (semester && semester.startDate && semester.endDate) {
                const start = new Date(semester.startDate);
                const end = new Date(semester.endDate);

                const day = start.getDay();
                const diff = start.getDate() - (day === 0 ? 6 : day - 1);
                const startMonday = new Date(start.getFullYear(), start.getMonth(), diff);
                startMonday.setHours(0, 0, 0, 0);

                const endDay = end.getDay();
                const endDiff = end.getDate() - (endDay === 0 ? -6 : 1);
                const endSunday = new Date(end.getFullYear(), end.getMonth(), endDiff);
                endSunday.setHours(23, 59, 59, 999);

                const timeDiff = endSunday.getTime() - startMonday.getTime();
                const totalWeeks = Math.round(timeDiff / (7 * 24 * 60 * 60 * 1000)) + 1;

                if (toWeek > totalWeeks) {
                    toWeek = totalWeeks;
                }
            }
        }

        if (fromWeek > toWeek) {
            alert('Tuần bắt đầu không thể lớn hơn tuần kết thúc!');
            return;
        }

        const patternsToCreate = [];

        if (this.copyOptions.isAlternateWeek) {
            const step = (this.copyOptions.alternateWeekCount || 1) + 1;
            for (let w = fromWeek; w <= toWeek; w += step) {
                const pat = { ...patternData, fromWeek: w, toWeek: w };
                patternsToCreate.push(pat);
            }
        } else {
            const pat = { ...patternData, fromWeek: fromWeek, toWeek: toWeek };
            patternsToCreate.push(pat);
        }

        if (patternsToCreate.length > 0) {
            this.scheduleService.addPatternsBulk(classId, patternsToCreate).subscribe({
                next: () => {
                    this.loadScheduleForAdminClass();
                    this.closeCopyModal();
                },
                error: (err) => {
                    console.error('Lỗi khi sao chép lịch học', err);
                    this.flashMessage.handleError(err);
                }
            });
        }
    }

    deleteScheduleItem(): void {
        if (!this.contextMenu.item || !this.contextMenu.item.patternId) return;

        const currentWeek = this.getCurrentWeek();
        if (currentWeek === null) {
            alert('Lịch học hiện tại nằm ngoài khoảng thời gian học kỳ!');
            return;
        }

        const item = this.contextMenu.item;
        if (confirm(`Bạn có chắc muốn xóa lịch học môn [${item.title}] trong tuần này?`)) {
            this.scheduleService.deletePatternSingle(item.patternId, currentWeek).subscribe({
                next: () => {
                    if (this.selectedScheduleItem?.id === item.id) {
                        this.selectedScheduleItem = null;
                    }
                    this.loadScheduleForAdminClass();
                    this.closeContextMenu();
                },
                error: (err) => {
                    this.flashMessage.handleError(err);
                }
            });
        }
    }

    deleteScheduleForward(): void {
        if (!this.contextMenu.item || !this.contextMenu.item.patternId) return;

        const currentWeek = this.getCurrentWeek();
        if (currentWeek === null) {
            alert('Lịch học hiện tại nằm ngoài khoảng thời gian học kỳ!');
            return;
        }

        const item = this.contextMenu.item;
        if (confirm(`Bạn có chắc muốn xóa TẤT CẢ các buổi học của suất này (môn [${item.title}]) từ tuần này trở đi không?`)) {
            this.scheduleService.deletePatternForward(item.patternId, currentWeek).subscribe({
                next: () => {
                    if (this.selectedScheduleItem?.id === item.id) {
                        this.selectedScheduleItem = null;
                    }
                    this.loadScheduleForAdminClass();
                    this.closeContextMenu();
                },
                error: (err) => {
                    this.flashMessage.handleError(err);
                }
            });
        }
    }

    nextWeek(): void {
        const next = new Date(this.currentDate);
        next.setDate(next.getDate() + 7);
        this.currentDate = next;
        this.updateWeekDays();
    }

    previousWeek(): void {
        const prev = new Date(this.currentDate);
        prev.setDate(prev.getDate() - 7);
        this.currentDate = prev;
        this.updateWeekDays();
    }

    goToToday(): void {
        this.currentDate = new Date();
        this.updateWeekDays();
    }

    openPatternModal(): void {
        if (!this.selectedAdminClass) {
            alert('Vui lòng chọn lớp hành chính trước!');
            return;
        }
        this.showPatternModal = true;
    }

    closePatternModal(): void {
        this.showPatternModal = false;
    }

    savePattern(): void {
        if (!this.selectedAdminClass) return;
        if (this.classes.length === 0) {
            alert('Lớp này chưa có học phần nào được khởi tạo.');
            return;
        }

        this.scheduleService.addPattern(this.classes[0].id, this.newPattern).subscribe({
            next: () => {
                this.closePatternModal();
                this.loadScheduleForAdminClass();
            },
            error: (err) => {
                console.error('Failed to create pattern', err);
                this.flashMessage.handleError(err);
            }
        });
    }

    generateSchedule(): void {
        if (!this.selectedAdminClass || this.classes.length === 0) return;
        this.scheduleService.generateInstances(this.classes[0].id).subscribe(() => {
            this.loadScheduleForAdminClass();
        });
    }

    checkConflicts(): void {
        if (!this.selectedAdminClass || this.classes.length === 0) return;
        this.scheduleService.getConflicts(this.classes[0].id).subscribe(res => {
            this.conflicts = res;
        });
    }

    getInstancesForSelectedDate(): any[] {
        const selectedStr = this.toISODateString(this.currentDate);
        return this.allInstances.filter(i => {
            const itemDateStr = this.formatBackendDate(i.scheduleDate);
            return itemDateStr === selectedStr;
        });
    }

    getSemesterName(id: number | null): string {
        const s = this.semesters.find(item => item.id === id);
        return s ? s.name : 'Chọn học kỳ';
    }

    getCohortLabel(cohort: number | null): string {
        return cohort ? cohort.toString() : '[Rỗng]';
    }

    getMajorCode(id: number | null): string {
        const m = this.majors.find(item => item.id === id);
        return m ? m.majorCode : '[Rỗng]';
    }

    getMajorName(id: number | null): string {
        const m = this.majors.find(item => item.id === id);
        return m ? m.majorName : '[Rỗng]';
    }

    getTotalPeriods(c: CourseClass): number {
        return (c.theoryPeriods || 0) + (c.practicalPeriods || 0) || (c.credits || 0) * 15;
    }

    getScheduledPeriods(classId: number): number {
        const uniqueInstances = new Map<number, any>();
        this.allInstances
            .filter(i => i.classId === classId)
            .forEach(i => uniqueInstances.set(i.id, i));

        return Array.from(uniqueInstances.values())
            .reduce((sum, i) => sum + (i.endPeriod - i.startPeriod + 1), 0);
    }

    getRemainingPeriods(c: CourseClass): number {
        const total = this.getTotalPeriods(c);
        const scheduled = this.getScheduledPeriods(c.id);
        return Math.max(0, total - scheduled);
    }

    getCurrentWeek(): number | null {
        if (!this.selectedSemesterId || this.semesters.length === 0) return 1;
        const semester = this.semesters.find(s => s.id === this.selectedSemesterId);
        if (!semester || !semester.startDate || !semester.endDate) return 1;

        const start = new Date(semester.startDate);
        const day = start.getDay();
        const diff = start.getDate() - (day === 0 ? 6 : day - 1);
        const startMonday = new Date(start.getFullYear(), start.getMonth(), diff);
        startMonday.setHours(0, 0, 0, 0);

        if (day !== 1) { // 0 is Sunday, 1 is Monday
            // Bỏ qua các ngày dư để bắt đầu Tuần 1 từ thứ Hai tiếp theo
            startMonday.setDate(startMonday.getDate() + 7);
        }

        const end = new Date(semester.endDate);
        const endDay = end.getDay();
        const endDiff = end.getDate() - (endDay === 0 ? -6 : 1);
        const endSunday = new Date(end.getFullYear(), end.getMonth(), endDiff);
        endSunday.setHours(23, 59, 59, 999);

        const current = new Date(this.currentDate);
        const currDay = current.getDay();
        const currDiff = current.getDate() - (currDay === 0 ? 6 : currDay - 1);
        const currentMonday = new Date(current.getFullYear(), current.getMonth(), currDiff);
        currentMonday.setHours(0, 0, 0, 0);

        if (current.getTime() > endSunday.getTime()) {
            return null;
        }

        const timeDiff = currentMonday.getTime() - startMonday.getTime();
        const weekNum = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000)) + 1;

        if (weekNum <= 0) {
            return null; // Bỏ qua khỏi tuần 1 đối với các ngày dư
        }

        return weekNum;
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'OPEN_REGISTRATION': return 'Đang đăng ký';
            case 'FULL': return 'Đã đầy';
            case 'CLOSED': return 'Đã khóa';
            case 'CANCELLED': return 'Đã hủy';
            case 'PLANNING': return 'Lập kế hoạch';
            case 'PLANNED': return 'Đã lập lịch';
            default: return status;
        }
    }

    onDragStart(event: DragEvent, courseClass: CourseClass): void {
        this.draggedCourseClass = courseClass;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'copy';
            event.dataTransfer.setData('courseClass', JSON.stringify(courseClass));
        }
        event.stopPropagation();
    }

    onItemDragStart(event: DragEvent, item: any): void {
        event.dataTransfer?.setData('moveItem', JSON.stringify(item));
    }

    onDragEnd(): void {
        this.draggedCourseClass = null;
    }

    canDrop(isoDate: string, periodNumber: number): boolean {
        // Kiểm tra nằm trong thời gian học kỳ
        if (this.selectedSemesterId && this.semesters.length > 0) {
            const semester = this.semesters.find(s => s.id === this.selectedSemesterId);
            if (semester && semester.startDate && semester.endDate) {
                const targetDate = new Date(isoDate);
                targetDate.setHours(0, 0, 0, 0);

                const startDate = new Date(semester.startDate);
                startDate.setHours(0, 0, 0, 0);

                const endDate = new Date(semester.endDate);
                endDate.setHours(23, 59, 59, 999);

                if (targetDate.getTime() < startDate.getTime() || targetDate.getTime() > endDate.getTime()) {
                    return false;
                }
            }
        }

        if (this.draggedCourseClass) {
            const currentWeek = this.getCurrentWeek();
            const patternLength = 3;
            const remaining = this.getRemainingPeriods(this.draggedCourseClass);
            if (remaining < patternLength) {
                return false;
            }
        }
        return true;
    }

    onDragOver(event: DragEvent, isoDate: string, periodNumber: number): void {
        event.preventDefault();
        if (event.dataTransfer) {
            if (this.canDrop(isoDate, periodNumber)) {
                event.dataTransfer.dropEffect = 'copy';
            } else {
                event.dataTransfer.dropEffect = 'none';
            }
        }
    }

    onDrop(event: DragEvent, day: any, periodNumber: number): void {
        event.preventDefault();
        const courseClassJson = event.dataTransfer?.getData('courseClass');
        const moveItemJson = event.dataTransfer?.getData('moveItem');

        this.draggedCourseClass = null;

        if (courseClassJson) {
            const courseClass: any = JSON.parse(courseClassJson);
            this.addNewPattern(courseClass.id, day, periodNumber, {
                room: courseClass.expectedRoom,
                lecturer: courseClass.lecturerId ? { userId: courseClass.lecturerId } : null
            });
        } else if (moveItemJson) {
            const item = JSON.parse(moveItemJson);
            this.rescheduleItem(item, day, periodNumber);
        }
    }

    private addNewPattern(classId: number, day: any, periodNumber: number, initialData: any = {}, isReschedule: boolean = false): void {
        const currentWeek = this.getCurrentWeek();
        const pattern = {
            dayOfWeek: this.getDayNumberOfWeek(day.name),
            startPeriod: periodNumber,
            endPeriod: initialData.endPeriod || (periodNumber + 2),
            roomName: initialData.room || 'Chưa xếp',
            lecturer: initialData.lecturer || null,
            sessionType: initialData.type || 'THEORY',
            fromWeek: currentWeek !== null ? currentWeek : 1,
            toWeek: currentWeek !== null ? currentWeek : 1
        };

        const courseClass = this.classes.find(c => c.id === classId);
        if (courseClass && !isReschedule) {
            const remaining = this.getRemainingPeriods(courseClass);
            const duration = (pattern.endPeriod - pattern.startPeriod + 1);
            if (remaining < duration) {
                return;
            }
        }

        this.scheduleService.addPattern(classId, pattern).subscribe({
            next: () => {
                this.loadScheduleForAdminClass();
            },
            error: (err) => this.flashMessage.handleError(err)
        });
    }

    private rescheduleItem(item: any, day: any, periodNumber: number): void {
        if (item.patternId) {
            const duration = item.endPeriod - item.startPeriod;
            const initialData = {
                room: item.room,
                lecturer: item.lecturer,
                endPeriod: periodNumber + duration,
                type: item.type
            };

            this.scheduleService.deletePattern(item.patternId).subscribe(() => {
                this.addNewPattern(item.classId, day, periodNumber, initialData, true);
            });
        }
    }

    saveScheduleItem(): void {
        if (!this.selectedScheduleItem || !this.selectedScheduleItem.patternId) return;

        const item = this.selectedScheduleItem;
        this.scheduleService.updatePattern(
            item.patternId,
            item.startPeriod,
            item.endPeriod,
            item.room || '',
            item.lecturerName || ''
        ).subscribe({
            next: () => {
                this.loadScheduleForAdminClass();
            },
            error: (err) => {
                console.error('Save failed', err);
                this.flashMessage.handleError(err);
            }
        });
    }

    cancelScheduleItem(): void {
        if (!this.selectedScheduleItem || !this.selectedScheduleItem.patternId) return;

        if (confirm(`Bạn có chắc muốn hủy lịch học môn [${this.selectedScheduleItem.title}] ?`)) {
            this.scheduleService.deletePattern(this.selectedScheduleItem.patternId).subscribe(() => {
                this.selectedScheduleItem = null;
                this.loadScheduleForAdminClass();
            });
        }
    }

    onResizeStart(event: MouseEvent, item: any): void {
        event.stopPropagation();
        event.preventDefault();
        this.isResizing = true;
        this.newEndPeriod = item.endPeriod;

        const originalItem = this.scheduleItems.find(i => i.id === item.id);
        if (originalItem) {
            this.resizingItem = originalItem;
            this.resizingItemObject = { ...item }; // Lưu snapshot giá trị ban đầu (cloning object)
            this.resizingOriginalDuration = item.endPeriod - item.startPeriod + 1;
        } else {
            this.resizingItem = item;
            this.resizingItemObject = { ...item };
            this.resizingOriginalDuration = item.endPeriod - item.startPeriod + 1;
        }

        const onMouseUp = (e: MouseEvent) => {
            this.onResizeEnd();
            window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mouseup', onMouseUp);
    }

    trackById(index: number, item: any): any {
        return item.id;
    }

    onPeriodMouseEnter(period: number): void {
        if (this.isResizing && this.resizingItem) {
            if (period >= this.resizingItem.startPeriod) {
                // Lấy thông tin lớp học phần để kiểm tra số tiết
                const courseClass = this.classes.find(c => c.id === this.resizingItem.classId);
                if (courseClass) {
                    const remaining = this.getRemainingPeriods(courseClass) + this.resizingOriginalDuration;
                    const newDuration = period - this.resizingItem.startPeriod + 1;

                    // Nếu thời lượng mới kéo dãn vuợt quá số lượng cho phép, bị chặn lại ở mức tối đa có thể
                    if (newDuration > remaining) {
                        const maxAllowedPeriod = this.resizingItem.startPeriod + remaining - 1;
                        this.newEndPeriod = maxAllowedPeriod;
                        this.resizingItem.endPeriod = maxAllowedPeriod;
                        return;
                    }
                }

                this.newEndPeriod = period;
                this.resizingItem.endPeriod = period;
            }
        }
    }

    onResizeEnd(): void {
        if (this.isResizing && this.resizingItem && this.newEndPeriod !== null) {
            const finalEndPeriod = this.newEndPeriod;
            const patternId = this.resizingItem.patternId;
            const startPeriod = this.resizingItem.startPeriod;
            const room = this.resizingItem.room || '';
            const lecturerName = this.resizingItem.lecturerName || '';

            if (patternId) {
                this.scheduleService.updatePattern(patternId, startPeriod, finalEndPeriod, room, lecturerName)
                    .subscribe({
                        next: () => {
                            this.loadScheduleForAdminClass();
                        },
                        error: (err) => {
                            console.error('Resize failed', err);
                            this.loadScheduleForAdminClass();
                        }
                    });
            }
        }

        this.isResizing = false;
        this.resizingItem = null;
        this.newEndPeriod = null;
    }

    getDayNumberOfWeek(dayName: string): number {
        const days: { [key: string]: number } = {
            'Monday': 2,
            'Tuesday': 3,
            'Wednesday': 4,
            'Thursday': 5,
            'Friday': 6,
            'Saturday': 7,
            'Sunday': 8
        };
        return days[dayName] || 2;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        this.closeContextMenu();
    }
}