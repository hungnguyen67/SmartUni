import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StudentDTO {
    id: number;
    studentCode: string;
    fullName: string;
    className: string;
    classId: number;
    curriculumId: number;
    curriculumName: string;
    enrollmentYear: number;
    currentSemester: number;
    totalCreditsEarned: number;
    currentGpa: number;
    currentGpa10: number;
    status: string;
    majorName: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class StudentService {
    private apiUrl = '/api/students';

    constructor(private http: HttpClient) { }

    getStudents(filters: any): Observable<StudentDTO[]> {
        let params = new HttpParams();
        if (filters.searchTerm) params = params.set('searchTerm', filters.searchTerm);
        if (filters.classId) params = params.set('classId', filters.classId.toString());
        if (filters.majorId) params = params.set('majorId', filters.majorId.toString());
        if (filters.enrollmentYear) params = params.set('enrollmentYear', filters.enrollmentYear.toString());
        if (filters.status) params = params.set('status', filters.status);
        if (filters.minGpa) params = params.set('minGpa', filters.minGpa.toString());
        if (filters.maxGpa) params = params.set('maxGpa', filters.maxGpa.toString());

        return this.http.get<StudentDTO[]>(this.apiUrl, { params });
    }

    getEnrollmentYears(): Observable<number[]> {
        return this.http.get<number[]>(`${this.apiUrl}/enrollment-years`);
    }
}
