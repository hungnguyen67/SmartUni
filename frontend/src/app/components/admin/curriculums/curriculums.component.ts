import { Component, OnInit, HostListener } from '@angular/core';
import { CurriculumService, CurriculumDTO } from '../../../services/curriculum.service';
import { MajorService, MajorDTO } from '../../../services/major.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-curriculums',
    templateUrl: './curriculums.component.html'
})
export class CurriculumsComponent implements OnInit {
    // Data
    curriculums: CurriculumDTO[] = [];
    filteredCurriculums: CurriculumDTO[] = [];
    majors: MajorDTO[] = [];

    // UI State
    loading: boolean = false;
    searchTerm: string = '';
    selectedMajorId: number | null = null;
    selectedStatus: string = 'ACTIVE';
    activeDropdown: string = '';

    // Pagination
    currentPage: number = 1;
    itemsPerPage: number = 10;

    constructor(
        private curriculumService: CurriculumService,
        private majorService: MajorService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    // Đóng dropdown khi click ra ngoài
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown-container')) {
            this.activeDropdown = '';
        }
    }

    loadData(): void {
        this.loading = true;
        this.curriculumService.getCurriculums().subscribe({
            next: (data) => {
                this.curriculums = data;
                this.onFilter();
                this.loading = false;
            },
            error: () => this.loading = false
        });

        this.majorService.getMajors().subscribe(data => {
            this.majors = data;
        });
    }

    onFilter(): void {
        this.filteredCurriculums = this.curriculums.filter(c => {
            const search = this.searchTerm.toLowerCase();
            const matchesSearch = !this.searchTerm ||
                c.curriculumName.toLowerCase().includes(search) ||
                (c.majorName && c.majorName.toLowerCase().includes(search));

            const matchesMajor = !this.selectedMajorId || c.majorId === this.selectedMajorId;

            const matchesStatus = this.selectedStatus === 'ALL' || c.status === this.selectedStatus;

            return matchesSearch && matchesMajor && matchesStatus;
        });
        this.currentPage = 1;
    }

    getSelectedMajorName(): string {
        if (!this.selectedMajorId) return 'Tất cả các ngành học';
        const major = this.majors.find(m => m.id === this.selectedMajorId);
        return major ? major.majorName : 'Tất cả các ngành học';
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedMajorId = null;
        this.selectedStatus = 'ACTIVE';
        this.onFilter();
    }

    editCurriculum(item: CurriculumDTO): void {
        console.log('Edit curriculum', item);
        // Implementation for edit modal or navigation will go here
    }

    // Navigation & Actions

    // Pagination Getters
    get totalPages(): number {
        return Math.ceil(this.filteredCurriculums.length / this.itemsPerPage);
    }

    get paginatedCurriculums(): CurriculumDTO[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredCurriculums.slice(start, start + this.itemsPerPage);
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredCurriculums.length);
    }

    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
    prevPage() { if (this.currentPage > 1) this.currentPage--; }
}