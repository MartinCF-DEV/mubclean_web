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
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      padding: 1rem;
      font-family: 'Inter', sans-serif;
    }

    .license-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 450px;
      overflow: hidden;
    }

    .header {
      background: #111827;
      color: white;
      padding: 2rem;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .subtitle {
      color: #9ca3af;
      margin-top: 0.5rem;
      font-size: 0.9rem;
    }

    .content {
      padding: 2rem;
    }

    .price-tag {
      text-align: center;
      margin-bottom: 2rem;
      color: #111827;
    }

    .currency { font-size: 1.5rem; vertical-align: top; font-weight: 600; }
    .amount { font-size: 3.5rem; font-weight: 800; line-height: 1; }
    .period { color: #6b7280; font-weight: 500; font-size: 1rem; }

    .features {
      list-style: none;
      padding: 0;
      margin: 0 0 2rem 0;
    }

    .features li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      color: #374151;
    }

    .features i {
      color: #059669;
      font-size: 1.1rem;
    }

    .btn-pay {
      width: 100%;
      background: #009ee3; /* Mercado Pago Blue */
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: background 0.2s;
    }

    .btn-pay:hover {
      background: #0081bb;
    }

    .btn-pay:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .secure-text {
      text-align: center;
      color: #6b7280;
      font-size: 0.8rem;
      margin-top: 1rem;
    }

    .error-message {
      color: #dc2626;
      text-align: center;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .spinner {
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top: 3px solid white;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class AdminLicenseComponent implements OnInit {
    auth = inject(AuthService);
    router = inject(Router);
    isLoading = false;
    errorMessage = '';

    ngOnInit() {
        // Ensure we have user data
        if (!this.auth.currentUser) {
            this.router.navigate(['/login']);
        }
    }

    async initiatePayment() {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const user = this.auth.currentUser;
            const profile = this.auth.profile;
            const business = profile?.business;

            if (!business) {
                throw new Error('No se encontró información del negocio.');
            }

            const backendUrl = 'http://localhost:3000/api/create_license_preference';

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: business.id,
                    title: `Licencia Anual - ${business.nombre}`,
                    price: 1500,
                    payerEmail: business.email_contacto || user?.email
                })
            });

            if (!response.ok) {
                throw new Error('Error al conectar con el servidor de pagos');
            }

            const { init_point } = await response.json();

            // Redirect to Mercado Pago
            window.location.href = init_point;

        } catch (e: any) {
            console.error(e);
            this.errorMessage = e.message || 'Ocurrió un error inesperado';
            this.isLoading = false;
        }
    }
}
