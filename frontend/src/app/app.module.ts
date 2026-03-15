import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/user/home/home.component';
import { LoginPasswordComponent } from './components/login-password/login-password.component';
import { DashboardComponent } from './components/admin/dashboard/dashboard.component';
import { DashboardLayoutComponent } from './shared/layouts/dashboard-layout/dashboard-layout.component';
import { UserLayoutComponent } from './shared/layouts/user-layout/user-layout.component';
import { UsersComponent } from './components/admin/users/users.component';
import { SemestersComponent } from './components/admin/semesters/semesters.component';
import { SettingsComponent } from './shared/layouts/setting-layout/setting-layout.component';
import { ProfileComponent } from './components/admin/profile/profile.component';
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
      { path: '', component: HomeComponent },
      { path: 'grades', component: HomeComponent },
      { path: 'curriculum', component: CurriculumComponent },
      { path: 'register-course', component: RegistrationComponent }
    ]
  },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard],
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
      { path: 'exams', component: DashboardComponent },
      { path: 'grades', component: DashboardComponent },
      { path: 'reports', component: DashboardComponent },
      { path: 'notifications', component: DashboardComponent },
      {
        path: 'settings',
        component: SettingsComponent,
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          { path: 'profile', component: ProfileComponent },
          { path: 'change-password', component: ChangePasswordComponent },
          { path: 'notifications', component: ProfileComponent }
        ]
      }
    ]
  },
  { path: 'oauth2/redirect', component: LoginPasswordComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginPasswordComponent,
    DashboardComponent,
    DashboardLayoutComponent,
    UserLayoutComponent,
    UsersComponent,
    SemestersComponent,
    CourseClassesComponent,
    CurriculumsComponent,
    AdministrativeClassesComponent,
    SettingsComponent,
    ProfileComponent,
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
    RegistrationComponent
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