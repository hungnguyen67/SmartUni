import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';

import { LoginPasswordComponent } from './components/login-password/login-password.component';
import { DashboardComponent } from './components/admin/dashboard/dashboard.component';
import { DashboardLayoutComponent } from './shared/layouts/dashboard-layout/dashboard-layout.component';
import { UserLayoutComponent } from './shared/layouts/user-layout/user-layout.component';
import { UsersComponent } from './components/admin/users/users.component';
import { SemestersComponent } from './components/admin/semesters/semesters.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { FlashMessageComponent } from './shared/components/flash-message/flash-message.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { PasswordChecklistComponent } from './shared/components/password-checklist/password-checklist.component';
import { ScheduleComponent } from './components/admin/schedule/schedule.component';
import { MiniCalendarComponent } from './shared/components/mini-calendar/mini-calendar.component';
import { ProgramsComponent } from './components/admin/programs/programs.component';
import { LecturersComponent } from './components/admin/lecturers/lecturers.component';
import { StudentsComponent } from './components/admin/students/students.component';
import { AuthGuard } from './auth.guard';
import { AuthInterceptor } from './auth.interceptor';
import { CurriculumComponent } from './components/user/curriculum/curriculum.component';
import { RegistrationComponent } from './components/user/registration/registration.component';
import { PasswordInputComponent } from './shared/components/password-input/password-input.component';
import { CourseClassesComponent } from './components/admin/course-classes/course-classes.component';
import { CurriculumsComponent } from './components/admin/curriculums/curriculums.component';
import { AdministrativeClassesComponent } from './components/admin/administrative-classes/administrative-classes.component';
import { FacultiesComponent } from './components/admin/faculties/faculties.component';
import { SubjectsComponent } from './components/admin/subjects/subjects.component';
import { UserScheduleComponent } from './components/user/schedule/schedule.component';
import { CourseClassComponent } from './components/user/course-class/course-class.component';
import { AdministrativeClassComponent } from './components/user/administrative-class/administrative-class.component';
import { ExamScheduleComponent } from './components/admin/exam-schedule/exam-schedule.component';
import { UserExamScheduleComponent } from './components/user/exam-schedule/exam-schedule.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginPasswordComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: 'home',
    component: UserLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'schedule', pathMatch: 'full' },
      { path: 'curriculum', component: CurriculumComponent, canActivate: [AuthGuard], data: { role: 'STUDENT' } },
      { path: 'register-course', component: RegistrationComponent, canActivate: [AuthGuard], data: { role: 'STUDENT' } },
      { path: 'grades', component: DashboardComponent, canActivate: [AuthGuard], data: { role: 'STUDENT' } },
      { path: 'schedule', component: UserScheduleComponent, canActivate: [AuthGuard] },
      { path: 'course-classes', component: CourseClassComponent, canActivate: [AuthGuard], data: { role: 'LECTURER' } },
      { path: 'administrative-classes', component: AdministrativeClassComponent, canActivate: [AuthGuard], data: { role: 'LECTURER' } },
      { path: 'exams', component: UserExamScheduleComponent, canActivate: [AuthGuard] }
    ]
  },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMIN' },
    children: [
      { path: '', component: DashboardComponent },
      { path: 'users', component: UsersComponent },
      { path: 'semesters', component: SemestersComponent },
      { path: 'programs', component: ProgramsComponent },
      { path: 'training-programs', component: CurriculumsComponent },
      { path: 'knowledge-blocks', component: DashboardComponent },
      { path: 'administrative-classes', component: AdministrativeClassesComponent },
      { path: 'faculties', component: FacultiesComponent },
      { path: 'lecturers', component: LecturersComponent },
      { path: 'students', component: StudentsComponent },
      { path: 'subjects', component: SubjectsComponent },
      { path: 'sections', component: CourseClassesComponent },
      { path: 'schedules', component: ScheduleComponent },
      { path: 'exams', component: ExamScheduleComponent },
      { path: 'grades', component: DashboardComponent },
      { path: 'reports', component: DashboardComponent },
      { path: 'notifications', component: DashboardComponent }
    ]
  },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [AuthGuard] },
  { path: 'oauth2/redirect', component: LoginPasswordComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,

    LoginPasswordComponent,
    DashboardComponent,
    DashboardLayoutComponent,
    UserLayoutComponent,
    UsersComponent,
    SemestersComponent,
    CourseClassesComponent,
    CurriculumsComponent,
    AdministrativeClassesComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    ChangePasswordComponent,
    ScheduleComponent,
    MiniCalendarComponent,
    ProgramsComponent,
    LecturersComponent,
    StudentsComponent,
    FacultiesComponent,
    SubjectsComponent,
    FlashMessageComponent,
    PasswordChecklistComponent,
    PasswordInputComponent,
    CurriculumComponent,
    RegistrationComponent,
    UserScheduleComponent,
    CourseClassComponent,
    AdministrativeClassComponent,
    ExamScheduleComponent,
    UserExamScheduleComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
