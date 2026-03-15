import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Semester {
    id: number;
    name: string;
    academicYear: string;
    semesterOrder: number;
    startDate: string;
    endDate: string;
    semesterStatus: 'UPCOMING' | 'ONGOING' | 'FINISHED';
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SemesterService {
    private apiUrl = 'http://localhost:8001/api/semesters';

    constructor(private http: HttpClient) { }

    getAllSemesters(): Observable<Semester[]> {
        return this.http.get<Semester[]>(this.apiUrl);
    }

    getSemesterById(id: number): Observable<Semester> {
        return this.http.get<Semester>(`${this.apiUrl}/${id}`);
    }

    createSemester(semester: Semester): Observable<Semester> {
        return this.http.post<Semester>(this.apiUrl, semester);
    }

    updateSemester(id: number, semester: Semester): Observable<Semester> {
        return this.http.put<Semester>(`${this.apiUrl}/${id}`, semester);
    }

    deleteSemester(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
