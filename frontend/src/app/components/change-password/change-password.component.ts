import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PasswordInputComponent } from '../../shared/components/password-input/password-input.component';
import { PasswordChecklistComponent } from '../../shared/components/password-checklist/password-checklist.component';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { FlashMessageService } from '../../shared/components/flash-message/flash-message.component';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent {
  form: FormGroup;
  loading = false;
  private readonly API_URL = 'http://localhost:8001/api/profile/change-password';

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService,
    private flashMessage: FlashMessageService
  ) {
    this.form = new FormGroup({
      currentPassword: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required])
    });
  }

  get currentPasswordControl(): FormControl {
    return this.form.get('currentPassword') as FormControl;
  }

  get newPasswordControl(): FormControl {
    return this.form.get('newPassword') as FormControl;
  }

  get confirmPasswordControl(): FormControl {
    return this.form.get('confirmPassword') as FormControl;
  }

  submit() {
    if (this.form.invalid) {
      this.flashMessage.warning('Vui lòng điền đầy đủ các trường!');
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.form.value;

    if (newPassword !== confirmPassword) {
      this.flashMessage.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    this.loading = true;

    this.http.put(this.API_URL, {
      oldPassword: currentPassword,
      newPassword: newPassword,
      confirmPassword: confirmPassword
    }, this.auth.getAuthHeaders()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.flashMessage.success(res.message || 'Thay đổi mật khẩu thành công!');

        const role = localStorage.getItem('user_role');
        const target = role === 'ADMIN' ? '/dashboard' : '/home/schedule';
        this.router.navigate([target]);
      },
      error: (err) => {
        this.loading = false;
        this.flashMessage.handleError(err);
      }
    });
  }
}
