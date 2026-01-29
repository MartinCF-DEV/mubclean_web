import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-license',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="license-container">
      <div class="license-card">
        <div class="header">
          <h1>Licencia Mubclean</h1>
          <p class="subtitle">Activa tu negocio para comenzar a operar</p>
        </div>
        
        <div class="content">
          <div class="plan-details">
            <div class="price-tag">
              <span class="currency">$</span>
              <span class="amount">1,500</span>
              <span class="period">/año</span>
            </div>
            
            <ul class="features">
              <li><i class="fas fa-check-circle"></i> Gestión completa de empleados</li>
              <li><i class="fas fa-check-circle"></i> Panel de administración avanzado</li>
              <li><i class="fas fa-check-circle"></i> Soporte técnico prioritario</li>
              <li><i class="fas fa-check-circle"></i> Visibilidad en la app de clientes</li>
            </ul>
          </div>

          <div class="action-area">
            <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>
            
            <button (click)="initiatePayment()" [disabled]="isLoading" class="btn-pay">
              <i class="fas fa-lock" *ngIf="!isLoading"></i>
              <span *ngIf="!isLoading">Pagar con Mercado Pago</span>
              <span *ngIf="isLoading" class="spinner"></span>
            </button>
            
            <p class="secure-text"><i class="fas fa-shield-alt"></i> Pago 100% seguro</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .license-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
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
    .header-text h1 { font-size: 2rem; font-weight: 800; color: #1f2937; margin-bottom: 0.5rem; }
    .header-text p { color: #6b7280; }

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
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
    }

    .license-card.highlight {
        border-color: #2563eb;
        box-shadow: 0 20px 40px rgba(37, 99, 235, 0.1);
        transform: scale(1.02);
    }

    .plan-name { font-size: 1.5rem; font-weight: 700; color: #111827; }
    .plan-price { margin: 1.5rem 0; color: #1f2937; }
    .amount { font-size: 3rem; font-weight: 800; }
    .period { color: #6b7280; }

    .features { list-style: none; padding: 0; margin-bottom: 2rem; text-align: left; }
    .features li { margin-bottom: 0.75rem; color: #4b5563; display: flex; align-items: center; gap: 0.5rem; }
    .features i { color: #059669; }

    .btn-pay {
      margin-top: auto;
      width: 100%;
      padding: 1rem;
      border-radius: 12px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .btn-primary { background: #2563eb; color: white; }
    .btn-secondary { background: #eff6ff; color: #2563eb; }
    
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary:hover { background: #dbeafe; }
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

      const backendUrl = 'http://localhost:3000/api/create_license_preference';

      const price = type === 'monthly' ? 150 : 1500;
      const title = type === 'monthly'
        ? `Licencia Mensual - ${bus.nombre}`
        : `Licencia Anual - ${bus.nombre}`;

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bus.id,
          title: title,
          price: price,
          payerEmail: bus.email_contacto || user?.email
        })
      });

      if (!response.ok) {
        throw new Error('Error al conectar con el servidor de pagos');
      }

      const { init_point } = await response.json();
      window.location.href = init_point;

    } catch (e: any) {
      console.error(e);
      this.errorMessage = e.message || 'Ocurrió un error inesperado';
      this.isLoading = false;
    }
  }
}
