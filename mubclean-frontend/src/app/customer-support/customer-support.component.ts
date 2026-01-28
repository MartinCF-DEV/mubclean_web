import { Component, OnInit, OnDestroy, inject, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-customer-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="support-container">
      <header class="app-bar">
        <h1>Centro de Ayuda</h1>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="activeTab === 'tickets'" (click)="activeTab = 'tickets'">
          Mis Tickets
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'request'" (click)="activeTab = 'request'">
          Solicitar Ayuda
        </button>
      </div>

      <!-- Content -->
      <div class="tab-content">
        
        <!-- Tab: Mis Tickets -->
        <div *ngIf="activeTab === 'tickets'" class="tickets-view fade-in">
          <div *ngIf="isLoadingTickets" class="loading-container">
            <div class="spinner"></div>
          </div>

          <div *ngIf="!isLoadingTickets && tickets.length === 0" class="empty-state">
            <span class="material-icons empty-icon">chat_bubble_outline</span>
            <p class="empty-title">No tienes tickets abiertos</p>
          </div>

          <div *ngIf="!isLoadingTickets && tickets.length > 0" class="tickets-list">
            <div *ngFor="let ticket of tickets" class="ticket-card">
              <div class="ticket-header" (click)="toggleTicket(ticket)">
                <div class="ticket-status-icon" [class.open]="ticket.estado !== 'resuelto'">
                  <span class="material-icons">{{ ticket.estado !== 'resuelto' ? 'lock_open' : 'lock' }}</span>
                </div>
                <div class="ticket-summary">
                  <span class="ticket-subject">{{ ticket.asunto }}</span>
                  <span class="ticket-meta">{{ ticket.tipo | uppercase }} • {{ formatDate(ticket.created_at) }}</span>
                </div>
                <span class="material-icons expand-icon">{{ ticket.expanded ? 'expand_less' : 'expand_more' }}</span>
              </div>

              <div *ngIf="ticket.expanded" class="ticket-body">
                <p class="description-label">Descripción:</p>
                <p class="description-text">{{ ticket.descripcion }}</p>

                <div *ngIf="ticket.respuesta_admin" class="admin-response">
                  <div class="response-header">
                    <span class="material-icons check-icon">check_circle</span>
                    <p class="response-label">Respuesta de la Empresa:</p>
                  </div>
                  <p class="response-text">{{ ticket.respuesta_admin }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Solicitar Ayuda -->
        <div *ngIf="activeTab === 'request'" class="request-view fade-in">
          
          <!-- Step 0: Category Selection -->
          <div *ngIf="step === 0" class="category-selection fade-in">
            <div class="header-section">
                <h2 class="step-title">¿En qué podemos ayudarte hoy?</h2>
                <p class="step-subtitle">Selecciona una categoría para dirigir tu solicitud.</p>
            </div>

            <div class="category-card" (click)="selectCategory('servicio')">
              <div class="cat-icon-bg bg-blue"><span class="material-icons">receipt_long</span></div>
              <div class="cat-info">
                <span class="cat-title">Problema con un Servicio</span>
                <span class="cat-desc">Reportar incidencia sobre una orden existente</span>
              </div>
              <span class="material-icons arrow">arrow_forward_ios</span>
            </div>

            <div class="category-card" (click)="selectCategory('general')">
              <div class="cat-icon-bg bg-orange"><span class="material-icons">feedback</span></div>
              <div class="cat-info">
                <span class="cat-title">Comentarios / App</span>
                <span class="cat-desc">Sugerencias, dudas generales o feedback</span>
              </div>
              <span class="material-icons arrow">arrow_forward_ios</span>
            </div>
          </div>

          <!-- Step 1: Form -->
          <div *ngIf="step === 1" class="request-form fade-in">
            <div class="form-header">
                <button class="back-btn" (click)="step = 0">
                <span class="material-icons">arrow_back</span>
                </button>
                <h2 class="form-title">
                {{ selectedCategory === 'servicio' ? 'Reportar Servicio' : 'Comentarios Generales' }}
                </h2>
            </div>

            <form (ngSubmit)="submitTicket()" class="premium-form">
              
              <div *ngIf="selectedCategory === 'servicio'" class="form-group">
                <label>Selecciona el servicio afectado</label>
                <div class="input-wrapper">
                    <span class="material-icons prefix-icon">receipt</span>
                    <select [(ngModel)]="selectedSolicitudId" name="solicitudId" class="form-input select-input">
                    <option [ngValue]="null" disabled>Seleccionar orden...</option>
                    <option *ngFor="let s of recentRequests" [value]="s.id">
                        Order #{{ s.id.substring(0,4) }} - {{ s.estado | uppercase }}
                    </option>
                    </select>
                </div>
              </div>

              <div class="form-group">
                <label>Asunto</label>
                <div class="input-wrapper">
                    <span class="material-icons prefix-icon">short_text</span>
                    <input type="text" [(ngModel)]="formAsunto" name="asunto" class="form-input" placeholder="Ej. Retraso, Error..." required>
                </div>
              </div>

              <div class="form-group">
                <label>Descripción detallada</label>
                <div class="input-wrapper textarea-wrapper">
                    <textarea [(ngModel)]="formDescripcion" name="descripcion" class="form-input textarea-input" rows="5" placeholder="Cuéntanos más detalles..." required></textarea>
                </div>
              </div>

              <button type="submit" class="submit-btn" [disabled]="submitting">
                <span *ngIf="!submitting">ENVIAR TICKET</span>
                <div *ngIf="submitting" class="spinner-sm"></div>
              </button>

            </form>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .support-container { padding-bottom: 20px; background-color: #F8F9FA; min-height: 100vh; font-family: 'Roboto', sans-serif;}
    
    .app-bar {
      background: white; padding: 16px 20px;
      position: sticky; top: 0; z-index: 10;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      border-bottom: 1px solid #EDEDED;
    }
    .app-bar h1 { margin: 0; font-size: 20px; color: #1565C0; font-weight: 700; }

    /* Tabs */
    .tabs { display: flex; background: white; border-bottom: 1px solid #EEE; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .tab-btn {
      flex: 1; padding: 15px; background: none; border: none;
      font-weight: 600; color: #9E9E9E; cursor: pointer;
      border-bottom: 3px solid transparent; font-size: 14px;
      transition: all 0.3s;
    }
    .tab-btn.active { color: #1565C0; border-bottom-color: #1565C0; background-color: #F5F9FF;}

    .tab-content { padding: 24px; max-width: 600px; margin: 0 auto; }

    /* Animations */
    .fade-in { animation: fadeIn 0.3s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    /* Loading & Empty */
    .loading-container { display: flex; justify-content: center; padding: 40px; }
    .spinner {
      border: 3px solid rgba(21, 101, 192, 0.1); border-radius: 50%;
      border-top: 3px solid #1565C0; width: 30px; height: 30px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 60px 20px; color: #9E9E9E; }
    .empty-icon { font-size: 60px; color: #E0E0E0; margin-bottom: 15px; }
    .empty-title { font-size: 16px; font-weight: 500; }

    /* Tickets List */
    .tickets-list { display: flex; flex-direction: column; gap: 16px; }
    .ticket-card {
      background: white; border-radius: 16px; overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #F0F0F0;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .ticket-header {
      padding: 16px; display: flex; align-items: center; cursor: pointer;
    }
    .ticket-header:hover { background-color: #FAFAFA; }
    
    .ticket-status-icon {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; justify-content: center; align-items: center;
      margin-right: 16px; background: #F5F5F5; color: #BDBDBD;
    }
    .ticket-status-icon.open { background: #E8F5E9; color: #2E7D32; }
    
    .ticket-summary { flex: 1; display: flex; flex-direction: column; }
    .ticket-subject { font-weight: 700; color: #333; margin-bottom: 4px; font-size: 15px; }
    .ticket-meta { font-size: 12px; color: #999; font-weight: 500; }
    .expand-icon { color: #CCC; }

    .ticket-body {
      padding: 0 20px 20px 80px;
      border-top: 1px solid #F5F5F5;
    }
    .description-label, .response-label { font-size: 11px; font-weight: 700; color: #757575; margin: 12px 0 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .description-text { margin: 0; font-size: 14px; color: #424242; line-height: 1.5; }
    
    .admin-response {
      margin-top: 15px; background: #E8F5E9; padding: 16px;
      border-radius: 12px; border: 1.5px solid #81C784;
    }
    .response-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .check-icon { color: #4CAF50; font-size: 20px; }
    .response-label { color: #2E7D32; margin: 0; font-weight: 700; font-size: 13px; }
    .response-text { margin: 0; font-size: 14px; color: #1B5E20; line-height: 1.5; }

    /* Request Flow - PREMIUM CARDS */
    .header-section { margin-bottom: 25px; text-align: center; }
    .step-title { font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #212121; }
    .step-subtitle { color: #757575; font-size: 15px; margin: 0; }

    .category-card {
      background: white; padding: 24px; border-radius: 16px;
      display: flex; align-items: center; margin-bottom: 16px;
      cursor: pointer; border: 1px solid #E0E0E0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
      transition: all 0.2s;
    }
    .category-card:hover { transform: translateY(-3px); border-color: #2196F3; box-shadow: 0 8px 16px rgba(33, 150, 243, 0.1); }

    .cat-icon-bg {
      width: 56px; height: 56px; border-radius: 14px;
      display: flex; justify-content: center; align-items: center;
      margin-right: 20px;
    }
    .bg-blue { background: #E3F2FD; color: #2196F3; }
    .bg-orange { background: #FFF3E0; color: #FF9800; }
    .cat-icon-bg .material-icons { font-size: 28px; }

    .cat-info { flex: 1; display: flex; flex-direction: column; }
    .cat-title { font-weight: 700; font-size: 16px; color: #333; margin-bottom: 4px; }
    .cat-desc { font-size: 13px; color: #757575; line-height: 1.3; }
    .arrow { font-size: 18px; color: #E0E0E0; }

    /* Form Styles - PREMIUM INPUTS */
    .form-header { display: flex; align-items: center; margin-bottom: 25px; }
    .back-btn {
      background: none; border: none; color: #424242;
      display: flex; align-items: center; cursor: pointer;
      padding: 8px; margin-right: 10px; border-radius: 50%;
    }
    .back-btn:hover { background-color: #EEE; }
    .form-title { font-size: 20px; font-weight: 700; margin: 0; color: #212121; }

    .premium-form { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #F0F0F0; }

    .form-group { margin-bottom: 24px; }
    .form-group label { display: block; font-weight: 600; font-size: 13px; margin-bottom: 8px; color: #616161; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .input-wrapper {
      position: relative; display: flex; align-items: center;
      border: 1px solid #E0E0E0; border-radius: 10px;
      padding: 0 12px; background: #FDFDFD;
      transition: all 0.2s;
    }
    .input-wrapper:focus-within { border-color: #2196F3; background: white; box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1); }
    .textarea-wrapper { align-items: flex-start; padding-top: 12px; }

    .prefix-icon { color: #9E9E9E; font-size: 22px; margin-right: 12px; }
    
    .form-input {
      width: 100%; border: none; outline: none; background: transparent;
      padding: 14px 0; font-size: 16px; color: #212121;
    }
    .select-input { cursor: pointer; }
    .textarea-input { padding: 0; resize: none; min-height: 100px; }
    .form-input::placeholder { color: #BDBDBD; }

    .submit-btn {
      width: 100%; padding: 16px; background: #1565C0; color: white;
      border: none; border-radius: 12px; font-weight: 700; font-size: 16px;
      cursor: pointer; display: flex; justify-content: center; align-items: center;
      box-shadow: 0 4px 12px rgba(21, 101, 192, 0.3);
      transition: transform 0.1s;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .submit-btn:active { transform: scale(0.98); }
    .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; box-shadow: none; }
    
    .spinner-sm {
      border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white;
      border-radius: 50%; width: 20px; height: 20px;
      animation: spin 1s linear infinite;
    }
  `]
})
export class CustomerSupportComponent implements OnInit, OnDestroy {
  activeTab = 'tickets'; // 'tickets' | 'request'
  isLoadingTickets = true;
  tickets: any[] = [];

  // Request Logic
  step = 0;
  selectedCategory = '';
  recentRequests: any[] = [];

  // Form Data
  selectedSolicitudId: string | null = null;
  formAsunto = '';
  formDescripcion = '';
  submitting = false;

  private supabase: SupabaseClient;
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    effect(() => {
      const user = this.auth.user();
      if (user) {
        this.fetchTickets();
        this.fetchRecentRequests();
      }
    });
  }

  ngOnInit() {
    this.fetchTickets();
    this.fetchRecentRequests();

    this.refreshInterval = setInterval(() => {
      if (this.auth.currentUser) {
        // Silent refresh (don't show loading spinner every 3s)
        this.refreshDataSilent();
      }
    }, 3000);
  }

  refreshInterval: any;

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async refreshDataSilent() {
    // Re-use fetch logic but maybe without setting isLoading (or keep it fast)
    // For simplicity, we just call the fetch methods. 
    // Ideally we modify fetchTickets to accept a 'silent' param, but for now:
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      // Tickets
      const { data: tickets } = await this.supabase
        .from('soporte_tickets')
        .select('*')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false });

      if (tickets) {
        // Preserve expanded state if possible, or just update list
        // Simple update:
        this.tickets = tickets.map((t: any) => {
          const existing = this.tickets.find(old => old.id === t.id);
          return { ...t, expanded: existing ? existing.expanded : false };
        });
        this.cdr.detectChanges();
      }

      // Requests
      const { data: reqs } = await this.supabase
        .from('solicitudes')
        .select('id, estado')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reqs) {
        this.recentRequests = reqs;
        this.cdr.detectChanges();
      }

    } catch (e) {
      // Silent fail
    }
  }

  async fetchTickets() {
    this.isLoadingTickets = true;
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      const { data, error } = await this.supabase
        .from('soporte_tickets')
        .select('*')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.tickets = (data || []).map((t: any) => ({ ...t, expanded: false }));
    } catch (e) {
      console.error('Error tickets:', e);
    } finally {
      this.isLoadingTickets = false;
    }
  }

  async fetchRecentRequests() {
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      const { data, error } = await this.supabase
        .from('solicitudes')
        .select('id, estado, negocio_id')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error) {
        this.recentRequests = data || [];
      }
    } catch (e) {
      console.error('Error requests:', e);
    }
  }

  toggleTicket(ticket: any) {
    ticket.expanded = !ticket.expanded;
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.step = 1;
  }

  async submitTicket() {
    if (!this.formAsunto || !this.formDescripcion) {
      alert("Por favor completa todos los campos.");
      return;
    }

    this.submitting = true;
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      let descripcionFinal = this.formDescripcion;
      let asuntoFinal = this.formAsunto;

      if (this.selectedCategory === 'servicio' && this.selectedSolicitudId) {
        descripcionFinal += `\n\n[Referencia Orden ID: ${this.selectedSolicitudId}]`;
        asuntoFinal = `[Orden #${this.selectedSolicitudId.substring(0, 4)}] ${asuntoFinal}`;
      }

      let negocioId = null;
      if (this.selectedSolicitudId) {
        const selectedReq = this.recentRequests.find(r => r.id === this.selectedSolicitudId);
        if (selectedReq) negocioId = selectedReq.negocio_id;
      }

      const { error } = await this.supabase.from('soporte_tickets').insert({
        cliente_id: user.id,
        negocio_id: negocioId,
        tipo: this.selectedCategory === 'servicio' ? 'incidencia' : 'consulta',
        asunto: asuntoFinal,
        descripcion: descripcionFinal,
        estado: 'abierto'
      });

      if (error) throw error;

      alert("Ticket creado exitosamente");
      this.resetForm();
      this.activeTab = 'tickets';
      this.fetchTickets();

    } catch (e: any) {
      console.error('Error creating ticket:', e);
      alert('Error al crear ticket: ' + e.message);
    } finally {
      this.submitting = false;
    }
  }

  resetForm() {
    this.step = 0;
    this.selectedCategory = '';
    this.selectedSolicitudId = null;
    this.formAsunto = '';
    this.formDescripcion = '';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}
