import { Component, OnInit, HostListener } from '@angular/core';
import { FacultyService, FacultyDTO } from '../../../services/faculty.service';

@Component({
    selector: 'app-faculties',
    templateUrl: './faculties.component.html'
})
export class FacultiesComponent implements OnInit {

    faculties: FacultyDTO[] = [];
    filteredFaculties: FacultyDTO[] = [];
    searchTerm: string = '';
    selectedStatus: string = '';

    currentPage: number = 1;
    itemsPerPage: number = 10;

    showModal: boolean = false;
    isEditing: boolean = false;
    showFilter: boolean = false;
    activeDropdown: string = '';
    currentFaculty: Partial<FacultyDTO> = {};

    constructor(private facultyService: FacultyService) { }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
            this.showFilter = false;
            this.activeDropdown = '';
        }
    }

    ngOnInit(): void {
        this.loadFaculties();
    }

    loadFaculties(): void {
        this.facultyService.getFaculties().subscribe(data => {
            this.faculties = data;
            this.onSearch();
        });
    }

    onSearch(): void {
        this.filteredFaculties = this.faculties.filter(f => {
            const search = this.searchTerm.toLowerCase();
            const matchesSearch = !this.searchTerm ||
                f.facultyCode.toLowerCase().includes(search) ||
                f.facultyName.toLowerCase().includes(search) ||
                (f.description && f.description.toLowerCase().includes(search));

            const matchesStatus = !this.selectedStatus || f.status === this.selectedStatus;

            return matchesSearch && matchesStatus;
        });
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedStatus = '';
        this.onSearch();
    }

    get paginatedFaculties(): FacultyDTO[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredFaculties.slice(start, start + this.itemsPerPage);
    }

    get totalPages(): number {
        return Math.ceil(this.filteredFaculties.length / this.itemsPerPage) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredFaculties.length);
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    openAddModal(): void {
        this.isEditing = false;
        this.currentFaculty = {
            facultyCode: '',
            facultyName: '',
            description: '',
            status: 'ACTIVE'
        };
        this.showModal = true;
    }

    editFaculty(faculty: FacultyDTO): void {
        this.isEditing = true;
        this.currentFaculty = { ...faculty };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
    }

    saveFaculty(): void {
        if (this.isEditing) {
            this.facultyService.updateFaculty(this.currentFaculty.id!, this.currentFaculty).subscribe(() => {
                this.loadFaculties();
                this.closeModal();
            });
        } else {
            this.facultyService.createFaculty(this.currentFaculty).subscribe(() => {
                this.loadFaculties();
                this.closeModal();
            });
        }
    }

    deleteFaculty(faculty: FacultyDTO): void {
        if (confirm(`Bạn có chắc chắn muốn xóa khoa ${faculty.facultyName}? Thao tác này có thể ảnh hưởng đến các chuyên ngành thuộc khoa này.`)) {
            this.facultyService.deleteFaculty(faculty.id).subscribe(() => {
                this.loadFaculties();
            });
        }
    }

    getStatusLabel(status: string | undefined): string {
        switch (status) {
            case 'ACTIVE': return 'Đang hoạt động';
            case 'INACTIVE': return 'Ngưng hoạt động';
            case 'DRAFT': return 'Bản nháp';
            default: return 'Không xác định';
        }
    }

    getStatusClass(status: string | undefined): string {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'DRAFT': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'INACTIVE': return 'bg-slate-50 text-slate-600 border-slate-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    }
}
