import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'http://localhost:8001/api/auth';
  private adminBase = 'http://localhost:8001/api/admin';

  constructor(private http: HttpClient, private router: Router) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.base}/login`, { email, password }).pipe(
      tap(res => {
        if (res && res.token) {
          this.setSession(res);
        }
      })
    );
  }
  setSession(res: any) {
    if (res.token) localStorage.setItem('auth_token', res.token);
    if (res.user) {
      localStorage.setItem('user_info', JSON.stringify(res.user));
      if (res.user.role) {
        localStorage.setItem('user_role', res.user.role);
      }
    }
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.base}/register`, { name, email, password });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(email: string, code: string, password: string, confirmPassword: string): Observable<any> {
    return this.http.post<any>(`${this.base}/reset-password`, { email, code, password, confirmPassword });
  }


  logout() {
    localStorage.clear();
    this.router.navigate(['/login'], { queryParams: { logout: 'success' } });
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getAuthHeaders() {
    const token = this.getToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  setToken(token: string) {
    if (token) localStorage.setItem('auth_token', token);
  }

  getRole(): string | null {
    return localStorage.getItem('user_role');
  }

  setRole(role: string) {
    if (role) localStorage.setItem('user_role', role);
  }

  getUserFromStorage(): any {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  oauth2Url(): string {
    return 'http://localhost:8001/oauth2/authorization/google';
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.adminBase}/users`, this.getAuthHeaders());
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.adminBase}/users/${id}`, this.getAuthHeaders());
  }

  getProfile(): Observable<any> {
    return this.http.get<any>('/api/profile');
  }
}