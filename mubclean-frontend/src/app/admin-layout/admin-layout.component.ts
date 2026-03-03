import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { ToastService } from '../toast.service';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterModule, FormsModule, ToastComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayoutComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private toast = inject(ToastService);

  isSidebarOpen = false; // Mobile toggle
  isCollapsed = false;   // Desktop minimize

  currentUser: any = null;
  businessId: string | null = null;
  trialDaysRemaining: number | null = null;

  // Quick Reserve Modal State
  showQuickReserve = false;
  isSubmittingQR = false;
  qrName = '';
  qrPhone = '';
  qrAddress = '';
  qrService = '';
  qrTotal: number | null = null;

  ngOnInit() {
    this.currentUser = this.auth.currentUser;
    this.checkLicense();
  }

  async checkLicense() {
    // Force a fresh reload from Supabase to avoid race conditions after registration
    await this.auth.loadUserProfile();

    const profile = this.auth.profile;

    if (!profile) return;

    if (profile.business) {
      const business = profile.business;
      this.businessId = business.id;
      const now = new Date();
      const expiry = business.license_expiry ? new Date(business.license_expiry) : null;

      if (business.subscription_status !== 'active') {
        if (this.router.url.includes('/admin/payment') || this.router.url.includes('/admin/license')) return;
        this.toast.warning('Tu licencia no está activa. Por favor realiza el pago.');
        this.router.navigate(['/admin/license']);
      } else {
        if (business.prueba_utilizada && business.fecha_fin_prueba) {
          const end = new Date(business.fecha_fin_prueba);
          const diffTime = end.getTime() - now.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            if (this.router.url.includes('/admin/payment') || this.router.url.includes('/admin/license')) return;
            this.toast.warning('Tu periodo de prueba de 14 días ha finalizado. Por favor elige un plan.');
            this.router.navigate(['/admin/license']);
            return;
          } else {
            this.trialDaysRemaining = diffDays;
            this.cdr.detectChanges();
          }
        } else if (expiry && expiry < now) {
          if (this.router.url.includes('/admin/payment') || this.router.url.includes('/admin/license')) return;
          this.toast.warning('Tu licencia ha expirado. Por favor renueva tu suscripción.');
          this.router.navigate(['/admin/license']);
          return;
        }
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

  openQuickReserve() {
    this.showQuickReserve = true;
  }

  closeQuickReserve() {
    this.showQuickReserve = false;
    this.qrName = '';
    this.qrPhone = '';
    this.qrAddress = '';
    this.qrService = '';
    this.qrTotal = null;
  }

  async submitQuickReserve() {
    if (!this.businessId || !this.qrName || !this.qrPhone || !this.qrAddress) return;

    this.isSubmittingQR = true;
    try {
      // Format the address to include the contact info since this is a quick manual entry
      const formattedAddress = `Cliente: ${this.qrName} | Tel: ${this.qrPhone} | Dir: ${this.qrAddress}`;

      const newReq = {
        negocio_id: this.businessId,
        estado: 'agendada',
        direccion_servicio: formattedAddress,
        notas: `Servicio Rápido: ${this.qrService || 'No especificado'}`,
        fecha_solicitada_cliente: new Date().toISOString(),
        total_calculado: this.qrTotal || 0,
        nombre_cliente_manual: this.qrName // Adding a custom field in frontend, DB might ignore if doesn't exist, but it's safe
      };

      const { error } = await this.auth.client
        .from('solicitudes')
        .insert(newReq);

      if (error) throw error;

      this.toast.success('¡Reserva creada con éxito!');
      this.closeQuickReserve();

      const currentUrl = this.router.url;
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
      });

    } catch (e: any) {
      console.error('Error creating quick reserve', e);
      this.toast.error('Hubo un error al crear la reserva.');
    } finally {
      this.isSubmittingQR = false;
    }
  }
}
