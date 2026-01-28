import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Soporte para Socios</h1>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <div class="tab" [class.active]="activeTab === 'list'" (click)="activeTab = 'list'">
          Mis Tickets
        </div>
        <div class="tab" [class.active]="activeTab === 'create'" (click)="resetCreation(); activeTab = 'create'">
          Reportar Problema
        </div>
        <div class="tab" [class.active]="activeTab === 'incoming'" (click)="activeTab = 'incoming'">
          Recibidos
        </div>
      </div>

      <!-- Tab: List -->
      <div *ngIf="activeTab === 'list'" class="tab-content">
        <!-- ... existing list content ... (KEEPING AS IS, just ensuring context) -->
        <div *ngIf="isLoading" class="loading-container">
          <div class="spinner"></div>
        </div>

        <div *ngIf="!isLoading && tickets.length === 0" class="empty-state">
          <span class="material-icons empty-icon">support_agent</span>
          <h3>No tienes tickets de soporte</h3>
          <p>Tus consultas aparecerán aquí.</p>
        </div>

        <div *ngIf="!isLoading && tickets.length > 0" class="ticket-list">
          <div *ngFor="let t of tickets" class="ticket-card">
            <div class="ticket-header" (click)="t.expanded = !t.expanded">
              <div class="ticket-icon" [class.open]="t.estado !== 'resuelto'">
                 <span class="material-icons">{{ t.estado !== 'resuelto' ? 'priority_high' : 'check' }}</span>
              </div>
              <div class="ticket-info">
                <span class="ticket-subject">{{ t.asunto }}</span>
                <span class="ticket-meta">{{ t.tipo | uppercase }} • {{ formatDate(t.created_at) }}</span>
              </div>
              <span class="material-icons expand-icon">{{ t.expanded ? 'expand_less' : 'expand_more' }}</span>
            </div>
            
            <div class="ticket-body" *ngIf="t.expanded">
              <div class="detail-block">
                <strong>Detalles:</strong>
                <p>{{ t.descripcion }}</p>
              </div>
              
              <div *ngIf="t.respuesta_admin" class="admin-response">
                <strong>Respuesta de Plataforma:</strong>
                <p>{{ t.respuesta_admin }}</p>
              </div>

              <!-- Response Form (if no response yet) -->
              <div *ngIf="!t.respuesta_admin" class="response-form">
                <label>Escribe tu respuesta:</label>
                <textarea 
                  [(ngModel)]="t.responseText" 
                  rows="3" 
                  placeholder="Responde al cliente aquí..."></textarea>
                <button 
                  class="send-btn" 
                  (click)="sendResponse(t)" 
                  [disabled]="!t.responseText || t.sending">
                  <span *ngIf="t.sending">Enviando...</span>
                  <span *ngIf="!t.sending">ENVIAR RESPUESTA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Incoming (Recibidos) -->
      <div *ngIf="activeTab === 'incoming'" class="tab-content">
        <div *ngIf="isLoading" class="loading-container">
          <div class="spinner"></div>
        </div>

        <div *ngIf="!isLoading && incomingTickets.length === 0" class="empty-state">
           <span class="material-icons empty-icon">inbox</span>
           <h3>No hay reportes recibidos</h3>
           <p>Los reportes de tus clientes aparecerán aquí.</p>
        </div>

        <div *ngIf="!isLoading && incomingTickets.length > 0" class="ticket-list">
           <div *ngFor="let t of incomingTickets" class="ticket-card incoming">
             <div class="ticket-header" (click)="t.expanded = !t.expanded">
               <div class="ticket-icon" [class.open]="t.estado !== 'resuelto'">
                  <span class="material-icons">{{ t.estado !== 'resuelto' ? 'report_problem' : 'check_circle' }}</span>
               </div>
               <div class="ticket-info">
                 <span class="ticket-subject">{{ t.asunto }}</span>
                 <span class="ticket-meta">CLIENTE • {{ formatDate(t.created_at) }}</span>
               </div>
               <span class="material-icons expand-icon">{{ t.expanded ? 'expand_less' : 'expand_more' }}</span>
             </div>
             
             <div class="ticket-body" *ngIf="t.expanded">
               <div class="detail-block">
                 <strong>Descripción del Cliente:</strong>
                 <p>{{ t.descripcion }}</p>
               </div>

               <div *ngIf="t.respuesta_admin" class="admin-response">
                 <strong>Tu Respuesta:</strong>
                 <p>{{ t.respuesta_admin }}</p>
               </div>

               <div *ngIf="!t.respuesta_admin" class="response-form">
                 <label>Responder al cliente:</label>
                 <textarea 
                   [(ngModel)]="t.responseText" 
                   rows="3" 
                   placeholder="Escribe una solución..."></textarea>
                 <button 
                   class="send-btn" 
                   (click)="sendResponse(t)" 
                   [disabled]="!t.responseText || t.sending">
                   <span *ngIf="t.sending">Enviando...</span>
                   <span *ngIf="!t.sending">ENVIAR SOLUCIÓN</span>
                 </button>
               </div>
             </div>
           </div>
        </div>
      </div>

      <!-- Tab: Create -->
      <div *ngIf="activeTab === 'create'" class="tab-content create-flow">
        
        <!-- Step 0: Category Selection -->
        <div *ngIf="step === 0" class="category-list">
           <h2>Selecciona el tipo de problema:</h2>
           
           <div class="category-card" (click)="selectCategory('servicio')">
             <div class="cat-icon"><span class="material-icons">work_outline</span></div>
             <div class="cat-info">
               <h3>Problema con un Servicio</h3>
               <p>Incidencias con clientes o pedidos específicos</p>
             </div>
             <span class="material-icons arrow">chevron_right</span>
           </div>

           <div class="category-card" (click)="selectCategory('pagos')">
             <div class="cat-icon"><span class="material-icons">monetization_on</span></div>
             <div class="cat-info">
               <h3>Pagos y Facturación</h3>
               <p>Dudas sobre ganancias, retiros o comisiones</p>
             </div>
             <span class="material-icons arrow">chevron_right</span>
           </div>

           <div class="category-card" (click)="selectCategory('tecnico')">
             <div class="cat-icon"><span class="material-icons">mobile_friendly</span></div>
             <div class="cat-info">
               <h3>App / Técnico</h3>
               <p>Errores de la aplicación o sugerencias</p>
             </div>
             <span class="material-icons arrow">chevron_right</span>
           </div>

           <div class="category-card" (click)="selectCategory('general')">
             <div class="cat-icon"><span class="material-icons">help_outline</span></div>
             <div class="cat-info">
               <h3>Otro / General</h3>
               <p>Consultas generales al administrador</p>
             </div>
             <span class="material-icons arrow">chevron_right</span>
           </div>
        </div>

        <!-- Step 1: Form Details -->
        <div *ngIf="step === 1" class="form-details">
          <button class="back-btn" (click)="step = 0">
            <span class="material-icons">arrow_back</span> Volver
          </button>
          
          <h2>{{ getCategoryTitle() }}</h2>

          <!-- Link Order (Optional for Service) -->
          <div *ngIf="selectedCategory === 'servicio'" class="form-group">
            <label>Selecciona el servicio (opcional):</label>
            <select [(ngModel)]="selectedSolicitudId">
                <option [ngValue]="null">-- Vincular orden --</option>
                <option *ngFor="let s of recentRequests" [value]="s.id">
                   Orden #{{ s.id.substring(0,4) }} - {{ s.direccion_servicio || s.direccion }}
                </option>
            </select>
          </div>

          <div class="form-group">
            <label>Asunto</label>
            <input type="text" [(ngModel)]="asunto" placeholder="Resumen breve del problema">
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <textarea [(ngModel)]="descripcion" rows="5" placeholder="Explica detalladamente lo sucedido..."></textarea>
          </div>

          <button class="submit-btn" (click)="submitTicket()" [disabled]="isSubmitting || !asunto || !descripcion">
            <span *ngIf="isSubmitting">Enviando...</span>
            <span *ngIf="!isSubmitting">ENVIAR REPORTE</span>
          </button>

        </div>

      </div>

    </div>
  `,
  styles: [`
    .page-container { padding: 30px; max-width: 800px; margin: 0 auto; }
    .page-header h1 { color: #1565C0; margin-bottom: 20px; }

    /* Tabs */
    .tabs { display: flex; border-bottom: 1px solid #EEE; margin-bottom: 20px; }
    .tab {
      padding: 12px 24px; cursor: pointer; color: #666; font-weight: 500; border-bottom: 2px solid transparent;
    }
    .tab.active { color: #1565C0; border-bottom-color: #1565C0; }

    /* Loading / Empty */
    .loading-container { display: flex; justify-content: center; padding: 40px; }
    .spinner { width: 30px; height: 30px; border: 3px solid rgba(21,101,192,0.2); border-top-color: #1565C0; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; color: #999; margin-top: 40px; }
    .empty-icon { font-size: 60px; color: #DDD; }

    /* List */
    .ticket-list { display: flex; flex-direction: column; gap: 15px; }
    .ticket-card { background: white; border: 1px solid #EEE; border-radius: 12px; overflow: hidden; }
    .ticket-header { padding: 16px; display: flex; align-items: center; cursor: pointer; background: white; }
    .ticket-header:hover { background: #F9FAFB; }
    
    .ticket-icon { 
      width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      margin-right: 15px; background: #EEE; color: #999;
    }
    .ticket-icon.open { background: #FFF3E0; color: #F57C00; }
    
    .ticket-info { flex: 1; display: flex; flex-direction: column; }
    .ticket-subject { font-weight: 700; color: #333; }
    .ticket-meta { font-size: 12px; color: #999; margin-top: 4px; }
    .expand-icon { color: #CCC; }

    .ticket-body { padding: 0 16px 16px 71px; border-top: 1px solid #F5F5F5; }
    .detail-block { margin-top: 15px; color: #444; line-height: 1.5; }
    .admin-response { 
      margin-top: 15px; background: #E3F2FD; padding: 12px; border-radius: 8px; border-left: 4px solid #1565C0;
    }
    .pending-msg { margin-top: 15px; color: #999; font-size: 13px; }

    /* Create Flow */
    .category-list h2 { font-size: 18px; margin-bottom: 20px; }
    .category-card { 
      background: white; border: 1px solid #EEE; border-radius: 12px; padding: 20px;
      display: flex; align-items: center; cursor: pointer; margin-bottom: 12px;
      transition: all 0.2s;
    }
    .category-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .cat-icon { 
      width: 50px; height: 50px; border-radius: 50%; background: #E3F2FD; color: #1565C0;
      display: flex; align-items: center; justify-content: center; margin-right: 15px;
    }
    .cat-info h3 { margin: 0 0 5px; font-size: 16px; }
    .cat-info p { margin: 0; color: #666; font-size: 13px; }
    .arrow { margin-left: auto; color: #CCC; }

    .form-details { background: white; padding: 30px; border-radius: 16px; border: 1px solid #EEE; }
    .back-btn { background: none; border: none; color: #666; cursor: pointer; display: flex; align-items: center; gap: 5px; margin-bottom: 20px; padding: 0; }
    
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #333; }
    .form-group input, .form-group textarea, .form-group select { 
      width: 95%; padding: 12px; border: 1px solid #DDD; border-radius: 8px; font-family: inherit; font-size: 14px;
    }
    .submit-btn {
      width: 100%; padding: 14px; background: #1565C0; color: white; border: none; border-radius: 8px;
      font-weight: 700; cursor: pointer; font-size: 16px;
    }
    .submit-btn:disabled { background: #CCC; cursor: not-allowed; }
    
    .response-form { margin-top: 15px; padding-top: 15px; border-top: 1px solid #EEE; }
    .response-form label { display: block; font-weight: 600; margin-bottom: 8px; color: #333; }
    .response-form textarea { width: 95%; padding: 10px; border: 1px solid #DDD; border-radius: 8px; font-family: inherit; resize: vertical; }
    .send-btn { margin-top: 10px; padding: 10px 20px; background: #1565C0; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .send-btn:disabled { background: #CCC; cursor: not-allowed; }
  `]
})
export class AdminSupportComponent implements OnInit {
  auth = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  activeTab: 'list' | 'create' | 'incoming' = 'list';
  isLoading = true;
  tickets: any[] = [];
  incomingTickets: any[] = [];

  // Create Flow
  step = 0;
  selectedCategory: string | null = null;
  recentRequests: any[] = [];
  selectedSolicitudId: string | null = null;
  asunto = '';
  descripcion = '';
  isSubmitting = false;

  async ngOnInit() {
    await this.fetchTickets();
    await this.fetchIncomingTickets();
    this.fetchRecentRequests();
  }

  async fetchTickets() {
    this.isLoading = true;
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      const { data } = await this.auth.client
        .from('soporte_tickets')
        .select('*')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false });

      this.tickets = (data || []).map((t: any) => ({ ...t, expanded: false }));
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async fetchIncomingTickets() {
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      // First get my business id
      const { data: neg } = await this.auth.client.from('negocios').select('id').eq('owner_id', user.id).maybeSingle();
      if (!neg) return;

      const { data } = await this.auth.client
        .from('soporte_tickets')
        .select('*')
        .eq('negocio_id', neg.id)
        .order('created_at', { ascending: false });

      this.incomingTickets = (data || []).map((t: any) => ({ ...t, expanded: false }));
    } catch (e) {
      console.error(e);
    }
  }

  async fetchRecentRequests() {
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      // Get business id first
      const { data: neg } = await this.auth.client.from('negocios').select('id').eq('owner_id', user.id).maybeSingle();
      if (!neg) return;

      const { data } = await this.auth.client
        .from('solicitudes')
        .select('id, direccion, direccion_servicio')
        .eq('negocio_id', neg.id)
        .order('created_at', { ascending: false })
        .limit(10);

      this.recentRequests = data || [];
    } catch (e) { console.error(e); }
  }

  resetCreation() {
    this.step = 0;
    this.selectedCategory = null;
    this.asunto = '';
    this.descripcion = '';
    this.selectedSolicitudId = null;
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
    this.step = 1;
  }

  getCategoryTitle() {
    switch (this.selectedCategory) {
      case 'servicio': return "Problema de Servicio";
      case 'pagos': return "Pagos y Facturación";
      case 'tecnico': return "Error de App";
      default: return "Consulta General";
    }
  }

  async submitTicket() {
    if (!this.asunto || !this.descripcion) return;
    this.isSubmitting = true;

    try {
      const user = this.auth.currentUser;
      if (!user) {
        alert('Error: No hay usuario autenticado');
        this.isSubmitting = false;
        return;
      }

      let finalDesc = this.descripcion;
      let finalAsunto = this.asunto;

      if (this.selectedCategory === 'servicio' && this.selectedSolicitudId) {
        finalDesc += `\n\n[Referencia Orden ID: ${this.selectedSolicitudId}]`;
        finalAsunto = `[Orden #${this.selectedSolicitudId.substring(0, 4)}] ${finalAsunto}`;
      }

      const { error } = await this.auth.client.from('soporte_tickets').insert({
        cliente_id: user.id, // Keeping column name same as flutter
        tipo: this.selectedCategory || 'consulta',
        asunto: finalAsunto,
        descripcion: finalDesc,
        estado: 'abierto'
      });

      if (error) throw error;

      alert('Ticket creado exitosamente');
      this.resetCreation();
      this.activeTab = 'list';
      this.fetchTickets(); // Refresh list

    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async sendResponse(ticket: any) {
    if (!ticket.responseText) return;
    ticket.sending = true;
    this.cdr.detectChanges();

    try {
      const { error } = await this.auth.client
        .from('soporte_tickets')
        .update({
          respuesta_admin: ticket.responseText,
          estado: 'resuelto'
        })
        .eq('id', ticket.id);

      if (error) throw error;

      // Update local state
      ticket.respuesta_admin = ticket.responseText;
      ticket.estado = 'resuelto';
      ticket.responseText = '';

      alert('Respuesta enviada correctamente');
    } catch (e: any) {
      console.error(e);
      alert('Error al enviar respuesta: ' + e.message);
    } finally {
      ticket.sending = false;
      this.cdr.detectChanges();
    }
  }

  formatDate(dateStr: string) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
