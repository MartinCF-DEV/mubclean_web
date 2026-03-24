import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin-tech-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Seguimiento y Agenda</h1>
        <p>Control de notificaciones y servicios asignados a tu equipo.</p>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="activeTab === 'notificaciones'" (click)="activeTab = 'notificaciones'">
          <span class="material-icons">inbox</span> Bandeja de Entrada <span class="badge" *ngIf="notifications.length > 0">{{notifications.length}}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'agenda'" (click)="activeTab = 'agenda'">
          <span class="material-icons">event_note</span> Agenda de Técnicos
        </button>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <div class="spinner"></div>
      </div>

      <!-- Tab 1: Notificaciones -->
      <div *ngIf="activeTab === 'notificaciones'">
        <div *ngIf="!isLoading && notifications.length === 0" class="empty-state">
          <span class="material-icons empty-icon">check_circle</span>
          <h3>Todo al día</h3>
          <p>No tienes notificaciones pendientes de los técnicos.</p>
        </div>

        <div *ngIf="!isLoading && notifications.length > 0" class="notifications-list">
          <div *ngFor="let n of notifications" class="notification-card" [ngClass]="n.tipo">
            <div class="icon-container">
              <span class="material-icons" *ngIf="n.tipo === 'rechazo'">cancel</span>
              <span class="material-icons" *ngIf="n.tipo === 'comentario'">comment</span>
              <span class="material-icons" *ngIf="n.tipo === 'alerta'">warning</span>
              <span class="material-icons" *ngIf="n.tipo === 'asignacion'">assignment_ind</span>
            </div>
            <div class="content">
              <div class="header-row">
                <h3>{{ n.tecnico_nombre || 'Técnico Desconocido' }}</h3>
                <span class="time">{{ n.fecha | date:'short' }}</span>
              </div>
              <p class="servicio-ref">Servicio #{{ n.solicitud_id | slice:0:8 }}</p>
              <p class="mensaje" style="white-space: pre-wrap;">{{ n.mensaje }}</p>
            </div>
            <button class="mark-read-btn" (click)="marcarLeida(n.id)">
              Marcar Leída
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 2: Agenda -->
      <div *ngIf="activeTab === 'agenda'">
        <div *ngIf="!isLoading && agendas.length === 0" class="empty-state">
          <span class="material-icons empty-icon">event_busy</span>
          <h3>Sin asignaciones activas</h3>
          <p>No hay técnicos con servicios pendientes o en proceso en este momento.</p>
        </div>

        <div *ngIf="!isLoading && agendas.length > 0" class="agenda-grid">
          <div *ngFor="let tech of agendas" class="tech-agenda-card">
            <div class="tech-header">
              <div class="tech-avatar">{{ getInitials(tech.nombre) }}</div>
              <div class="tech-info">
                <h3>{{ tech.nombre }}</h3>
                <p>{{ tech.telefono || 'Sin teléfono registrado' }}</p>
              </div>
              <div class="tech-badge">{{ tech.servicios.length }} servicios</div>
            </div>

            <div class="tech-services-container">
              <div *ngIf="tech.servicios.length === 0" class="no-services">
                El técnico no tiene servicios asignados actualmente.
              </div>
              
              <details class="services-accordion" *ngIf="tech.servicios.length > 0">
                <summary class="accordion-header">
                  Mostrar {{ tech.servicios.length }} servicios asignados
                  <span class="material-icons chevron">expand_more</span>
                </summary>
                
                <div class="services-scroll-area">
                  <div *ngFor="let s of tech.servicios" class="service-item">
                    <div class="service-header">
                      <span class="service-status" [ngClass]="s.estado">{{ formatStatus(s.estado) }}</span>
                      <span class="service-date">{{ s.fecha | date:'short' }}</span>
                    </div>
                    <div class="service-client">
                      <strong>{{ s.cliente?.nombre_completo || 'Cliente' }}</strong>
                      <span>📍 {{ s.direccion }}</span>
                    </div>
                    
                    <ul class="service-items-list">
                      <li *ngFor="let item of s.items">
                        • {{ item.cantidad }}x {{ item.nombre }} <span *ngIf="item.descripcion">({{ item.descripcion }})</span>
                      </li>
                    </ul>

                    <button class="view-request-btn" (click)="goToRequest(s.id)">
                      Ver Solicitud <span class="material-icons">east</span>
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 30px; font-family: 'Inter', sans-serif; }
    .page-header h1 { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 800; color: #0F172A; margin: 0; }
    .page-header p { color: #64748B; font-size: 16px; margin-top: 5px; }
    
    .loading-container { display: flex; justify-content: center; padding: 50px; }
    .spinner { border: 4px solid #F1F5F9; border-top: 4px solid #000; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .empty-state { text-align: center; color: #64748B; margin-top: 50px; }
    .empty-icon { font-size: 60px; color: #CBD5E1; margin-bottom: 20px; }

    .notifications-list { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
    .notification-card { 
      display: flex; gap: 16px; background: white; padding: 20px; border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.04);
      align-items: center;
    }
    .notification-card.rechazo .icon-container { background: #FEE2E2; color: #DC2626; }
    .notification-card.comentario .icon-container { background: #EFF6FF; color: #2563EB; }
    .notification-card.alerta .icon-container { background: #FEF3C7; color: #D97706; }
    
    .icon-container { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .content { flex: 1; }
    .header-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .header-row h3 { margin: 0; font-size: 16px; font-weight: 700; color: #0F172A; }
    .time { font-size: 12px; color: #94A3B8; }
    .servicio-ref { margin: 0; font-size: 13px; font-weight: 600; color: #1565C0; }
    .mensaje { margin: 8px 0 0; font-size: 14px; color: #475569; }

    .mark-read-btn { 
      padding: 8px 16px; border-radius: 8px; border: 1px solid #E2E8F0; background: white;
      color: #64748B; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 13px;
    }
    .mark-read-btn:hover { background: #F8FAFC; color: #0F172A; border-color: #CBD5E1; }

    /* Tabs */
    .tabs { display: flex; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid #E2E8F0; padding-bottom: 12px; }
    .tab-btn { background: none; border: none; font-size: 15px; font-weight: 600; color: #64748B; padding: 8px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; border-radius: 8px; transition: all 0.2s; }
    .tab-btn:hover { background: #F1F5F9; color: #0F172A; }
    .tab-btn.active { background: #E0F2FE; color: #0284C7; }
    .badge { background: #EF4444; color: white; font-size: 11px; padding: 2px 6px; border-radius: 10px; }

    /* Agenda Grid */
    .agenda-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; margin-top: 24px; }
    .tech-agenda-card { background: white; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden; display: flex; flex-direction: column; }
    .tech-header { background: #F8FAFC; padding: 16px 20px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; gap: 16px; }
    .tech-avatar { width: 44px; height: 44px; background: #DBEAFE; color: #1D4ED8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; flex-shrink: 0; }
    .tech-info { flex: 1; overflow: hidden; }
    .tech-info h3 { margin: 0; font-size: 16px; font-weight: 700; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tech-info p { margin: 2px 0 0; font-size: 13px; color: #64748B; }
    .tech-badge { background: #1565C0; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; }
    
    .tech-services-container { flex: 1; background: #FAFAFA; border-top: 1px solid #E2E8F0; }
    .no-services { font-size: 13px; color: #94A3B8; font-style: italic; text-align: center; padding: 20px; }
    
    .services-accordion { width: 100%; }
    .accordion-header {
      padding: 16px 20px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      color: #1565C0;
      background: #F0F9FF;
      display: flex;
      justify-content: space-between;
      align-items: center;
      list-style: none; /* Hide default arrow */
      transition: background 0.2s;
    }
    .accordion-header::-webkit-details-marker { display: none; }
    .accordion-header:hover { background: #E0F2FE; }
    .services-accordion[open] .chevron { transform: rotate(180deg); transition: transform 0.2s; }
    
    .services-scroll-area {
      max-height: 350px;
      overflow-y: auto;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Custom Scrollbar for the area */
    .services-scroll-area::-webkit-scrollbar { width: 6px; }
    .services-scroll-area::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 4px; }
    .services-scroll-area::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
    .services-scroll-area::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

    .service-item { background: white; border-radius: 12px; padding: 16px; border: 1px solid #E2E8F0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); display: flex; flex-direction: column; }
    .service-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .service-status { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }
    .service-status.agendada { background: #D1FAE5; color: #047857; }
    .service-status.en_proceso { background: #FEF3C7; color: #B45309; }
    .service-date { font-size: 12px; color: #64748B; font-weight: 600; }
    
    .service-client { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
    .service-client strong { font-size: 14px; color: #0F172A; }
    .service-client span { font-size: 13px; color: #475569; }
    
    .service-items-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; border-top: 1px dashed #E2E8F0; padding-top: 12px; }
    .service-items-list li { font-size: 13px; color: #334155; }
    
    .view-request-btn {
      margin-top: 16px;
      width: 100%;
      background: #1565C0;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    .view-request-btn:hover { background: #0D47A1; }
    .view-request-btn .material-icons { font-size: 16px; }
  `]
})
export class AdminTechTrackingComponent implements OnInit {
  auth = inject(AuthService);
  cdr = inject(ChangeDetectorRef);
  router = inject(Router);
  
  activeTab: 'notificaciones' | 'agenda' = 'notificaciones';
  isLoading = true;
  notifications: any[] = [];
  agendas: any[] = [];
  negocioId: string | null = null;

  ngOnInit() {
    this.fetchData();
  }

  async fetchData() {
    this.isLoading = true;
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      const { data: negocio } = await this.auth.client
        .from('negocios')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!negocio) return;
      this.negocioId = negocio.id;

      // Ensure the table exists in Supabase. We simulate reading from 'notificaciones_tecnico'
      // Or reading rejected requests from 'solicitudes'
      const { data, error } = await this.auth.client
        .from('notificaciones_tecnico')
        .select('*')
        .eq('negocio_id', this.negocioId)
        .eq('leida', false)
        .order('fecha', { ascending: false });

      if (error) {
        // If table doesn't exist, we fallback nicely (this handles the UI part while backend/database adopts it)
        console.warn('notificaciones_tecnico table is probably missing or restricted', error);
        this.notifications = [];
      } else {
        this.notifications = data || [];
      }

      // Fetch Agenda (Technicians + Assigned requests) independently to bypass tricky joins
      const [techsRes, reqsRes] = await Promise.all([
        this.auth.client
          .from('empleados_negocio')
          .select('id, perfiles(nombre_completo, telefono)')
          .eq('negocio_id', this.negocioId)
          .eq('activo', true),
          
        this.auth.client
          .from('solicitudes')
          .select('*, cliente:cliente_id(nombre_completo)')
          .eq('negocio_id', this.negocioId)
      ]);

      const techs = techsRes.data || [];
      const todasSolicitudes = reqsRes.data || [];
      
      // Filter the allowed states safely locally
      const activas = todasSolicitudes.filter((s: any) => {
        if (!s.estado) return false;
        const e = s.estado.toLowerCase();
        return ['agendado', 'agendada', 'en_proceso', 'en proceso'].includes(e);
      });

      if (techsRes.error) console.error('Error fetching techs:', techsRes.error);
      if (reqsRes.error) console.error('Error fetching reqs:', reqsRes.error);

      // Extract all active request IDs to fetch their items
      const activasIds = activas.map(a => a.id);
      let allItems: any[] = [];
      
      if (activasIds.length > 0) {
        const { data: itemsData } = await this.auth.client
          .from('items_solicitud')
          .select('solicitud_id, cantidad, descripcion_item, servicios_catalogo(nombre)')
          .in('solicitud_id', activasIds);
          
        allItems = itemsData || [];
      }

      this.agendas = techs.map((tech: any) => {
        // Encontrar las solicitudes asignadas a este técnico (casting to string to avoid int vs string mismatch)
        const techServicios = activas.filter((s: any) => String(s.tecnico_asignado_id) === String(tech.id));
        
        return {
          id: tech.id,
          nombre: tech.perfiles?.nombre_completo || 'Desconocido',
          telefono: tech.perfiles?.telefono,
          servicios: techServicios.map((s: any) => {
            const itemsDelServicio = allItems.filter(i => i.solicitud_id === s.id);
            return {
              id: s.id,
              estado: s.estado,
              fecha: s.fecha_solicitada_cliente || s.fecha_solicitud,
              direccion: s.direccion_servicio || s.direccion,
              cliente: s.cliente,
              items: itemsDelServicio.map((i: any) => ({
                cantidad: i.cantidad,
                nombre: i.servicios_catalogo?.nombre,
                descripcion: i.descripcion_item
              }))
            };
          })
        };
      });

    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  formatStatus(status: string): string {
    if (!status) return '';
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }

  async marcarLeida(id: string) {
    try {
      await this.auth.client.from('notificaciones_tecnico').update({ leida: true }).eq('id', id);
      this.notifications = this.notifications.filter(n => n.id !== id);
    } catch (e) {
      console.error(e);
    }
  }

  goToRequest(id: string) {
    if (id) {
      this.router.navigate(['/admin/request', id]);
    }
  }
}
