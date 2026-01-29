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
    this.checkLicense();
  }

  async checkLicense() {
    const profile = this.auth.profile;

    // Check if we have profile and business data loaded (might need to wait or rely on signal effect)
    // For simplicity, we assume auth service loads it. 
    // Ideally we should use an effect() or subscribe to the signal.

    // Simple check if data is already there or rely on auth to reload
    // We will do a direct check here to be safe if auth is still loading
    if (!profile) {
      // Wait for auth? relying on auth service redirecting if not logged in.
      return;
    }

    if (profile.business) {
      const business = profile.business;
      const now = new Date();
      const expiry = business.license_expiry ? new Date(business.license_expiry) : null;

      if (business.subscription_status !== 'active') {
        // Redirect if not active (e.g. pending)
        // But allow them to see payment pages, so check route. 
        // Since this is the layout for dashboard, we block.
        if (this.router.url.includes('/admin/payment')) return; // Allow payment callbacks

        alert('Tu licencia no está activa. Por favor realiza el pago.');
        // Force payment flow or logout?
        // Maybe redirect to a specific "pay now" page or show modal.
        // For now, redirect to payment pending page if exists or show alert.
      } else if (expiry && expiry < now) {
        alert('Tu licencia ha expirado. Por favor renueva tu suscripción.');
        // Logic to redirect to renewal
        if (this.router.url.includes('/admin/payment')) return;
        // Redirect to a renewal options page? 
        // For MVP: Alert and maybe redirect to support or payment.
      }
    }
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
