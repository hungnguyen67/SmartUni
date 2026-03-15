import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MajorDTO {
  id: number;
  majorCode: string;
  majorName: string;
  facultyId: number;
  facultyName: string;
  facultyCode: string;
  description: string;
  numberOfCurriculums: number;
  totalCreditsRequired: number;
  activeCurriculumName: string;
  totalSubjects: number;
  totalKnowledgeBlocks: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MajorService {

  private apiUrl = '/api/majors';

  constructor(private http: HttpClient) { }

  getMajors(): Observable<MajorDTO[]> {
    return this.http.get<MajorDTO[]>(this.apiUrl);
  }

  getMajor(id: number): Observable<MajorDTO> {
    return this.http.get<MajorDTO>(`${this.apiUrl}/${id}`);
  }

  createMajor(major: any): Observable<any> {
    return this.http.post(this.apiUrl, major);
  }

  updateMajor(id: number, major: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, major);
  }

  deleteMajor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}