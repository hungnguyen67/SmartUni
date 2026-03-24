import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LecturerDTO {
    id: number;
    lecturerCode: string;
    lastName: string;
    firstName: string;
    facultyName: string;
    facultyId: number;
    specialization: string;
    degree: string;
    academicRank: string;
    phone: string;
    email: string;
    birthday: string;
    address: string;
    gender: string;
    status: string;
    advisorClasses: string[];
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class LecturerService {
    private apiUrl = '/api/lecturers';

    constructor(private http: HttpClient) { }

    getLecturers(searchTerm?: string, facultyId?: number): Observable<LecturerDTO[]> {
        let params = new HttpParams();
        if (searchTerm) {
            params = params.set('searchTerm', searchTerm);
        }
        if (facultyId) {
            params = params.set('facultyId', facultyId.toString());
        }
        return this.http.get<LecturerDTO[]>(this.apiUrl, { params });
    }

    createLecturer(lecturer: any): Observable<LecturerDTO> {
        return this.http.post<LecturerDTO>(this.apiUrl, lecturer);
    }

    updateLecturer(id: number, lecturer: any): Observable<LecturerDTO> {
        return this.http.put<LecturerDTO>(`${this.apiUrl}/${id}`, lecturer);
    }

    deleteLecturer(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
