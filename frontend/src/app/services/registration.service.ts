import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RegistrationService {
    private apiUrl = 'http://localhost:8001/api/registrations';
    
    // Broadcast updates to other components
    private registrationUpdates = new Subject<void>();
    registrationUpdates$ = this.registrationUpdates.asObservable();

    constructor(private http: HttpClient) { }

    notifyUpdate() {
        this.registrationUpdates.next();
    }

    getRegistrationsByStudent(studentId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/student/${studentId}`);
    }

    getRegistrationsByStudentAndSemester(studentId: number, semesterId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/student/${studentId}/semester/${semesterId}`);
    }

    register(studentId: number, classId: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}?studentId=${studentId}&classId=${classId}`, {}).pipe(
            tap(() => this.notifyUpdate())
        );
    }

    getRegistrationsByClass(classId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/class/${classId}`);
    }

    updateGrades(dtos: any[]): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/batch-save`, dtos);
    }

    lockGrades(classId: number): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/lock/${classId}`, {});
    }

    drop(registrationId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${registrationId}`).pipe(
            tap(() => this.notifyUpdate())
        );
    }
}
