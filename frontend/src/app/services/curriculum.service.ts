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
    isRequired: boolean;
    prerequisites: string[];
    corequisites: string[];
    equivalents: string[];
    blockCode?: string;
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
