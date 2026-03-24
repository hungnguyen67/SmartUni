import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdministrativeClassDTO {
    id: number;
    classCode: string;
    className: string;
    majorId: number;
    majorCode: string;
    majorName: string;
    academicYear: string;
    cohort: number;
    advisorId?: number;
    advisorName?: string;
    status: string;
    studentCount: number;
    averageGpa?: number;
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdministrativeClassService {
    private apiUrl = '/api/classes';

    constructor(private http: HttpClient) { }

    getClasses(): Observable<AdministrativeClassDTO[]> {
        return this.http.get<AdministrativeClassDTO[]>(this.apiUrl);
    }

    getClassesByAdvisor(userId: number): Observable<AdministrativeClassDTO[]> {
        return this.http.get<AdministrativeClassDTO[]>(`${this.apiUrl}/advisor/${userId}`);
    }

    createClass(data: any): Observable<AdministrativeClassDTO> {
        return this.http.post<AdministrativeClassDTO>(this.apiUrl, data);
    }

    updateClass(id: number, data: any): Observable<AdministrativeClassDTO> {
        return this.http.put<AdministrativeClassDTO>(`${this.apiUrl}/${id}`, data);
    }

    deleteClass(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
