import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CourseSubjectGroup {
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    description?: string;
    credits: number;
    classCount: number;
    status: string;
}

export interface CourseClass {
    id: number;
    classCode: string;
    subjectId: number;
    subjectName: string;
    subjectCode: string;
    credits: number;
    lecturerName: string;
    lecturerId?: number;
    maxStudents: number;
    currentEnrolled: number;
    classStatus: string;
    registrationStart?: string;
    registrationEnd?: string;
    attendanceWeight?: number;
    midtermWeight?: number;
    finalWeight?: number;
    theoryPeriods?: number;
    practicalPeriods?: number;
    majorName?: string;
    targetClassName?: string;
    expectedRoom?: string;
    startDate?: string;
    endDate?: string;
    schedules: ClassSchedule[];
}

export interface ClassSchedule {
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    startTime?: string;
    endTime?: string;
    roomName: string;
    sessionType: string;
}

@Injectable({
    providedIn: 'root'
})
export class CourseClassService {
    private apiUrl = 'http://localhost:8001/api/course-classes';

    constructor(private http: HttpClient) { }

    getGroupedSubjects(semesterId: number, studentId?: number): Observable<CourseSubjectGroup[]> {
        let url = `${this.apiUrl}/subjects?semesterId=${semesterId}`;
        if (studentId) url += `&studentId=${studentId}`;
        return this.http.get<CourseSubjectGroup[]>(url);
    }

    getClassesBySemester(semesterId: number): Observable<CourseClass[]> {
        return this.http.get<CourseClass[]>(`${this.apiUrl}?semesterId=${semesterId}`);
    }

    getClassDetails(semesterId: number, subjectId: number): Observable<CourseClass[]> {
        return this.http.get<CourseClass[]>(`${this.apiUrl}/details?semesterId=${semesterId}&subjectId=${subjectId}`);
    }

    createCourseClass(semesterId: number, courseClass: any): Observable<CourseClass> {
        return this.http.post<CourseClass>(`${this.apiUrl}?semesterId=${semesterId}`, courseClass);
    }

    updateCourseClass(id: number, courseClass: any): Observable<CourseClass> {
        return this.http.put<CourseClass>(`${this.apiUrl}/${id}`, courseClass);
    }

    createBatchClasses(semesterId: number, classes: any[]): Observable<CourseClass[]> {
        return this.http.post<CourseClass[]>(`${this.apiUrl}/batch?semesterId=${semesterId}`, classes);
    }

    deleteCourseClass(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getDemandAnalysis(semesterId: number, cohort?: number, majorId?: number, curriculumId?: number): Observable<any[]> {
        let url = `${this.apiUrl}/analysis?semesterId=${semesterId}`;
        if (cohort) url += `&cohort=${cohort}`;
        if (majorId) url += `&majorId=${majorId}`;
        if (curriculumId) url += `&curriculumId=${curriculumId}`;
        return this.http.get<any[]>(url);
    }

    generateAutoBatch(semesterId: number, demands: any[]): Observable<CourseClass[]> {
        return this.http.post<CourseClass[]>(`${this.apiUrl}/auto-batch?semesterId=${semesterId}`, demands);
    }
}
