import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayoutComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  isSidebarOpen = false; // Mobile toggle
  isCollapsed = false;   // Desktop minimize

  currentUser: any = null;

  ngOnInit() {
    this.currentUser = this.auth.currentUser;
  }

  toggleSidebarMobile() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
