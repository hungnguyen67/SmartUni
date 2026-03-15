import { Component, OnInit, HostListener } from '@angular/core';
import { MajorService, MajorDTO } from '../../../services/major.service';
import { FacultyService, FacultyDTO } from '../../../services/faculty.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-programs',
  templateUrl: './programs.component.html'
})
export class ProgramsComponent implements OnInit {

  majors: MajorDTO[] = [];
  filteredMajors: MajorDTO[] = [];
  searchTerm: string = '';
  selectedStatus: string = '';
  selectedFacultyId: string = '';
  faculties: FacultyDTO[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 10;

  showModal: boolean = false;
  isEditing: boolean = false;
  showFilter: boolean = false;
  activeDropdown: string = '';
  currentMajor: Partial<MajorDTO> = {};

  constructor(
    private majorService: MajorService,
    private facultyService: FacultyService,
    private router: Router
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showFilter = false;
      this.activeDropdown = '';
    }
  }

  ngOnInit(): void {
    this.loadMajors();
    this.loadFaculties();
  }

  loadMajors(): void {
    this.majorService.getMajors().subscribe(data => {
      this.majors = data;
      this.onSearch();
    });
  }

  loadFaculties(): void {
    this.facultyService.getFaculties().subscribe(data => {
      this.faculties = data;
    });
  }

  onSearch(): void {
    this.filteredMajors = this.majors.filter(major => {
      const search = this.searchTerm.toLowerCase();
      const matchesSearch = !this.searchTerm ||
        major.majorCode.toLowerCase().includes(search) ||
        major.majorName.toLowerCase().includes(search) ||
        (major.description && major.description.toLowerCase().includes(search));

      const matchesStatus = !this.selectedStatus || major.status === this.selectedStatus;
      const matchesFaculty = !this.selectedFacultyId || major.facultyId === Number(this.selectedFacultyId);

      return matchesSearch && matchesStatus && matchesFaculty;
    });
    this.currentPage = 1;
  }

  getSelectedFacultyName(): string {
    const faculty = this.faculties.find(f => f.id.toString() === this.selectedFacultyId);
    return faculty ? faculty.facultyName : '';
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedFacultyId = '';
    this.onSearch();
  }

  get paginatedMajors(): MajorDTO[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredMajors.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredMajors.length / this.itemsPerPage) || 1;
  }

  get minEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredMajors.length);
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
    this.currentMajor = {
      majorCode: '',
      majorName: '',
      description: '',
      facultyId: undefined,
      status: 'ACTIVE'
    };
    this.showModal = true;
  }

  editMajor(major: MajorDTO): void {
    this.isEditing = true;
    this.currentMajor = { ...major };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveMajor(): void {
    if (this.isEditing) {
      this.majorService.updateMajor(this.currentMajor.id!, this.currentMajor).subscribe(() => {
        this.loadMajors();
        this.closeModal();
      });
    } else {
      this.majorService.createMajor(this.currentMajor).subscribe(() => {
        this.loadMajors();
        this.closeModal();
      });
    }
  }

  deleteMajor(major: MajorDTO): void {
    if (confirm(`Bạn có chắc chắn muốn xóa ngành ${major.majorName}?`)) {
      this.majorService.deleteMajor(major.id).subscribe(() => {
        this.loadMajors();
      });
    }
  }
}