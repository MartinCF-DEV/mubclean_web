import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-public-license',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="license-container">
      <div class="license-card">
        <div class="header">
          <h1>Planes para Empresas</h1>
          <p class="subtitle">Únete a Mubclean y haz crecer tu negocio</p>
        </div>
        
        <div class="content">
          <div class="plan-details">
            <div class="price-tag">
              <span class="currency">$</span>
              <span class="amount">1,500</span>
              <span class="period">/año</span>
            </div>
            
            <ul class="features">
              <li><i class="fas fa-check-circle"></i> Gestión de empleados y cuadrillas</li>
              <li><i class="fas fa-calendar-check"></i> Agenda y asignación inteligente</li>
              <li><i class="fas fa-search-location"></i> Visibilidad para miles de clientes</li>
              <li><i class="fas fa-chart-line"></i> Reportes y estadísticas</li>
              <li><i class="fas fa-headset"></i> Soporte técnico prioritario</li>
            </ul>
          </div>

          <div class="action-area">
            <button (click)="goToRegister()" class="btn-start">
              <span>Seleccionar Licencia Anual</span>
              <i class="fas fa-arrow-right"></i>
            </button>
            
            <p class="info-text">
                <i class="fas fa-info-circle"></i>
                Al seleccionar este plan, procederás a crear tu cuenta y registrar tu negocio. El pago se realizará al finalizar el registro.
            </p>
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
      background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
      padding: 1rem;
      font-family: 'Inter', sans-serif;
    }

    .license-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 40px -5px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 480px;
      overflow: hidden;
      border: 1px solid #f3f4f6;
    }

    .header {
      background: #1e293b;
      color: white;
      padding: 2.5rem 2rem;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .subtitle {
      color: #94a3b8;
      margin-top: 0.75rem;
      font-size: 1rem;
    }

    .content {
      padding: 2.5rem 2rem;
    }

    .price-tag {
      text-align: center;
      margin-bottom: 2.5rem;
      color: #1e293b;
      position: relative;
    }

    .currency { font-size: 1.5rem; vertical-align: top; font-weight: 600; margin-right: 2px; }
    .amount { font-size: 4rem; font-weight: 800; line-height: 1; letter-spacing: -0.05em; }
    .period { color: #64748b; font-weight: 500; font-size: 1.1rem; }

    .features {
      list-style: none;
      padding: 0;
      margin: 0 0 2.5rem 0;
    }

    .features li {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
      color: #334155;
      font-size: 1.05rem;
    }

    .features i {
      color: #10b981;
      font-size: 1.25rem;
      width: 24px;
      text-align: center;
    }

    .btn-start {
      width: 100%;
      background: #2563eb;
      color: white;
      border: none;
      padding: 1.25rem;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }

    .btn-start:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3);
    }

    .btn-start:active {
      transform: translateY(0);
    }

    .info-text {
      text-align: center;
      color: #64748b;
      font-size: 0.85rem;
      margin-top: 1.5rem;
      line-height: 1.5;
    }
  `]
})
export class PublicLicenseComponent {
    router = inject(Router);

    goToRegister() {
        this.router.navigate(['/admin/register']);
    }
}
