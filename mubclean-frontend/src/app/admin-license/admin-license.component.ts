import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-license',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lic-page">

      <!-- ── ACTIVE LICENSE VIEW ── -->
      <ng-container *ngIf="isActive && !isLoading">
        <div class="lic-wrapper">

          <!-- Header -->
          <div class="lic-header">
            <div class="lic-icon"><span class="material-icons">workspace_premium</span></div>
            <div>
              <h1>Mi Licencia</h1>
              <p class="biz-name">{{ businessName }}</p>
            </div>
            <span class="badge-active">
              <span class="material-icons" style="font-size:14px;">verified</span>
              Activa
            </span>
          </div>

          <!-- KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card" [class.kpi-warning]="daysRemaining <= 30" [class.kpi-danger]="daysRemaining <= 7">
              <span class="material-icons kpi-icon">timer</span>
              <div class="kpi-value">{{ daysRemaining }}</div>
              <div class="kpi-label">Días restantes</div>
            </div>
            <div class="kpi-card">
              <span class="material-icons kpi-icon">event</span>
              <div class="kpi-value">{{ expiryDateStr }}</div>
              <div class="kpi-label">Fecha de corte</div>
            </div>
            <div class="kpi-card">
              <span class="material-icons kpi-icon">payment</span>
              <div class="kpi-value">{{ paymentDueDateStr }}</div>
              <div class="kpi-label">Fecha máx. de pago</div>
            </div>
            <div class="kpi-card">
              <span class="material-icons kpi-icon">card_membership</span>
              <div class="kpi-value">{{ planLabel }}</div>
              <div class="kpi-label">Plan activo</div>
            </div>
          </div>

          <!-- Detail Card -->
          <div class="detail-card">
            <h2>Detalles de tu plan</h2>
            <div class="detail-row">
              <span class="detail-label">Estado</span>
              <span class="detail-val status-ok">Activo</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Plan</span>
              <span class="detail-val">{{ planLabel }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Inicio de vigencia</span>
              <span class="detail-val">{{ startDateStr }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Vencimiento</span>
              <span class="detail-val">{{ expiryDateStr }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha límite de pago</span>
              <span class="detail-val">{{ paymentDueDateStr }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Renovación automática</span>
              <span class="detail-val">No — deberás renovar manualmente</span>
            </div>
          </div>

          <!-- Renew CTA -->
          <div class="renew-cta" *ngIf="daysRemaining <= 30">
            <span class="material-icons renew-icon">warning_amber</span>
            <div>
              <strong>Tu licencia vence pronto.</strong>
              <p>Renueva antes del {{ paymentDueDateStr }} para evitar interrupciones en el servicio.</p>
            </div>
            <button class="btn-renew" (click)="showPlans = true">Renovar ahora</button>
          </div>

          <!-- Switch plan link -->
          <button class="link-btn" (click)="showPlans = !showPlans">
            {{ showPlans ? 'Ocultar planes' : 'Ver planes de renovación' }}
          </button>

          <!-- Plans (collapsed by default unless close to expiry) -->
          <div class="plans-section" *ngIf="showPlans">
            <h2>Elige tu próximo plan</h2>
            <div class="cards-row">
              <div class="license-card">
                <div class="plan-name">Mensual</div>
                <div class="plan-price">
                  <span class="currency">$</span><span class="amount">150</span><span class="period">/mes</span>
                </div>
                <ul class="features">
                  <li><span class="material-icons">check</span> Acceso completo</li>
                  <li><span class="material-icons">check</span> Cancelación flexible</li>
                </ul>
                <button (click)="initiatePayment('monthly')" [disabled]="isPaying" class="btn-pay btn-secondary">
                  {{ isPaying ? 'Procesando...' : 'Pagar Mensual' }}
                </button>
              </div>
              <div class="license-card highlight">
                <div class="plan-name">Anual</div>
                <div class="plan-price">
                  <span class="currency">$</span><span class="amount">1,500</span><span class="period">/año</span>
                </div>
                <ul class="features">
                  <li><span class="material-icons">check</span> <strong>2 meses GRATIS</strong></li>
                  <li><span class="material-icons">check</span> Soporte VIP</li>
                  <li><span class="material-icons">check</span> Verificado</li>
                </ul>
                <button (click)="initiatePayment('annual')" [disabled]="isPaying" class="btn-pay btn-primary">
                  {{ isPaying ? 'Procesando...' : 'Pagar Anual' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </ng-container>

      <!-- ── INACTIVE / LOADING VIEW ── -->
      <div class="lic-wrapper" *ngIf="!isActive && !isLoading">
        <div class="header-text">
            <h1>Activa tu suscripción</h1>
            <p>Selecciona un plan para continuar operando tu negocio.</p>
        </div>
        <div class="cards-row">
            <div class="license-card">
              <div class="plan-name">Mensual</div>
              <div class="plan-price">
                <span class="currency">$</span><span class="amount">150</span><span class="period">/mes</span>
              </div>
              <ul class="features">
                <li><span class="material-icons">check</span> Acceso completo</li>
                <li><span class="material-icons">check</span> Cancelación flexible</li>
              </ul>
              <button (click)="initiatePayment('monthly')" [disabled]="isPaying" class="btn-pay btn-secondary">
                {{ isPaying ? 'Procesando...' : 'Pagar Mensual' }}
              </button>
            </div>
            <div class="license-card highlight">
              <div class="plan-name">Anual</div>
              <div class="plan-price">
                <span class="currency">$</span><span class="amount">1,500</span><span class="period">/año</span>
              </div>
              <ul class="features">
                <li><span class="material-icons">check</span> <strong>2 meses GRATIS</strong></li>
                <li><span class="material-icons">check</span> Soporte VIP</li>
                <li><span class="material-icons">check</span> Verificado</li>
              </ul>
              <button (click)="initiatePayment('annual')" [disabled]="isPaying" class="btn-pay btn-primary">
                {{ isPaying ? 'Procesando...' : 'Pagar Anual' }}
              </button>
            </div>
        </div>
        <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>

      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
      </div>

    </div>
  `,
  styles: [`
    .lic-page {
      min-height: 100vh;
      background: #F8FAFC;
      padding: 32px 24px;
      font-family: 'Inter', sans-serif;
      display: flex;
      justify-content: center;
    }
    .lic-wrapper {
      width: 100%;
      max-width: 860px;
    }

    /* ── Header ── */
    .lic-header {
      display: flex;
      align-items: center;
      gap: 16px;
      background: white;
      border-radius: 20px;
      padding: 24px 28px;
      margin-bottom: 24px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
      border: 1px solid rgba(0,0,0,0.04);
    }
    .lic-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #1565C0, #7C3AED);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .lic-icon .material-icons { font-size: 28px; }
    .lic-header h1 {
      margin: 0; font-family: 'Fraunces', serif; font-weight: 800;
      font-size: 22px; color: #0F172A;
    }
    .biz-name { margin: 2px 0 0; color: #64748B; font-size: 13px; font-weight: 500; }
    .badge-active {
      margin-left: auto;
      background: #ECFDF5; color: #059669;
      border: 1px solid #A7F3D0;
      border-radius: 99px;
      padding: 6px 14px;
      font-size: 13px; font-weight: 700;
      display: flex; align-items: center; gap: 4px;
    }

    /* ── KPI Grid ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    @media (max-width: 640px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    .kpi-card {
      background: white;
      border-radius: 16px;
      padding: 20px 16px;
      text-align: center;
      border: 1px solid rgba(0,0,0,0.04);
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      transition: transform 0.2s;
    }
    .kpi-card:hover { transform: translateY(-3px); }
    .kpi-card.kpi-warning { border-color: #FED7AA; background: #FFFBEB; }
    .kpi-card.kpi-danger  { border-color: #FECACA; background: #FFF5F5; }
    .kpi-icon { font-size: 24px; color: #1565C0; margin-bottom: 8px; }
    .kpi-warning .kpi-icon { color: #D97706; }
    .kpi-danger  .kpi-icon { color: #DC2626; }
    .kpi-value {
      font-size: 20px; font-weight: 800; color: #0F172A;
      font-family: 'Fraunces', serif;
    }
    .kpi-label { font-size: 12px; color: #64748B; margin-top: 4px; font-weight: 500; }

    /* ── Detail Card ── */
    .detail-card {
      background: white;
      border-radius: 20px;
      padding: 24px 28px;
      margin-bottom: 20px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
      border: 1px solid rgba(0,0,0,0.04);
    }
    .detail-card h2 {
      font-family: 'Fraunces', serif; font-weight: 700; font-size: 18px;
      color: #0F172A; margin: 0 0 20px;
    }
    .detail-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid #F1F5F9;
      font-size: 14px;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748B; font-weight: 500; }
    .detail-val { color: #0F172A; font-weight: 600; }
    .status-ok { color: #059669; }

    /* ── Renew CTA ── */
    .renew-cta {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
    }
    .renew-icon { color: #D97706; font-size: 28px; flex-shrink: 0; }
    .renew-cta strong { color: #92400E; font-size: 15px; }
    .renew-cta p { color: #78350F; font-size: 13px; margin: 4px 0 0; }
    .btn-renew {
      margin-left: auto; flex-shrink: 0;
      background: #D97706; color: white;
      border: none; border-radius: 12px;
      padding: 10px 20px; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .btn-renew:hover { background: #B45309; transform: translateY(-1px); }

    /* ── Plans ── */
    .link-btn {
      background: none; border: none; color: #1565C0;
      font-weight: 600; cursor: pointer; font-size: 14px;
      padding: 0; margin-bottom: 20px; font-family: 'Inter', sans-serif;
      text-decoration: underline;
    }
    .plans-section h2 {
      font-family: 'Fraunces', serif; font-weight: 700; font-size: 20px;
      color: #0F172A; margin-bottom: 20px;
    }
    .cards-row { display: flex; gap: 20px; flex-wrap: wrap; }
    .license-card {
      background: white; border-radius: 20px; padding: 32px 28px;
      flex: 1; min-width: 260px; max-width: 380px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      border: 1px solid rgba(0,0,0,0.04);
      display: flex; flex-direction: column;
      transition: all 0.3s;
    }
    .license-card.highlight {
      box-shadow: 0 10px 40px rgba(21,101,192,0.1);
      border: 2px solid rgba(21,101,192,0.2);
      transform: translateY(-4px);
    }
    .license-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    .plan-name { font-size: 22px; font-weight: 800; color: #0F172A; font-family: 'Fraunces', serif; }
    .plan-price { margin: 16px 0; color: #0F172A; }
    .currency { font-size: 20px; font-weight: 700; vertical-align: top; margin-top: 8px; display: inline-block; }
    .amount { font-size: 48px; font-weight: 800; font-family: 'Fraunces', serif; line-height: 1; }
    .period { color: #64748B; font-weight: 600; }
    .features { list-style: none; padding: 0; margin-bottom: 24px; }
    .features li { margin-bottom: 10px; color: #334155; display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 14px; }
    .features .material-icons { color: #1565C0; font-size: 18px; }
    .btn-pay {
      margin-top: auto; width: 100%; padding: 14px;
      border-radius: 12px; border: none; font-weight: 700;
      cursor: pointer; font-size: 15px; transition: all 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .btn-primary { background: #1565C0; color: white; box-shadow: 0 4px 12px rgba(21,101,192,0.2); }
    .btn-secondary { background: white; color: #0F172A; border: 1px solid #E2E8F0; }
    .btn-primary:hover:not(:disabled) { background: #1976D2; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(21,101,192,0.3); }
    .btn-secondary:hover:not(:disabled) { background: #F8FAFC; transform: translateY(-2px); color: #1565C0; }
    .btn-pay:disabled { background: #94A3B8; cursor: not-allowed; color: white; transform: none; box-shadow: none; }

    /* ── Inactive header ── */
    .header-text { text-align: center; margin-bottom: 32px; }
    .header-text h1 { font-family: 'Fraunces', serif; font-size: 2.2rem; font-weight: 800; color: #0F172A; margin-bottom: 8px; }
    .header-text p { color: #64748B; font-weight: 500; }

    /* ── Loading / error ── */
    .loading-state { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(21,101,192,0.2); border-top-color: #1565C0; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-message { color: #DC2626; text-align: center; margin-top: 1rem; font-weight: 500; }
  `]
})
export class AdminLicenseComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  isLoading = true;
  isActive = false;
  isPaying = false;
  showPlans = false;
  errorMessage = '';

  // License data
  businessName = '';
  planLabel = '';
  daysRemaining = 0;
  expiryDateStr = '';
  startDateStr = '';
  paymentDueDateStr = '';

  async ngOnInit() {
    if (!this.auth.currentUser) { this.router.navigate(['/login']); return; }
    await this.auth.loadUserProfile();
    this.computeLicenseInfo();
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  computeLicenseInfo() {
    const biz = this.auth.profile?.business;
    if (!biz) return;

    this.businessName = biz.nombre || '';
    this.isActive = biz.subscription_status === 'active';

    if (biz.license_expiry) {
      const expiry = new Date(biz.license_expiry);
      const now = new Date();

      // Days remaining
      const msRemaining = expiry.getTime() - now.getTime();
      this.daysRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60 * 24)));

      // Formatted expiry
      this.expiryDateStr = expiry.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

      // Payment due 7 days before expiry
      const paymentDue = new Date(expiry);
      paymentDue.setDate(paymentDue.getDate() - 7);
      this.paymentDueDateStr = paymentDue.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

      // Estimated start (expiry - plan duration)
      const diffDaysTotal = Math.round((expiry.getTime() - now.getTime() + msRemaining) / (1000 * 60 * 60 * 24));
      const isAnnual = diffDaysTotal > 60;
      this.planLabel = isAnnual ? 'Anual ($1,500/año)' : 'Mensual ($150/mes)';

      const start = new Date(expiry);
      start.setFullYear(start.getFullYear() - (isAnnual ? 1 : 0));
      start.setMonth(start.getMonth() - (isAnnual ? 0 : 1));
      this.startDateStr = start.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

      // Show plans automatically if expiring soon
      if (this.daysRemaining <= 30) this.showPlans = false; // CTA shows instead
    }
  }

  async initiatePayment(type: 'monthly' | 'annual') {
    this.isPaying = true;
    this.errorMessage = '';
    try {
      const user = this.auth.currentUser;
      if (!this.auth.profile?.business) await this.auth.loadUserProfile();
      const bus = this.auth.profile?.business;
      if (!bus) throw new Error('No se encontró información del negocio.');

      const price = type === 'monthly' ? 150 : 1500;
      const title = type === 'monthly' ? `Licencia Mensual - ${bus.nombre}` : `Licencia Anual - ${bus.nombre}`;

      const response = await fetch(`${environment.apiUrl}/create_license_preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bus.id, title, price,
          payerEmail: bus.email_contacto || user?.email,
          planType: type
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || response.statusText);
      }
      const { init_point } = await response.json();
      window.location.href = init_point;
    } catch (e: any) {
      console.error(e);
      this.errorMessage = e.message || 'Error inesperado al conectar con el servidor de pagos.';
      this.isPaying = false;
      this.cdr.detectChanges();
    }
  }
}
