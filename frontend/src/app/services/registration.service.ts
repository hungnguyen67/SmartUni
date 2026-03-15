import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RegistrationService {
    private apiUrl = 'http://localhost:8001/api/registrations';

    constructor(private http: HttpClient) { }

    getRegistrationsByStudent(studentId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/student/${studentId}`);
    }

    getRegistrationsByStudentAndSemester(studentId: number, semesterId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/student/${studentId}/semester/${semesterId}`);
    }

    register(studentId: number, classId: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}?studentId=${studentId}&classId=${classId}`, {});
    }

    drop(registrationId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${registrationId}`);
    }
}
