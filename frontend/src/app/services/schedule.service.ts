import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConflictInfo {
    type: string;
    content: string;
}

@Injectable({
    providedIn: 'root'
})
export class ScheduleService {
    private apiUrl = 'http://localhost:8001/api/schedules';

    constructor(private http: HttpClient) { }

    generateInstances(classId: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/generate/${classId}`, {});
    }

    addPattern(classId: number, pattern: any): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/patterns/${classId}`, pattern);
    }

    addPatternsBulk(classId: number, patterns: any[]): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/patterns/${classId}/bulk`, patterns);
    }

    getScheduleByCourseClass(classId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/class/${classId}`);
    }

    getConflicts(classId: number): Observable<ConflictInfo[]> {
        return this.http.get<ConflictInfo[]>(`${this.apiUrl}/conflicts/${classId}`);
    }

    deletePattern(patternId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/patterns/${patternId}`);
    }

    deletePatternSingle(patternId: number, week: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/patterns/${patternId}/single`, { params: { week } });
    }

    deletePatternForward(patternId: number, week: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/patterns/${patternId}/forward`, { params: { week } });
    }

    updatePattern(patternId: number, startPeriod: number, endPeriod: number, roomName?: string, lecturerName?: string): Observable<void> {
        let params: any = { 
            startPeriod: startPeriod, 
            endPeriod: endPeriod 
        };
        
        // Use empty string to clear value, otherwise pass the value
        params.roomName = roomName !== undefined && roomName !== null ? roomName : '';
        params.lecturerName = lecturerName !== undefined && lecturerName !== null ? lecturerName : '';

        return this.http.patch<void>(`${this.apiUrl}/patterns/${patternId}`, {}, { params });
    }

    getStudentSchedule(studentId: number, semesterId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/student/${studentId}/semester/${semesterId}`);
    }

    getLecturerSchedule(lecturerId: number, semesterId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/lecturer/${lecturerId}/semester/${semesterId}`);
    }

    getSessionDetail(instanceId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/sessions/${instanceId}?t=${new Date().getTime()}`);
    }

    openAttendance(instanceId: number, code: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/attendance/open`, {}, { params: { instanceId, code } });
    }

    submitManualAttendance(dto: any): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/attendance/manual`, dto);
    }

    selfAttend(code: string, studentId: number, instanceId: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/attendance/self`, {}, { params: { code, studentId, instanceId } });
    }

    finalizeAttendance(instanceId: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/attendance/finalize`, {}, { params: { instanceId } });
    }
}
