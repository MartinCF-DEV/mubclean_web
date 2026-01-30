import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-public-license',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="license-container">
      <div class="header-section">
        <h1>Planes Flexibles</h1>
        <p class="subtitle">Elige la opción perfecta para tu negocio. Cambia de plan cuando quieras.</p>
      </div>
      
      <div class="cards-grid">
        <!-- Trial Plan -->
        <div class="license-card trial">
          <div class="card-header">
            <h2>Prueba Gratuita</h2>
            <p>Perfecto para explorar</p>
          </div>
          <div class="price-section">
            <span class="amount">Gratis</span>
            <span class="period">/30 seg</span>
          </div>
          <ul class="features">
            <li><i class="fas fa-check"></i> Acceso total</li>
            <li><i class="fas fa-check"></i> Sin compromiso</li>
            <li><i class="fas fa-check"></i> Crea tu perfil</li>
          </ul>
          <button (click)="goToRegister('trial')" class="btn-plan btn-trial">Probar Gratis</button>
        </div>

        <!-- Monthly Plan -->
        <div class="license-card monthly">
          <div class="card-header">
            <h2>Mensual</h2>
            <p>Libertad total</p>
          </div>
          <div class="price-section">
            <span class="currency">$</span>
            <span class="amount">150</span>
            <span class="period">/mes</span>
          </div>
          <ul class="features">
            <li><i class="fas fa-check"></i> Todo lo incluido</li>
            <li><i class="fas fa-check"></i> Facturación mensual</li>
            <li><i class="fas fa-check"></i> Cancela cuando quieras</li>
          </ul>
          <button (click)="goToRegister('monthly')" class="btn-plan btn-monthly">Elegir Mensual</button>
        </div>

        <!-- Annual Plan -->
        <div class="license-card annual">
          <div class="badge">MEJOR VALOR</div>
          <div class="card-header">
            <h2>Anual</h2>
            <p>Ahorra 2 meses</p>
          </div>
          <div class="price-section">
            <span class="currency">$</span>
            <span class="amount">1,500</span>
            <span class="period">/año</span>
          </div>
          <ul class="features">
            <li><i class="fas fa-check"></i> <strong>2 meses gratis</strong></li>
            <li><i class="fas fa-check"></i> Soporte Prioritario</li>
            <li><i class="fas fa-check"></i> Insignia de Verificado</li>
          </ul>
          <button (click)="goToRegister('annual')" class="btn-plan btn-annual">Elegir Anual</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .license-container {
      min-height: 100vh;
      background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 4rem 1rem;
      font-family: 'Inter', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .header-section {
      text-align: center;
      margin-bottom: 4rem;
    }

    .header-section h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1rem;
    }

    .subtitle {
      color: #64748b;
      font-size: 1.1rem;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      width: 100%;
      padding: 0 1rem;
    }

    .license-card {
      background: white;
      border-radius: 24px;
      padding: 2.5rem;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
      border: 1px solid #e2e8f0;
    }

    .license-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px -5px rgba(0,0,0,0.1);
    }

    .license-card.annual {
      border: 2px solid #2563eb;
      background: #ffffff;
      transform: scale(1.05);
      z-index: 2;
    }

    .badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #2563eb;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .card-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      color: #0f172a;
    }

    .card-header p {
      color: #64748b;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    .price-section {
      margin: 2rem 0;
      color: #0f172a;
    }

    .currency { font-size: 1.5rem; vertical-align: top; font-weight: 600; }
    .amount { font-size: 3rem; font-weight: 800; }
    .period { color: #64748b; font-size: 1rem; font-weight: 500; }

    .features {
      list-style: none;
      padding: 0;
      margin: 0 0 2rem 0;
      flex-grow: 1;
    }

    .features li {
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #334155;
    }

    .features i {
      color: #10b981;
    }

    .btn-plan {
      width: 100%;
      padding: 1rem;
      border-radius: 12px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .btn-trial {
      background: #f1f5f9;
      color: #475569;
    }
    .btn-trial:hover { background: #e2e8f0; color: #1e293b; }

    .btn-monthly {
      background: #e0e7ff;
      color: #4f46e5;
    }
    .btn-monthly:hover { background: #c7d2fe; }

    .btn-annual {
      background: #2563eb;
      color: white;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }
    .btn-annual:hover {
      background: #1d4ed8;
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
    }

    @media (max-width: 768px) {
      .license-card.annual { transform: none; }
    }
  `]
})
export class PublicLicenseComponent {
  router = inject(Router);

  isLoading = false;

  async goToRegister(plan: string) {
    this.isLoading = true;
    try {
      const backendUrl = `${environment.apiUrl}/create_guest_license_preference`;

      let price = 150;
      let title = 'Licencia Mensual';

      if (plan === 'annual') { price = 1500; title = 'Licencia Anual'; }
      if (plan === 'trial') { price = 10; title = 'Validación Prueba'; }

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, price, planType: plan })
      });

      if (!response.ok) throw new Error('Error al iniciar pago');

      const { init_point } = await response.json();
      window.location.href = init_point;

    } catch (e) {
      alert('No se pudo iniciar el pago. Intenta de nuevo.');
      this.isLoading = false;
    }
  }
}
