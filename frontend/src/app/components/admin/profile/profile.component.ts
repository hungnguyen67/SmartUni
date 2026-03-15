import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../auth.service';
import { FlashMessageService, FlashMessageComponent } from '../../../shared/components/flash-message/flash-message.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  user: any = {};
  editForm!: FormGroup;
  showEditModal = false;
  updating = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private auth: AuthService,
    private flashMessage: FlashMessageService
  ) { }

  get isFormUnchanged(): boolean {
    const formValue = this.editForm.value;
    return (
      formValue.name === (this.user?.name || '') &&
      formValue.phone === (this.user?.phone || '') &&
      formValue.address === (this.user?.address || '')
    );
  }

  ngOnInit() {
    this.loadUserProfile();
    this.initEditForm();
  }

  getAvatarUrl(): string {
    if (!this.user || !this.user.avatar) {
      const name = this.user?.name || 'User';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=80`;
    }
    if (this.user.avatar.startsWith('http')) {
      return this.user.avatar;
    }
    return 'http://localhost:8001' + this.user.avatar;
  }

  loadUserProfile() {
    this.auth.getProfile().subscribe({
      next: (data: any) => {
        this.user = data;
        this.initEditForm();
      },
      error: (err) => {
        this.flashMessage.handleError(err);
      }
    });
  }

  initEditForm() {
    this.editForm = this.fb.group({
      name: [this.user?.name || '', Validators.required],
      phone: [this.user?.phone || ''],
      address: [this.user?.address || '']
    });
  }

  openEditModal() {
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.updating = false;
    this.initEditForm();
  }

  handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeEditModal();
    }
  }

  updateProfile() {
    if (this.editForm.valid) {
      this.updating = true;
      const updates = this.editForm.value;
      this.http.put('http://localhost:8001/api/profile', updates, this.auth.getAuthHeaders()).subscribe({
        next: (response: any) => {
          this.flashMessage.success('Cập nhật thông tin thành công!');
          this.loadUserProfile();
          this.closeEditModal();
        },
        error: (err) => {
          this.updating = false;
          this.flashMessage.handleError(err);
        }
      });
    }
  }
}