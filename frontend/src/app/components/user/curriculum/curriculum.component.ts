import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CurriculumService, CurriculumDTO, KnowledgeBlockDetailDTO } from '../../../services/curriculum.service';
import { AuthService } from '../../../auth.service';

@Component({
    selector: 'app-curriculum',
    templateUrl: './curriculum.component.html'
})
export class CurriculumComponent implements OnInit {
    curriculums: CurriculumDTO[] = [];
    selectedCurriculumId: number | null = null;
    curriculumDetails: KnowledgeBlockDetailDTO[] = [];

    optionalBlocks = [
        { name: 'QP&AN', details: 'Tổng số HP: 1; Tổng số TC: 8' },
        { name: 'GDTC', details: 'Tổng số HP: 8; Tổng số TC: 8; Số TC bắt buộc: 3' },
        { name: 'Tiếng Anh', details: 'Tổng số HP: 20; Tổng số TC: 96' },
        { name: 'Chuyên ngành (Tự chọn)', details: 'Tổng số HP: 20; Tổng số TC: 60; Số TC bắt buộc: 12' }
    ];

    loading = false;
    error: string | null = null;
    totalCredits = 0;

    constructor(
        private curriculumService: CurriculumService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadStudentProfileAndCurriculum();
    }

    loadStudentProfileAndCurriculum(): void {
        this.loading = true;
        this.authService.getProfile().subscribe({
            next: (profile: any) => {
                const role = this.authService.getRole() || '';
                if (role.includes('STUDENT') && profile.curriculumId) {
                    this.selectedCurriculumId = Number(profile.curriculumId);
                    this.loadSpecificCurriculum(this.selectedCurriculumId);
                } else {
                    this.loadAllCurriculums();
                }
            },
            error: (err) => {
                console.error('Error loading profile', err);
                this.loadAllCurriculums();
            }
        });
    }

    loadSpecificCurriculum(currId: number): void {
        this.curriculumService.getCurriculums().subscribe({
            next: (data) => {
                this.curriculums = data.filter(c => Number(c.id) === currId);
                if (this.curriculums.length > 0) {
                    this.selectedCurriculumId = this.curriculums[0].id;
                    this.onCurriculumChange();
                } else {
                    this.loading = false;
                    this.error = 'Không tìm thấy chương trình học của bạn.';
                }
            },
            error: (err) => {
                this.error = 'Không thể tải danh sách chương trình.';
                this.loading = false;
            }
        });
    }

    loadAllCurriculums(): void {
        this.curriculumService.getCurriculums().subscribe({
            next: (data) => {
                this.curriculums = data;
                if (this.curriculums.length > 0) {
                    this.selectedCurriculumId = this.curriculums[0].id;
                    this.onCurriculumChange();
                } else {
                    this.loading = false;
                }
            },
            error: (err) => {
                this.error = 'Không thể tải danh sách chương trình.';
                this.loading = false;
            }
        });
    }

    onCurriculumChange(): void {
        if (this.selectedCurriculumId) {
            this.loading = true;
            this.curriculumService.getCurriculumDetails(this.selectedCurriculumId).subscribe({
                next: (data) => {
                    this.curriculumDetails = data || [];
                    this.calculateTotalCredits();
                    this.loading = false;
                },
                error: (err) => {
                    this.error = 'Không thể tải chi tiết chương trình học.';
                    this.loading = false;
                }
            });
        }
    }

    calculateTotalCredits(): void {
        this.totalCredits = 0;
        this.curriculumDetails.forEach(block => {
            if (block.subjects) {
                block.subjects.forEach(subject => {
                    this.totalCredits += subject.credits || 0;
                });
            }
        });
    }

    scrollToBlock(blockId: number): void {
        const element = document.getElementById('block-' + blockId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    navigateToDetail(subjectId: number): void {
        this.router.navigate(['/home/program/course', subjectId]);
    }
}