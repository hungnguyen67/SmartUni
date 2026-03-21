import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubjectRelationDTO {
    relationType: 'PREREQUISITE' | 'COREQUISITE' | 'EQUIVALENT';
    subjectCode: string;
    subjectName: string;
}

export interface SubjectDTO {
    id: number;
    subjectCode: string;
    name: string;
    credits: number;
    theoryCredits: number;
    practicalCredits: number;
    theoryPeriods: number;
    practicalPeriods: number;
    description: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
    relations?: SubjectRelationDTO[];
}

@Injectable({
    providedIn: 'root'
})
export class SubjectService {
    private apiUrl = 'http://localhost:8001/api/subjects';

    constructor(private http: HttpClient) { }

    getAllSubjects(): Observable<SubjectDTO[]> {
        return this.http.get<SubjectDTO[]>(this.apiUrl);
    }

    createSubject(dto: Partial<SubjectDTO>): Observable<SubjectDTO> {
        return this.http.post<SubjectDTO>(this.apiUrl, dto);
    }

    updateSubject(id: number, dto: Partial<SubjectDTO>): Observable<SubjectDTO> {
        return this.http.put<SubjectDTO>(`${this.apiUrl}/${id}`, dto);
    }

    deleteSubject(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
