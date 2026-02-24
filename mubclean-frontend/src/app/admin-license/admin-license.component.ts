import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-license',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="license-container">
      <div class="license-wrapper">
        <div class="header-text">
            <h1>Activa tu suscripción</h1>
            <p>Selecciona un plan para continuar operando tu negocio.</p>
        </div>
        
        <div class="cards-row">
            <!-- Monthly -->
            <div class="license-card">
              <div class="plan-name">Mensual</div>
              <div class="plan-price">
                <span class="currency">$</span>
                <span class="amount">150</span>
                <span class="period">/mes</span>
              </div>
              <ul class="features">
                <li><i class="fas fa-check"></i> Acceso completo</li>
                <li><i class="fas fa-check"></i> Cancelación flexible</li>
              </ul>
              <button (click)="initiatePayment('monthly')" [disabled]="isLoading" class="btn-pay btn-secondary">
                Pagar Mensual
              </button>
            </div>

            <!-- Annual -->
            <div class="license-card highlight">
              <div class="plan-name">Anual</div>
              <div class="plan-price">
                <span class="currency">$</span>
                <span class="amount">1,500</span>
                <span class="period">/año</span>
              </div>
              <ul class="features">
                <li><i class="fas fa-check"></i> <strong>2 meses GRATIS</strong></li>
                <li><i class="fas fa-check"></i> Soporte VIP</li>
                <li><i class="fas fa-check"></i> Verificado</li>
              </ul>
              <button (click)="initiatePayment('annual')" [disabled]="isLoading" class="btn-pay btn-primary">
                Pagar Anual
              </button>
            </div>
        </div>
        
        <p *ngIf="errorMessage" class="error-message" style="margin-top: 2rem;">{{ errorMessage }}</p>
      </div>
    </div>
  `,
  styles: [`
    .license-container {
      min-height: 100vh;
      background-color: #f8fafc;
      padding: 2rem;
      font-family: 'Inter', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .license-wrapper {
        text-align: center;
        width: 100%;
        max-width: 900px;
    }

    .header-text { margin-bottom: 2rem; }
    .header-text h1 { font-family: 'Fraunces', serif; font-size: 2.5rem; font-weight: 800; color: #000; margin-bottom: 0.5rem; }
    .header-text p { color: #000; font-weight: 600;}

    .cards-row {
      display: flex;
      gap: 2rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .license-card {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      flex: 1;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 6px 6px 0 #000;
      border: 3px solid #000;
      display: flex;
      flex-direction: column;
      transition: all 0.2s;
    }

    .license-card.highlight {
        background: #F8FAFC;
        box-shadow: 8px 8px 0 #000;
        transform: translate(-2px, -2px);
    }

    .plan-name { font-size: 1.5rem; font-weight: 800; color: #000; font-family: 'Fraunces', serif; }
    .plan-price { margin: 1.5rem 0; color: #000; }
    .amount { font-size: 3.5rem; font-weight: 800; font-family: 'Fraunces', serif; }
    .period { color: #555; font-weight: 700; }

    .features { list-style: none; padding: 0; margin-bottom: 2rem; text-align: left; }
    .features li { margin-bottom: 0.75rem; color: #000; display: flex; align-items: center; gap: 0.5rem; font-weight: 600;}
    .features i { color: #1565C0; }

    .btn-pay {
      margin-top: auto;
      width: 100%;
      padding: 1rem;
      border-radius: 12px;
      border: 2px solid #000;
      font-weight: 800;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
      box-shadow: 4px 4px 0 #000;
      font-family: 'Inter', sans-serif;
    }

    .btn-primary { background: #1565C0; color: white; }
    .btn-secondary { background: white; color: #000; }
    
    .btn-primary:hover { background: #1976D2; transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #000; }
    .btn-secondary:hover { background: #F8FAFC; transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #000;}
  `]
})
export class AdminLicenseComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    if (!this.auth.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  async initiatePayment(type: 'monthly' | 'annual') {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user = this.auth.currentUser;
      const profile = this.auth.profile;
      const business = profile?.business; // Ensure updated

      if (!business) {
        // Try reloading just in case
        await this.auth.loadUserProfile();
        if (!this.auth.profile?.business)
          throw new Error('No se encontró información del negocio.');
      }

      const bus = this.auth.profile.business;

      const backendUrl = `${environment.apiUrl}/create_license_preference`;

      const price = type === 'monthly' ? 150 : 1500;
      const title = type === 'monthly'
        ? `Licencia Mensual - ${bus.nombre}`
        : `Licencia Anual - ${bus.nombre}`;

      // alert(`Debug: Iniciando pago... URL: ${backendUrl}`);

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bus.id,
          title: title,
          price: price,
          payerEmail: bus.email_contacto || user?.email,
          planType: type // Send plan type
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error || response.statusText;
        alert(`Error Backend License (${response.status}): ${errMsg}`);
        throw new Error('Error al conectar con el servidor de pagos: ' + errMsg);
      }

      const { init_point } = await response.json();
      window.location.href = init_point;

    } catch (e: any) {
      console.error(e);
      this.errorMessage = e.message || 'Ocurrió un error inesperado';
      alert("Error: " + this.errorMessage);
      this.isLoading = false;
    }
  }
}
