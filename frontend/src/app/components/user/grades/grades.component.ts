import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../auth.service';
import { RegistrationService } from '../../../services/registration.service';
import { finalize } from 'rxjs/operators';

interface GradeItem {
  stt: number;
  maHocPhan: string;
  tenHocPhan: string;
  soTinChi: number;
  lanHoc: number;
  lanThi: number;
  diemHe10: number;
  diemHe4: number;
  diemChu: string;
  danhGia: string;
  ghiChu: string;
}

interface SemesterGrades {
  semesterId: number;
  semesterName: string;
  items: GradeItem[];
  tongTinChi: number;
  diemTrungBinhHe10: number;
  diemTrungBinhTichLuyHe10: number;
  tongTinChiTichLuy: number;
  diemTrungBinhHe4: number;
  diemTrungBinhTichLuyHe4: number;
  isExpanded?: boolean;
}

@Component({
  selector: 'app-grades',
  templateUrl: './grades.component.html'
})
export class GradesComponent implements OnInit {
  activeTab: string = 'bang-diem';

  studentInfo = {
    name: '',
    code: '',
    birthday: '',
    gender: '',
    status: '',
    className: '',
    major: ''
  };

  summaryGrades = {
    tongSoTinChi: 0,
    tongSoTinChiTichLuy: 0,
    diemTrungBinhHe10: 0,
    diemTrungBinhHe4: 0,
    diemTrungBinhTichLuyHe10: 0,
    diemTrungBinhTichLuyHe4: 0
  };

  semesterData: SemesterGrades[] = [];
  loading: boolean = true;

  tabs = [
    { id: 'bang-diem', label: 'Bảng điểm', icon: 'fa-table-list' }
  ];

  constructor(
    private authService: AuthService,
    private registrationService: RegistrationService
  ) { }

  ngOnInit(): void {
    this.loadGrades();
  }

  loadGrades() {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.studentInfo = {
          name: profile.name,
          code: profile.studentCode,
          birthday: profile.birthday || 'Chưa cập nhật',
          gender: profile.gender || 'Chưa cập nhật',
          status: 'Đang học',
          className: profile.className,
          major: profile.majorName
        };

        this.registrationService.getRegistrationsByStudent(profile.id)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: (registrations) => {
              this.processGrades(registrations);
            }
          });
      },
      error: () => this.loading = false
    });
  }

  processGrades(registrations: any[]) {
    const semestersMap = new Map<number, SemesterGrades>();
    let totalCreditsAccumulated = 0;
    let sumWeightedPoint4Accumulated = 0;
    let sumWeightedPoint10Accumulated = 0;
    let totalCreditsForGpaAccumulated = 0;

    // Group by semester
    registrations.forEach(reg => {
      // Chỉ hiện điểm khi trạng thái là COMPLETED
      const regStatus = (reg.status || reg.registrationStatus || '').toUpperCase();
      if (regStatus !== 'COMPLETED') {
        return;
      }

      const semId = reg.semesterId || 0;
      if (!semestersMap.has(semId)) {
        semestersMap.set(semId, {
          semesterId: semId,
          semesterName: reg.semesterName || 'Khác',
          items: [],
          tongTinChi: 0,
          diemTrungBinhHe10: 0,
          diemTrungBinhTichLuyHe10: 0,
          tongTinChiTichLuy: 0,
          diemTrungBinhHe4: 0,
          diemTrungBinhTichLuyHe4: 0,
          isExpanded: true
        });
      }

      const semester = semestersMap.get(semId)!;
      
      semester.items.push({
        stt: semester.items.length + 1,
        maHocPhan: reg.classCode,
        tenHocPhan: reg.subjectName,
        soTinChi: reg.credits,
        lanHoc: 1, 
        lanThi: 1,
        diemHe10: reg.totalScore,
        diemHe4: reg.gradePoint,
        diemChu: reg.gradeLetter || '',
        danhGia: reg.totalScore >= 4.0 ? 'Đạt' : (reg.totalScore != null ? 'Không đạt' : ''),
        ghiChu: ''
      });
    });

    // Calculate per-semester and overall
    const sortedSemesters = Array.from(semestersMap.values())
      .sort((a, b) => b.semesterId - a.semesterId);

    let totalRegisteredCreditsAcrossAll = 0;

    sortedSemesters.forEach(sem => {
      let semCredits = 0;
      let semPoints4 = 0;
      let semPoints10 = 0;
      let semCreditsPass = 0;
      let semCreditsGraded = 0;

      sem.items.forEach(item => {
        semCredits += item.soTinChi;
        if (item.diemHe10 !== null && item.diemHe10 !== undefined) {
          semPoints4 += (item.diemHe4 || 0) * item.soTinChi;
          semPoints10 += (item.diemHe10 || 0) * item.soTinChi;
          semCreditsGraded += item.soTinChi;
          if (item.danhGia === 'Đạt') {
            semCreditsPass += item.soTinChi;
          }
        }
      });

      sem.tongTinChi = semCredits;
      totalRegisteredCreditsAcrossAll += semCredits;
      
      sem.diemTrungBinhHe4 = semCreditsGraded > 0 ? Number((semPoints4 / semCreditsGraded).toFixed(2)) : null as any;
      sem.diemTrungBinhHe10 = semCreditsGraded > 0 ? Number((semPoints10 / semCreditsGraded).toFixed(2)) : null as any;

      totalCreditsAccumulated += semCreditsPass;
      totalCreditsForGpaAccumulated += semCreditsGraded;
      sumWeightedPoint4Accumulated += semPoints4;
      sumWeightedPoint10Accumulated += semPoints10;

      sem.tongTinChiTichLuy = totalCreditsAccumulated;
      sem.diemTrungBinhTichLuyHe4 = totalCreditsForGpaAccumulated > 0 ? Number((sumWeightedPoint4Accumulated / totalCreditsForGpaAccumulated).toFixed(2)) : null as any;
      sem.diemTrungBinhTichLuyHe10 = totalCreditsForGpaAccumulated > 0 ? Number((sumWeightedPoint10Accumulated / totalCreditsForGpaAccumulated).toFixed(2)) : null as any;
    });

    this.semesterData = sortedSemesters;

    this.summaryGrades = {
      tongSoTinChi: totalRegisteredCreditsAcrossAll,
      tongSoTinChiTichLuy: totalCreditsAccumulated,
      diemTrungBinhHe10: this.semesterData[0]?.diemTrungBinhTichLuyHe10 ?? null,
      diemTrungBinhHe4: this.semesterData[0]?.diemTrungBinhTichLuyHe4 ?? null,
      diemTrungBinhTichLuyHe10: this.semesterData[0]?.diemTrungBinhTichLuyHe10 ?? null,
      diemTrungBinhTichLuyHe4: this.semesterData[0]?.diemTrungBinhTichLuyHe4 ?? null
    };
  }

  setActiveTab(tabId: string) {
    this.activeTab = tabId;
  }

  formatSemesterName(name: string): string {
    if (!name || name === 'Khác') return name;
    const parts = name.split('.'); 
    if (parts.length === 2) {
      const year = parts[0].replace(/-/g, '_');
      const term = parts[1];
      return `Năm học ${year} - Học kỳ ${term}`;
    }
    return name;
  }
}
