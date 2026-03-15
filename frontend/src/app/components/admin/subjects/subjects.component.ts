import { Component, OnInit } from '@angular/core';
import { SubjectService, SubjectDTO } from '../../../services/subject.service';

@Component({
    selector: 'app-subjects',
    templateUrl: './subjects.component.html'
})
export class SubjectsComponent implements OnInit {

    subjects: SubjectDTO[] = [];
    filteredSubjects: SubjectDTO[] = [];
    searchTerm: string = '';

    currentPage: number = 1;
    itemsPerPage: number = 10;

    showModal: boolean = false;
    isEditing: boolean = false;
    currentSubject: Partial<SubjectDTO> = {};

    constructor(private subjectService: SubjectService) { }

    ngOnInit(): void {
        this.loadSubjects();
    }

    loadSubjects(): void {
        this.subjectService.getAllSubjects().subscribe(data => {
            this.subjects = data;
            this.onSearch();
        });
    }

    onSearch(): void {
        this.filteredSubjects = this.subjects.filter(s => {
            const matchesSearch = !this.searchTerm ||
                s.subjectCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (s.description && s.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
            return matchesSearch;
        });
        this.currentPage = 1;
    }

    get paginatedSubjects(): SubjectDTO[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredSubjects.slice(start, start + this.itemsPerPage);
    }

    get totalPages(): number {
        return Math.ceil(this.filteredSubjects.length / this.itemsPerPage) || 1;
    }

    get minEnd(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredSubjects.length);
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
        this.currentSubject = {
            subjectCode: '',
            name: '',
            credits: 0,
            theoryPeriods: 0,
            practicalPeriods: 0,
            description: '',
            status: 'ACTIVE'
        };
        this.showModal = true;
    }

    editSubject(subject: SubjectDTO): void {
        this.isEditing = true;
        this.currentSubject = { ...subject };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
    }

    saveSubject(): void {
        if (this.isEditing) {
            this.subjectService.updateSubject(this.currentSubject.id!, this.currentSubject).subscribe(() => {
                this.loadSubjects();
                this.closeModal();
            });
        } else {
            this.subjectService.createSubject(this.currentSubject).subscribe(() => {
                this.loadSubjects();
                this.closeModal();
            });
        }
    }

    deleteSubject(subject: SubjectDTO): void {
        if (confirm(`Bạn có chắc chắn muốn xóa học phần ${subject.name}? Thao tác này có thể ảnh hưởng đến các chương trình đào tạo.`)) {
            this.subjectService.deleteSubject(subject.id).subscribe(() => {
                this.loadSubjects();
            });
        }
    }
}
