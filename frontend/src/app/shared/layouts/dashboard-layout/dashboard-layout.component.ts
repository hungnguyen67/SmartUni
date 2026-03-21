import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../../auth.service';

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html'
})
export class DashboardLayoutComponent implements OnInit {
  title = 'Tổng quan';
  isUserDropdownOpen = false;
  isSidebarOpen = true;
  openMenuName: string | null = null;

  currentUser: any = null;
  isAdmin: boolean = false;

  constructor(
    private auth: AuthService,
    public router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadUserData();

    const sidebarState = sessionStorage.getItem('adminSidebarState');
    if (sidebarState !== null) {
      this.isSidebarOpen = sidebarState === 'open';
    }

    if (this.isSidebarOpen) {
      const savedMenu = sessionStorage.getItem('adminMenuState');
      if (savedMenu !== null) {
        this.openMenuName = savedMenu === 'closed' ? null : savedMenu;
      } else {
        this.autoOpenMenuBasedOnUrl(this.router.url);
      }
    } else {
      this.openMenuName = null;
    }

    let isFirstLoad = true;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (isFirstLoad) {
        isFirstLoad = false;
      } else {
        this.autoOpenMenuBasedOnUrl(event.urlAfterRedirects);
        sessionStorage.setItem('adminMenuState', this.openMenuName ? this.openMenuName : 'closed');
      }
      this.updateTitle();
      this.cdr.detectChanges();
    });
  }

  private updateTitle() {
    let route = this.activatedRoute.firstChild;
    while (route?.firstChild) route = route.firstChild;
    this.title = route?.snapshot.data['title'] || 'Tổng quan';
  }

  autoOpenMenuBasedOnUrl(url: string) {
    const path = url.split('?')[0];

    if (this.isGroupActive(['/dashboard/users'])) {
      this.openMenuName = 'users';
    }
    else if (this.isGroupActive(['/dashboard/faculties', '/dashboard/programs', '/dashboard/knowledge-blocks', '/dashboard/subjects', '/dashboard/curriculum', '/dashboard/curriculums', '/dashboard/training-programs'])) {
      this.openMenuName = 'academic';
    }
    else if (this.isGroupActive(['/dashboard/students', '/dashboard/lecturers', '/dashboard/administrative-classes'])) {
      this.openMenuName = 'profiles';
    }
    else if (this.isGroupActive(['/dashboard/semesters', '/dashboard/sections', '/dashboard/schedules', '/dashboard/exams'])) {
      this.openMenuName = 'operation';
    }
    else {
      this.openMenuName = null;
    }

    this.cdr.detectChanges();
  }

  loadUserData() {
    this.currentUser = this.auth.getUserFromStorage();
    this.isAdmin = this.auth.getRole() === 'ADMIN';
  }

  getAvatarUrl(): string {
    if (!this.currentUser?.avatar) {
      const name = this.currentUser?.first_name || 'Admin';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
    }
    return this.currentUser.avatar;
  }

  isMenuOpen(menuName: string): boolean {
    return this.isSidebarOpen && this.openMenuName === menuName;
  }

  isGroupActive(urls: string[]): boolean {
    const currentUrl = this.router.url.split('?')[0];
    return urls.some(url => currentUrl === url || currentUrl.startsWith(url + '/'));
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    sessionStorage.setItem('adminSidebarState', this.isSidebarOpen ? 'open' : 'closed');

    if (this.isSidebarOpen) {
      const savedMenu = sessionStorage.getItem('adminMenuState');
      if (savedMenu !== null) {
        this.openMenuName = savedMenu === 'closed' ? null : savedMenu;
      } else {
        this.autoOpenMenuBasedOnUrl(this.router.url);
      }
    } else {
      this.openMenuName = null;
    }
  }

  toggleAdminMenu(menuName: string, event: Event) {
    event.stopPropagation();
    if (!this.isSidebarOpen) {
      this.isSidebarOpen = true;
      sessionStorage.setItem('adminSidebarState', 'open');
      this.openMenuName = menuName;
    } else {
      this.openMenuName = this.openMenuName === menuName ? null : menuName;
    }
    sessionStorage.setItem('adminMenuState', this.openMenuName ? this.openMenuName : 'closed');
  }

  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isUserDropdownOpen = false;
  }

  logout() {
    localStorage.clear();
    sessionStorage.clear();
    this.currentUser = null;
    this.router.navigate(['/login'], {
      queryParams: { message: 'Đăng xuất thành công!' }
    });
  }
}