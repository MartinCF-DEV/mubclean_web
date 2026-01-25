import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-customer-request-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-container">
      <header class="app-bar">
        <button class="icon-button" (click)="goBack()">
          <span class="material-icons">arrow_back</span>
        </button>
        <h1>Detalle del Pedido</h1>
        <button class="icon-button" (click)="fetchDetails()">
          <span class="material-icons">refresh</span>
        </button>
      </header>

      <div *ngIf="isLoading" class="loading-container">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!isLoading && !request" class="error-state">
        <p>No se encontró la solicitud.</p>
      </div>

      <div *ngIf="!isLoading && request" class="content detail-layout">
        
        <!-- Left Column: Information -->
        <div class="left-col">
            <!-- Business Card -->
            <div class="business-mini-card" *ngIf="request.negocio" (click)="goToBusiness(request.negocio.id)">
                <div class="biz-avatar">
                    <img [src]="request.negocio.logo_url || 'assets/placeholder-business.png'" 
                        onerror="this.src='https://via.placeholder.com/50?text=Biz'" alt="Logo">
                </div>
                <div class="biz-info">
                    <span class="biz-label">Proveedor de Servicio</span>
                    <span class="biz-name">{{ request.negocio.nombre }}</span>
                </div>
                <span class="material-icons arrow-icon">chevron_right</span>
            </div>

            <div class="spacer-20"></div>

            <!-- Status Card -->
            <div class="status-card" [ngClass]="getStatusClass(request.estado)">
                <span class="material-icons status-icon">{{ getStatusIcon(request.estado) }}</span>
                <div class="status-info">
                    <span class="status-label">Estado del Servicio</span>
                    <span class="status-value">{{ request.estado | uppercase }}</span>
                </div>
            </div>

            <div class="spacer-20"></div>

            <!-- Evidence Section -->
            <div *ngIf="evidencia" class="evidence-card">
                <div class="evidence-header">
                    <span class="material-icons success-icon">check_circle</span>
                    <span class="evidence-title">Trabajo Terminado</span>
                </div>
                <div class="evidence-img-container">
                    <img [src]="evidencia.foto_url" alt="Evidencia" class="evidence-img">
                </div>
                <div *ngIf="evidencia.comentario_tecnico" class="tech-note">
                    <p class="tech-note-label">Notas del Técnico:</p>
                    <p class="tech-note-text">{{ evidencia.comentario_tecnico }}</p>
                </div>
            </div>
            <div *ngIf="evidencia" class="spacer-20"></div>

            <!-- Info Section -->
            <div class="info-card">
                <div class="info-row">
                    <span class="material-icons info-icon">location_on</span>
                    <div class="info-text">
                        <span class="info-label">Dirección</span>
                        <span class="info-value">{{ request.direccion_servicio || request.direccion }}</span>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="info-row">
                    <span class="material-icons info-icon">event</span>
                    <div class="info-text">
                        <span class="info-label">Fecha Solicitada</span>
                        <span class="info-value">{{ formatDate(request.fecha_solicitada_cliente || request.created_at) }}</span>
                    </div>
                </div>
                <!-- Payment Method Display (If set) -->
                <div *ngIf="request.metodo_pago" class="divider"></div>
                <div *ngIf="request.metodo_pago" class="info-row">
                    <span class="material-icons info-icon">payments</span>
                    <div class="info-text">
                        <span class="info-label">Método de Pago</span>
                        <span class="info-value">
                            {{ request.metodo_pago === 'efectivo' ? 'EFECTIVO (Pago al técnico)' : request.metodo_pago | uppercase }}
                        </span>
                        <span *ngIf="request.metodo_pago === 'efectivo'" style="font-size:11px; color:#F57C00;">Pendiente de pago</span>
                    </div>
                </div>

                <div *ngIf="request.tecnico" class="divider"></div>
                <div *ngIf="request.tecnico" class="info-row">
                    <span class="material-icons info-icon">person</span>
                    <div class="info-text">
                        <span class="info-label">Técnico Asignado</span>
                        <span class="info-value">{{ request.tecnico.perfiles.nombre_completo }}</span>
                    </div>
                </div>
            </div>

            <div class="spacer-20"></div>

            <!-- Services List -->
            <h3 class="section-title">Detalle de Servicios</h3>
            <div class="items-list">
                <div *ngFor="let item of items" class="item-card">
                    <div class="item-header">
                        <span class="qty-badge">{{ item.cantidad }}x</span>
                        <div class="item-details">
                            <span class="item-name">{{ item.servicios_catalogo.nombre }}</span>
                            <span *ngIf="item.descripcion_item" class="item-desc">{{ item.descripcion_item }}</span>
                            <span *ngIf="item.precio_unitario > 0" class="item-price">
                                $ {{ item.precio_unitario | number:'1.2-2' }}
                            </span>
                        </div>
                    </div>
                    <div *ngIf="item.fotos_solicitud?.length > 0" class="photos-scroller">
                        <img *ngFor="let foto of item.fotos_solicitud" [src]="foto.foto_url" class="item-photo">
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Column: Sticky Quote & Actions -->
        <div class="right-col">
            <div class="sticky-wrapper">
                
                <!-- Quote / Price Card -->
                <div *ngIf="request.precio_total > 0" class="price-card">
                    <div class="price-header">
                        <span class="material-icons price-icon">payments</span>
                        <span class="price-label">Total Cotizado</span>
                    </div>
                    <div class="price-amount">
                        $ {{ request.precio_total | number:'1.2-2' }}
                    </div>
                    
                    <!-- Accept / Reject Actions (Only if 'cotizada') -->
                    <div *ngIf="request.estado === 'cotizada'" class="quote-actions">
                        <p class="price-note">El negocio ha enviado una cotización.<br>¿Deseas proceder?</p>
                        <div class="action-buttons">
                            <button class="btn-reject" (click)="responderCotizacion(false)">RECHAZAR</button>
                            <button class="btn-accept" (click)="responderCotizacion(true)">ACEPTAR</button>
                        </div>
                    </div>
                </div>

                <!-- Payment Section (Only if accepted/agendada AND NO payment method selected yet) -->
                <div *ngIf="(request.estado === 'aceptada' || request.estado === 'agendada') && !request.metodo_pago" class="payment-card-container">
                    <div class="payment-card">
                        <h3 class="payment-title">MÉTODO DE PAGO</h3>
                        
                        <div class="payment-options">
                            <div class="payment-option" [class.selected]="selectedPaymentMethod === 'card'" (click)="selectedPaymentMethod = 'card'">
                                <span class="material-icons option-icon">credit_card</span>
                                <span class="option-label">Mercado Pago</span>
                                <span class="material-icons check-icon" *ngIf="selectedPaymentMethod === 'card'">check_circle</span>
                            </div>
                            <div class="payment-option" [class.selected]="selectedPaymentMethod === 'cash'" (click)="selectedPaymentMethod = 'cash'">
                                <span class="material-icons option-icon">payments</span>
                                <span class="option-label">Efectivo</span>
                                <span class="material-icons check-icon" *ngIf="selectedPaymentMethod === 'cash'">check_circle</span>
                            </div>
                        </div>

                        <div class="divider"></div>

                        <button class="pay-btn" [class.cash-btn]="selectedPaymentMethod === 'cash'" (click)="processPayment()">
                            <span class="material-icons btn-icon">{{ selectedPaymentMethod === 'card' ? 'payment' : 'handshake' }}</span>
                            {{ selectedPaymentMethod === 'card' ? 'PAGAR AHORA' : 'PAGAR AL TÉCNICO' }}
                        </button>
                        <p class="payment-hint" *ngIf="selectedPaymentMethod === 'cash'">El pago se realizará en efectivo al finalizar.</p>
                    </div>
                </div>
                
                <!-- If Payment Method is CASH, show confirmation message -->
                <div *ngIf="request.metodo_pago === 'efectivo'" class="payment-card-container">
                    <div class="payment-card" style="border: 2px solid #66BB6A; background: #F1F8E9;">
                         <h3 class="payment-title" style="color: #2E7D32;">MÉTODO DE PAGO CONFIRMADO</h3>
                         <div style="text-align:center;">
                             <span class="material-icons" style="font-size:40px; color:#2E7D32;">check_circle</span>
                             <p style="margin:10px 0; font-weight:700; color:#1B5E20;">Efectivo (Pago al Técnico)</p>
                             <p style="font-size:12px; color:#333;">Recuerda tener el monto exacto al finalizar el servicio.</p>
                         </div>
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .detail-container { padding-bottom: 30px; background-color: #F5F9FF; min-height: 100vh; }
    
    /* Layout */
    .detail-layout {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 24px;
        max-width: 1200px;
        margin: 0 auto;
        align-items: start;
    }
    @media (max-width: 900px) {
        .detail-layout { grid-template-columns: 1fr; }
    }

    /* Right Column Sticky */
    .sticky-wrapper {
        position: sticky;
        top: 86px; /* Below app bar */
    }

    .app-bar {
      background: white; padding: 16px 20px;
      display: flex; justify-content: space-between; align-items: center;
      position: sticky; top: 0; z-index: 50;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .app-bar h1 { margin: 0; font-size: 18px; color: #333; font-weight: 700; }
    .icon-button { background: none; border: none; cursor: pointer; color: #333; padding: 8px; }

    .loading-container { display: flex; justify-content: center; padding: 50px; }
    .spinner { border: 3px solid rgba(21, 101, 192, 0.1); border-radius: 50%; border-top: 3px solid #1565C0; width: 30px; height: 30px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .content { padding: 24px; }
    .spacer-20 { height: 20px; }

    /* Cards */
    .info-card, .evidence-card, .status-card, .business-mini-card {
        background: white; border-radius: 16px; border: 1px solid #E0E0E0;
    }

    /* Price Card (Enhanced) */
    .price-card {
        background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%);
        color: white;
        padding: 24px;
        border-radius: 20px;
        box-shadow: 0 10px 25px rgba(21, 101, 192, 0.3);
        margin-bottom: 20px;
        text-align: center;
    }
    .price-header { display: flex; align-items: center; justify-content: center; margin-bottom: 10px; opacity: 0.9; }
    .price-icon { margin-right: 8px; font-size: 20px; }
    .price-label { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .price-amount { font-size: 36px; font-weight: 800; margin-bottom: 5px; }
    .price-note { margin: 16px 0; font-size: 13px; opacity: 0.9; line-height: 1.4; }

    /* Action Buttons */
    .quote-actions { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); }
    .action-buttons { display: flex; gap: 10px; }
    .btn-reject, .btn-accept {
        flex: 1; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; border: none; font-size: 13px;
    }
    .btn-reject { background: rgba(255,255,255,0.15); color: #FFCDD2; }
    .btn-reject:hover { background: rgba(255,255,255,0.25); }
    .btn-accept { background: white; color: #1565C0; }
    .btn-accept:hover { background: #E3F2FD; }

    /* Payment Card */
    .payment-card {
        background: white; border-radius: 20px; padding: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #E0E0E0;
    }
    .payment-title { font-size: 14px; color: #888; margin: 0 0 16px; font-weight: 700; letter-spacing: 0.5px; }
    .payment-options { display: flex; gap: 12px; margin-bottom: 20px; }
    .payment-option {
        flex: 1; border: 2px solid #EEE; border-radius: 12px; padding: 16px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        cursor: pointer; position: relative; transition: all 0.2s;
    }
    .payment-option.selected { border-color: #1565C0; background-color: #E3F2FD; color: #1565C0; }
    .option-icon { font-size: 24px; margin-bottom: 8px; }
    .option-label { font-size: 12px; font-weight: 600; text-align: center; }
    .check-icon { position: absolute; top: 6px; right: 6px; font-size: 16px; color: #1565C0; }
    
    .pay-btn {
        width: 100%; padding: 16px; background: #009EE3; color: white;
        border: none; border-radius: 12px; font-weight: 700; font-size: 15px; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .pay-btn:hover { background: #0087c2; }
    .pay-btn.cash-btn { background: #2E7D32; }
    .pay-btn.cash-btn:hover { background: #256b2a; }
    .payment-hint { text-align: center; font-size: 12px; color: #666; margin-top: 12px; font-style: italic; }

    /* Rest of Styles (Info, Items, Status Details) */
    .status-card { padding: 16px; display: flex; align-items: center; }
    .status-icon { font-size: 28px; margin-right: 15px; }
    .status-info { display: flex; flex-direction: column; }
    .status-label { font-size: 12px; color: #666; }
    .status-value { font-size: 18px; font-weight: 700; }
    .status-card.pendiente { background: #FFF3E0; color: #F57C00; border-color: #FFE0B2; }
    .status-card.cotizada { background: #E3F2FD; color: #1565C0; border-color: #BBDEFB; }
    .status-card.aceptada { background: #E0F2F1; color: #00695C; border-color: #B2DFDB; }
    .status-card.agendada { background: #E8F5E9; color: #2E7D32; border-color: #C8E6C9; }
    .status-card.en_proceso { background: #F3E5F5; color: #7B1FA2; border-color: #E1BEE7; }
    .status-card.completada { background: #F5F5F5; color: #616161; border-color: #E0E0E0; }

    .evidence-card { padding: 20px; }
    .evidence-header { display: flex; align-items: center; margin-bottom: 15px; }
    .success-icon { color: #2E7D32; margin-right: 10px; }
    .evidence-title { font-weight: 700; color: #2E7D32; font-size: 18px; }
    .evidence-img-container { border-radius: 12px; overflow: hidden; margin-bottom: 15px; }
    .evidence-img { width: 100%; height: 200px; object-fit: cover; }
    .tech-note { background: #FAFAFA; padding: 12px; border-radius: 10px; }
    .tech-note-label { font-weight: 700; font-size: 12px; color: #666; margin: 0 0 4px; }
    .tech-note-text { margin: 0; font-style: italic; color: #333; font-size: 14px; }

    .info-card { padding: 20px; }
    .info-row { display: flex; align-items: flex-start; }
    .info-icon { color: #1565C0; margin-right: 15px; margin-top: 2px; }
    .info-text { display: flex; flex-direction: column; }
    .info-label { font-size: 12px; color: #999; margin-bottom: 2px; }
    .info-value { font-weight: 600; color: #333; font-size: 15px; }
    .divider { height: 1px; background: #EEE; margin: 15px 0; }

    .section-title { margin: 0 0 10px; font-size: 16px; font-weight: 700; color: #333; }

    .items-list { display: flex; flex-direction: column; gap: 12px; }
    .item-card { background: white; border-radius: 16px; padding: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
    .item-header { display: flex; align-items: flex-start; }
    .qty-badge { background: #E3F2FD; color: #1565C0; font-weight: 700; padding: 6px 10px; border-radius: 8px; margin-right: 12px; font-size: 14px; }
    .item-details { display: flex; flex-direction: column; }
    .item-name { font-weight: 700; font-size: 16px; color: #333; }
    .item-desc { font-size: 13px; color: #666; margin-top: 4px; }
    .item-price { color: #2E7D32; font-weight: 700; font-size: 15px; margin-top: 5px; display: block; }
    .photos-scroller { display: flex; gap: 8px; margin-top: 12px; overflow-x: auto; padding-bottom: 5px; }
    .item-photo { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }

    .business-mini-card { padding: 12px 16px; display: flex; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.2s; }
    .business-mini-card:hover { transform: translateY(-2px); }
    .biz-avatar { width: 44px; height: 44px; margin-right: 12px; }
    .biz-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    .biz-info { flex: 1; display: flex; flex-direction: column; }
    .biz-label { font-size: 10px; color: #999; font-weight: 700; text-transform: uppercase; }
    .biz-name { font-size: 15px; font-weight: 700; color: #333; }
    .arrow-icon { color: #CCC; }
  `]
})
export class CustomerRequestDetailComponent implements OnInit {
  request: any = null;
  items: any[] = [];
  evidencia: any = null;
  isLoading = true;
  requestId = '';
  selectedPaymentMethod: 'card' | 'cash' = 'card';

  private auth = inject(AuthService); // Inject Auth Service
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() { }

  processPayment() {
    if (this.selectedPaymentMethod === 'card') {
      this._handlePayment();
    } else {
      this.handleCashPayment();
    }
  }

  async handleCashPayment() {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const { error } = await this.auth.client
        .from('solicitudes')
        .update({
          metodo_pago: 'efectivo'
          // estado_pago: 'pendiente' // Removed to prevents DB crash
        })
        .eq('id', this.requestId);

      if (error) throw error;

      alert("CONFIRMADO: Pago en Efectivo\n\nEl método de pago ha sido registrado. Pagarás directamente al técnico al finalizar el servicio.");
      await this.fetchDetails();

    } catch (e: any) {
      console.error('Error setting cash payment:', e);
      alert('Error al registrar método de pago: ' + e.message);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.requestId = params.get('id') || '';
      if (this.requestId) {
        this.fetchDetails();
      }
    });
  }

  goBack() {
    this.router.navigate(['/customer/history']);
  }

  goToBusiness(id: string) {
    this.router.navigate(['/customer/business', id]);
  }

  async _handlePayment() {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const description = this._generateDescription();
      const items = [{
        title: 'Servicio de Limpieza MubClean',
        description: description,
        quantity: 1,
        unit_price: this.request.precio_total,
        currency_id: 'MXN'
      }];

      const response = await fetch('http://localhost:3000/api/create_preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items,
          solicitudId: this.requestId
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Unknown backend error');
      }

      const data = await response.json();

      if (data.init_point) {
        console.log("Redirecting to:", data.init_point);
        window.location.href = data.init_point;
      } else {
        throw new Error('No init_point received');
      }

    } catch (e: any) {
      console.error('Payment Error:', e);
      alert(`Error al iniciar el pago: ${e.message || e}`);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  _generateDescription(): string {
    if (!this.items || this.items.length === 0) {
      return "Servicio de Limpieza MubClean";
    }

    const serviceNames = this.items
      .map(item => item.servicios_catalogo?.nombre)
      .join(', ');

    return `Servicios: ${serviceNames}`;
  }

  async responderCotizacion(aceptar: boolean) {
    if (!confirm(aceptar ? "¿Confirmas aceptar la cotización?" : "¿Seguro que deseas rechazar la solicitud?")) {
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const nuevoEstado = aceptar ? 'aceptada' : 'cancelada';

      const { error } = await this.auth.client
        .from('solicitudes')
        .update({ estado: nuevoEstado })
        .eq('id', this.requestId);

      if (error) throw error;

      await this.fetchDetails();
      alert(aceptar ? "¡Cotización aceptada!" : "Solicitud cancelada.");

    } catch (e: any) {
      console.error('Error responding quote:', e);
      alert('Error al actualizar: ' + e.message);
      this.isLoading = false;
    }
  }

  async fetchDetails() {
    this.isLoading = true;
    this.cdr.detectChanges();
    console.log("CustDetail: Fetching for ID", this.requestId);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout loading detail')), 5000)
      );

      console.log("CustDetail: Querying request...");

      const dbPromise = this.auth.client
        .from('solicitudes')
        .select(`
              *,
              tecnico:tecnico_asignado_id(perfiles(nombre_completo)),
              negocio:negocio_id(id, nombre, logo_url)
          `)
        .eq('id', this.requestId)
        .single();

      const { data: requestData, error: reqError } = await Promise.race([dbPromise, timeoutPromise]) as any;

      if (reqError) throw reqError;
      this.request = requestData;

      console.log("CustDetail: Querying items...");
      const { data: itemsData, error: itemsError } = await this.auth.client
        .from('items_solicitud')
        .select('*, servicios_catalogo(nombre), fotos_solicitud(foto_url)')
        .eq('solicitud_id', this.requestId);

      if (itemsError) throw itemsError;
      this.items = itemsData || [];

      if (this.request.estado === 'completada') {
        const { data: evData } = await this.auth.client
          .from('evidencia_final')
          .select('*')
          .eq('solicitud_id', this.requestId)
          .maybeSingle();
        this.evidencia = evData;
      }

    } catch (e) {
      console.error('CustDetail: Error fetching details:', e);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase() || 'pendiente';
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pendiente': return 'access_time';
      case 'cotizada': return 'attach_money';
      case 'aceptada': return 'check_circle_outline';
      case 'agendada': return 'event_available';
      case 'en_proceso': return 'cleaning_services';
      case 'completada': return 'task_alt';
      case 'cancelada': return 'cancel';
      default: return 'info';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
