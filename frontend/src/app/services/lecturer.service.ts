import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LecturerDTO {
    id: number;
    lecturerCode: string;
    fullName: string;
    facultyName: string;
    facultyId: number;
    specialization: string;
    degree: string;
    academicRank: string;
    phone: string;
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
}
