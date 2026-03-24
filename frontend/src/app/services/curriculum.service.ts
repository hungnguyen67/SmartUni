import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CurriculumDTO {
    id: number;
    curriculumName: string;
    majorName: string;
    majorCode: string;
    majorId: number;
    appliedYear: number;
    totalCreditsRequired: number;
    totalSubjects: number;
    totalKnowledgeBlocks: number;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CurriculumSubjectComponentDTO {
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    credits: number;
    semester: number;
    prerequisites: string[];
    corequisites: string[];
    equivalents: string[];
    blockCode?: string;
}

export interface KnowledgeBlockDTO {
    id: number;
    blockCode: string;
    blockName: string;
    curriculumId: number;
    curriculumName: string;
    creditsRequired: number;
    blockType: string;
}

export interface CurriculumSubjectDetailDTO {
    id: number;
    curriculumId: number;
    curriculumName: string;
    blockId: number;
    blockName: string;
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    recommendedSemester: number;
    credits: number;
}

export interface KnowledgeBlockDetailDTO {
    blockId: number;
    blockName: string;
    blockCode: string;
    creditsRequired: number;
    blockType: string;
    subjects: CurriculumSubjectComponentDTO[];
}

@Injectable({
    providedIn: 'root'
})
export class CurriculumService {

    private apiUrl = '/api/curriculums';

    constructor(private http: HttpClient) { }

    getCurriculums(): Observable<CurriculumDTO[]> {
        return this.http.get<CurriculumDTO[]>(this.apiUrl);
    }

    getCurriculum(id: number): Observable<CurriculumDTO> {
        return this.http.get<CurriculumDTO>(`${this.apiUrl}/${id}`);
    }

    getCurriculumsByMajorId(majorId: number): Observable<CurriculumDTO[]> {
        return this.http.get<CurriculumDTO[]>(`${this.apiUrl}/major/${majorId}`);
    }

    getCurriculumDetails(id: number): Observable<KnowledgeBlockDetailDTO[]> {
        return this.http.get<KnowledgeBlockDetailDTO[]>(`${this.apiUrl}/${id}/details`);
    }

    getKnowledgeBlocks(): Observable<KnowledgeBlockDTO[]> {
        return this.http.get<KnowledgeBlockDTO[]>(`${this.apiUrl}/knowledge-blocks`);
    }

    getAllCurriculumSubjects(): Observable<CurriculumSubjectDetailDTO[]> {
    return this.http.get<CurriculumSubjectDetailDTO[]>(this.apiUrl + '/subjects');
  }

  // Knowledge Block CRUD
  createKnowledgeBlock(block: KnowledgeBlockDTO): Observable<KnowledgeBlockDTO> {
    return this.http.post<KnowledgeBlockDTO>(this.apiUrl + '/knowledge-blocks', block);
  }

  updateKnowledgeBlock(id: number, block: KnowledgeBlockDTO): Observable<KnowledgeBlockDTO> {
    return this.http.put<KnowledgeBlockDTO>(`${this.apiUrl}/knowledge-blocks/${id}`, block);
  }

  deleteKnowledgeBlock(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/knowledge-blocks/${id}`);
  }

  // Curriculum Subject CRUD
  addSubjectToCurriculum(dto: CurriculumSubjectDetailDTO): Observable<CurriculumSubjectDetailDTO> {
    return this.http.post<CurriculumSubjectDetailDTO>(this.apiUrl + '/curriculum-subjects', dto);
  }

  updateCurriculumSubject(dto: CurriculumSubjectDetailDTO): Observable<CurriculumSubjectDetailDTO> {
    return this.http.put<CurriculumSubjectDetailDTO>(this.apiUrl + '/curriculum-subjects', dto);
  }

  deleteCurriculumSubject(curriculumId: number, subjectId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/curriculum-subjects/${curriculumId}/${subjectId}`);
  }

  createCurriculum(curriculum: CurriculumDTO): Observable<CurriculumDTO> {
        return this.http.post<CurriculumDTO>(this.apiUrl, curriculum);
    }

    updateCurriculum(id: number, curriculum: CurriculumDTO): Observable<CurriculumDTO> {
        return this.http.put<CurriculumDTO>(`${this.apiUrl}/${id}`, curriculum);
    }

    deleteCurriculum(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
