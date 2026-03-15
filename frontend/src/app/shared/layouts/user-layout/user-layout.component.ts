import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth.service';
import { FlashMessageService } from '../../components/flash-message/flash-message.component';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html'
})
export class UserLayoutComponent implements OnInit {
  isUserDropdownOpen = false;
  isSidebarOpen = true;
  openMenuName: string | null = null;
  currentUser: any = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private flashMessage: FlashMessageService
  ) { }

  ngOnInit() {
    this.loadUserData();
    this.autoOpenMenuBasedOnUrl(this.router.url);
  }

  autoOpenMenuBasedOnUrl(url: string) {
    if (url.includes('/home/grades') || url.includes('/home/curriculum')) {
      this.openMenuName = 'learning';
    } else if (url.includes('/home/register-course')) {
      this.openMenuName = 'registration';
    } else {
      this.openMenuName = null;
    }
  }

  loadUserData() {
    this.currentUser = this.auth.getUserFromStorage();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    if (!this.isSidebarOpen) {
      this.openMenuName = null;
    } else {
      this.autoOpenMenuBasedOnUrl(this.router.url);
    }
  }

  toggleMenu(menuName: string, event: Event) {
    event.stopPropagation();
    if (!this.isSidebarOpen) {
      this.isSidebarOpen = true;
      this.openMenuName = menuName;
    } else {
      this.openMenuName = this.openMenuName === menuName ? null : menuName;
    }
  }

  isMenuOpen(menuName: string): boolean {
    return this.isSidebarOpen && this.openMenuName === menuName;
  }

  isParentActive(paths: string[]): boolean {
    return paths.some(path => this.router.url.includes(path));
  }

  getAvatarUrl(): string {
    if (!this.currentUser?.avatar) {
      const name = this.currentUser?.name || 'User';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=80`;
    }
    return this.currentUser.avatar.startsWith('http')
      ? this.currentUser.avatar
      : 'http://localhost:8001' + this.currentUser.avatar;
  }

  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.isUserDropdownOpen = false;
  }

  logout() {
    localStorage.clear();
    this.currentUser = null;
    this.router.navigate(['/login'], {
      queryParams: { message: 'Đăng xuất thành công!' }
    });
  }
}