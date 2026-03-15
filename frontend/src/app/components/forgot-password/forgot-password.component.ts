import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { FlashMessageService } from '../../shared/components/flash-message/flash-message.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  loading = false;
  success = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private flashMessage: FlashMessageService
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) {
      const emailControl = this.forgotForm.get('email');

      if (emailControl?.hasError('required')) {
        this.flashMessage.warning('Vui lòng nhập địa chỉ Email để tiếp tục!');
      } else if (emailControl?.hasError('email')) {
        this.flashMessage.warning('Địa chỉ Email không đúng định dạng!');
      }

      emailControl?.markAsTouched();
      return;
    }

    this.loading = true;
    const { email } = this.forgotForm.value;

    this.auth.forgotPassword(email).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        this.flashMessage.handleSuccess(response);
      },
      error: (error) => {
        this.loading = false;
        this.flashMessage.handleError(error);
      }
    });
  }

  goToReset() {
    const email = this.forgotForm.get('email')?.value;
    this.router.navigate(['/reset-password'], { queryParams: { email } });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}