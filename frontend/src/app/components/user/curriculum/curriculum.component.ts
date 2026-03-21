import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CurriculumService, CurriculumDTO, KnowledgeBlockDetailDTO, CurriculumSubjectComponentDTO } from '../../../services/curriculum.service';
import { AuthService } from '../../../auth.service';

@Component({
    selector: 'app-curriculum',
    templateUrl: './curriculum.component.html'
})
export class CurriculumComponent implements OnInit {
    curriculums: CurriculumDTO[] = [];
    selectedCurriculumId: number | null = null;
    curriculumDetails: KnowledgeBlockDetailDTO[] = [];

    mandatoryBlocks: any[] = [];
    electiveBlocks: any[] = [];
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

    flatSubjects: CurriculumSubjectComponentDTO[] = [];

    onCurriculumChange(): void {
        if (this.selectedCurriculumId) {
            this.loading = true;
            this.curriculumService.getCurriculumDetails(this.selectedCurriculumId).subscribe({
                next: (data) => {
                    this.curriculumDetails = data || [];
                    this.flatSubjects = [];

                    // Phân loại các khối kiến thức
                    this.mandatoryBlocks = this.curriculumDetails.filter(b => b.blockType === 'MANDATORY').map(b => {
                        const totalHP = b.subjects?.length || 0;
                        const totalTC = b.subjects?.reduce((sum, s) => sum + (s.credits || 0), 0) || 0;
                        return {
                            blockId: b.blockId,
                            name: b.blockName,
                            details: `Tổng số HP: ${totalHP} ; Tổng số TC: ${totalTC}`
                        };
                    });

                    this.electiveBlocks = this.curriculumDetails.filter(b => b.blockType === 'ELECTIVE').map(b => {
                        const totalHP = b.subjects?.length || 0;
                        const totalTC = b.subjects?.reduce((sum, s) => sum + (s.credits || 0), 0) || 0;
                        const required = b.creditsRequired ? `; Số TC bắt buộc: ${b.creditsRequired}` : '';
                        return {
                            blockId: b.blockId,
                            name: b.blockName,
                            details: `Tổng số HP: ${totalHP}; Tổng số TC: ${totalTC} ${required}`
                        };
                    });

                    // Gộp tất cả môn học thành danh sách phẳng (giữ logic cũ)
                    this.curriculumDetails.forEach(block => {
                        if (block.subjects) {
                            block.subjects.forEach(subject => {
                                this.flatSubjects.push({
                                    ...subject,
                                    blockCode: block.blockCode
                                });
                            });
                        }
                    });

                    // Sắp xếp toàn bộ môn học theo học kỳ dự kiến tăng dần
                    this.flatSubjects.sort((a, b) => a.semester - b.semester);

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

    getGlobalIndex(blockIndex: number, subjectIndex: number): number {
        let count = 0;
        for (let i = 0; i < blockIndex; i++) {
            count += this.curriculumDetails[i].subjects?.length || 0;
        }
        return count + subjectIndex + 1;
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