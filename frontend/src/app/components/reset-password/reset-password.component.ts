import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { FlashMessageService } from '../../shared/components/flash-message/flash-message.component';
import { PasswordInputComponent } from '../../shared/components/password-input/password-input.component';
import { PasswordChecklistComponent } from '../../shared/components/password-checklist/password-checklist.component';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  loading = false;
  success = false;
  isPasswordValid = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private flashMessage: FlashMessageService
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const emailFromUrl = params['email'] || '';
      if (emailFromUrl) {
        this.resetForm.patchValue({ email: emailFromUrl });
      }
    });

    this.passwordControl.valueChanges.subscribe(value => {
      this.checkPasswordValid(value);
    });
  }

  get passwordControl(): FormControl {
    return this.resetForm.get('password') as FormControl;
  }

  get confirmPasswordControl(): FormControl {
    return this.resetForm.get('confirmPassword') as FormControl;
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private checkPasswordValid(password: string): void {
    if (!password) {
      this.isPasswordValid = false;
      return;
    }
    const lengthCheck = password.length >= 8;
    const lowercaseCheck = /[a-z]/.test(password);
    const uppercaseCheck = /[A-Z]/.test(password);
    const numberCheck = /\d/.test(password);
    const specialCheck = /[@$!%*?&]/.test(password);
    const spacesCheck = !/\s/.test(password);
    this.isPasswordValid = lengthCheck && lowercaseCheck && uppercaseCheck && numberCheck && specialCheck && spacesCheck;
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const { email, code, password, confirmPassword } = this.resetForm.value;

    this.auth.resetPassword(email, code, password, confirmPassword).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { message: response?.message } });
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        this.flashMessage.handleError(error);
      }
    });
  }

  private markFormGroupTouched() {
    Object.values(this.resetForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}