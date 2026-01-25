import { Component, OnInit, OnDestroy, inject, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-customer-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="history-container">
      <header class="app-bar">
        <h1>Historial de Pedidos</h1>
        <button class="icon-button" (click)="fetchRequests()">
          <span class="material-icons">refresh</span>
        </button>
      </header>

      <div *ngIf="isLoading" class="loading-container">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!isLoading && requests.length === 0" class="empty-state">
        <span class="material-icons empty-icon">history</span>
        <p class="empty-title">Sin historial</p>
        <p class="empty-subtitle">Tus solicitudes aparecerán aquí</p>
      </div>

      <div *ngIf="!isLoading" class="content-wrapper">
        
        <!-- Activas -->
        <div *ngIf="activeRequests.length > 0" class="section">
            <h2 class="section-title">Solicitudes Activas</h2>
            <div class="request-list">
                <div *ngFor="let req of activeRequests" class="request-card" (click)="openDetail(req.id)">
                  <div class="card-header">
                    <span class="status-badge" [ngClass]="getStatusClass(req.estado)">
                      {{ req.estado | uppercase }}
                    </span>
                    <span class="date-text">{{ formatDate(req.fecha_solicitada || req.created_at) }}</span>
                  </div>

                  <div class="card-body">
                    <div class="info-row">
                      <span class="material-icons">location_on</span>
                      <span class="address-text">{{ req.direccion_servicio || req.direccion || 'Sin dirección' }}</span>
                    </div>
                    
                    <div *ngIf="req.precio_total > 0" class="price-row">
                        <span class="price-label">Cotización:</span>
                        <span class="price-value">$ {{ req.precio_total | number:'1.2-2' }}</span>
                    </div>

                    <div *ngIf="req.estado === 'cotizada'" class="action-buttons">
                      <p class="offer-title">¿Aceptas esta oferta de $ {{ req.precio_total | number:'1.2-2' }}?</p>
                      <div class="btn-row">
                        <button class="btn btn-reject" (click)="$event.stopPropagation(); responderCotizacion(req.id, false)">RECHAZAR</button>
                        <button class="btn btn-accept" (click)="$event.stopPropagation(); responderCotizacion(req.id, true)">ACEPTAR</button>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        </div>

        <div *ngIf="activeRequests.length > 0 && pastRequests.length > 0" class="spacer-20"></div>

        <!-- Historial -->
        <div *ngIf="pastRequests.length > 0" class="section">
            <h2 class="section-title">Historial Completo</h2>
            <div class="request-list">
                <div *ngFor="let req of pastRequests" class="request-card" (click)="openDetail(req.id)">
                  <div class="card-header">
                    <span class="status-badge" [ngClass]="getStatusClass(req.estado)">
                      {{ req.estado | uppercase }}
                    </span>
                    <span class="date-text">{{ formatDate(req.fecha_solicitada || req.created_at) }}</span>
                  </div>
                  <div class="card-body">
                    <div class="info-row">
                      <span class="material-icons">location_on</span>
                      <span class="address-text">{{ req.direccion_servicio || req.direccion || 'Sin dirección' }}</span>
                    </div>
                    <!-- Simplified for history, maybe no actions needed -->
                     <div *ngIf="req.precio_total > 0" class="price-row">
                        <span class="price-label">Total:</span>
                        <span class="price-value">$ {{ req.precio_total | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .section-title {
        font-size: 16px; font-weight: 700; color: #1565C0; margin: 10px 20px;
    }
    .spacer-20 { height: 20px; }
    .content-wrapper { padding-bottom: 20px; }

    .price-row {
        margin-top: 8px;
        display: flex;
        align-items: center;
        background: #F1F8E9;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid #C5E1A5;
        width: fit-content;
    }
    .price-label { font-size: 12px; color: #558B2F; margin-right: 6px; font-weight: 600; }
    .price-value { font-size: 16px; color: #2E7D32; font-weight: 800; }

    .history-container { padding-bottom: 20px; }
    
    .app-bar {
      background: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .app-bar h1 {
      margin: 0;
      font-size: 20px;
      color: #1565C0;
      font-weight: 700;
    }

    .icon-button {
      background: none;
      border: none;
      color: #1565C0;
      cursor: pointer;
    }

    .loading-container { display: flex; justify-content: center; padding: 40px; }
    .spinner {
      border: 3px solid rgba(21, 101, 192, 0.1);
      border-radius: 50%;
      border-top: 3px solid #1565C0;
      width: 30px; height: 30px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 60px 20px; color: #9E9E9E; }
    .empty-icon { font-size: 60px; color: #E0E0E0; margin-bottom: 10px; }
    .empty-title { font-size: 16px; margin: 0; }
    .empty-subtitle { font-size: 12px; margin: 5px 0 0; }

    .request-list { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

    .request-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.03);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }

    .status-badge.pendiente { background: #FFF3E0; color: #F57C00; }
    .status-badge.cotizada { background: #E3F2FD; color: #1565C0; }
    .status-badge.aceptada { background: #E0F2F1; color: #00695C; }
    .status-badge.agendada { background: #E8F5E9; color: #2E7D32; }
    .status-badge.en_proceso { background: #F3E5F5; color: #7B1FA2; }
    .status-badge.completada { background: #F5F5F5; color: #616161; }
    .status-badge.cancelada { background: #FFEBEE; color: #C62828; }

    .date-text { font-size: 12px; color: #9E9E9E; }

    .info-row { display: flex; align-items: center; color: #424242; }
    .info-row .material-icons { font-size: 18px; margin-right: 8px; color: #9E9E9E; }
    .address-text { font-weight: 500; font-size: 15px; }

    /* Action Buttons for Quotes */
    .action-buttons {
      margin-top: 15px;
      background: #F5F9FF;
      padding: 15px;
      border-radius: 12px;
      border: 1px solid rgba(21, 101, 192, 0.1);
    }

    .offer-title {
      margin: 0 0 10px;
      font-weight: 700;
      color: #1565C0;
      font-size: 14px;
      text-align: center;
    }

    .btn-row { display: flex; gap: 10px; }
    
    .btn {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      text-transform: uppercase;
    }

    .btn-reject {
      background: transparent;
      border: 1px solid #D32F2F;
      color: #D32F2F;
    }

    .btn-accept {
      background: #2E7D32;
      border: none;
      color: white;
    }
  `]
})
export class CustomerHistoryComponent implements OnInit, OnDestroy {
  requests: any[] = []; // Keep for safety/legacy references
  activeRequests: any[] = [];
  pastRequests: any[] = [];

  isLoading = true;
  // private supabase: SupabaseClient; // Remove local instance
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    // Automatically fetch when user becomes available
    effect(() => {
      const user = this.auth.user();
      if (user) {
        this.fetchRequests();
      }
    });
  }

  ngOnInit() {
    // Initial check (optional if effect runs immediately, but good for safety)
    if (this.auth.currentUser) {
      this.fetchRequests();
    }

    this.refreshInterval = setInterval(() => {
      if (this.auth.currentUser) {
        this.fetchRequestsSilent();
      }
    }, 3000);
  }

  refreshInterval: any;

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async fetchRequestsSilent() {
    // Same as fetchRequests but without touching isLoading
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      const { data, error } = await this.auth.client
        .from('solicitudes')
        .select('*')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this._distributeRequests(data || []);

    } catch (e) {
      console.error('Error silent fetch:', e);
    }
  }

  openDetail(id: string) {
    this.router.navigate(['/customer/request', id]);
  }

  async fetchRequests() {
    this.isLoading = true;
    this.cdr.detectChanges();
    console.log("History: Starting fetch...");

    try {
      const user = this.auth.currentUser;
      console.log("History: User is", user?.id);

      if (!user) {
        console.warn('History: No user found');
        return;
      }

      // Add safety timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout fetching history')), 5000)
      );

      const dbPromise = this.auth.client
        .from('solicitudes')
        .select('*')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false });

      const { data, error } = await Promise.race([dbPromise, timeoutPromise]) as any;

      console.log("History: DB Result", { data, error });

      if (error) throw error;
      this._distributeRequests(data || []);

    } catch (e) {
      console.error('Error fetching requests:', e);
      // Fallback
      this.activeRequests = [];
      this.pastRequests = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private _distributeRequests(allRequests: any[]) {
    // Sort priority
    const priority: Record<string, number> = {
      'en_proceso': 0, 'agendada': 1, 'aceptada': 2, 'cotizada': 3, 'pendiente': 4,
      'completada': 5, 'cancelada': 6
    };

    allRequests.sort((a: any, b: any) => {
      const pA = priority[a.estado] ?? 99;
      const pB = priority[b.estado] ?? 99;

      if (pA !== pB) return pA - pB;

      // Tie-breaker: Date
      const dateA = new Date(a.fecha_solicitada || a.created_at).getTime();
      const dateB = new Date(b.fecha_solicitada || b.created_at).getTime();

      // For active/scheduled: ascending (soonest first)
      if (['en_proceso', 'agendada'].includes(a.estado)) {
        return dateA - dateB;
      }
      // For others: descending (newest first)
      return dateB - dateA;
    });

    this.activeRequests = allRequests.filter(r => ['pendiente', 'cotizada', 'aceptada', 'agendada', 'en_proceso'].includes(r.estado));
    this.pastRequests = allRequests.filter(r => ['completada', 'cancelada'].includes(r.estado));

    // Also update main list just in case
    this.requests = allRequests;
    this.cdr.detectChanges();
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase() || 'pendiente';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  async responderCotizacion(id: string, aceptar: boolean) {
    const nuevoEstado = aceptar ? 'aceptada' : 'cancelada';
    try {
      const { error } = await this.auth.client
        .from('solicitudes')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;

      // Refresh local list
      this.fetchRequests();
    } catch (e) {
      console.error('Error updating request:', e);
      alert('Error al actualizar la solicitud');
    }
  }
}
