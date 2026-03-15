import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FacultyDTO {
    id: number;
    facultyCode: string;
    facultyName: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class FacultyService {

    private apiUrl = '/api/faculties';

    constructor(private http: HttpClient) { }

    getFaculties(): Observable<FacultyDTO[]> {
        return this.http.get<FacultyDTO[]>(this.apiUrl);
    }

    getFaculty(id: number): Observable<FacultyDTO> {
        return this.http.get<FacultyDTO>(`${this.apiUrl}/${id}`);
    }

    createFaculty(faculty: any): Observable<any> {
        return this.http.post(this.apiUrl, faculty);
    }

    updateFaculty(id: number, faculty: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, faculty);
    }

    deleteFaculty(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
