import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayoutComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

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
      this.businessId = business.id;
      const now = new Date();
      const expiry = business.license_expiry ? new Date(business.license_expiry) : null;

      if (business.subscription_status !== 'active') {
        if (this.router.url.includes('/admin/payment') || this.router.url.includes('/admin/license')) return;

        alert('Tu licencia no está activa. Por favor realiza el pago.');
        this.router.navigate(['/admin/license']);
      } else {
        // It's active, check for trial or standard expiration
        if (business.prueba_utilizada && business.fecha_fin_prueba) {
          const end = new Date(business.fecha_fin_prueba);
          const diffTime = end.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            // Trial expired! The Wall
            if (this.router.url.includes('/admin/payment') || this.router.url.includes('/admin/license')) return;
            alert('Tu periodo de prueba de 14 días ha finalizado. Por favor elige un plan para continuar operando.');
            this.router.navigate(['/admin/license']);
            return;
          } else {
            // Show banner
            this.trialDaysRemaining = diffDays;
          }
        } else if (expiry && expiry < now) {
          // Standard expiration
          if (this.router.url.includes('/admin/payment') || this.router.url.includes('/admin/license')) return;
          alert('Tu licencia ha expirado. Por favor renueva tu suscripción.');
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

      alert('¡Reserva creada con éxito!');
      this.closeQuickReserve();

      // Optionally refresh current route to show new data
      const currentUrl = this.router.url;
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
      });

    } catch (e: any) {
      console.error('Error creating quick reserve', e);
      alert('Hubo un error al crear la reserva.');
    } finally {
      this.isSubmittingQR = false;
    }
  }
}
