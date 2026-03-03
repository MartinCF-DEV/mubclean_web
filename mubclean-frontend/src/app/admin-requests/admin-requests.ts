import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-requests.html',
  styleUrls: ['./admin-requests.css'],
})
export class AdminRequestsComponent implements OnInit {
  router = inject(Router);
  auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private supabase: SupabaseClient;

  isLoading = true;
  business: any = null;
  errorMessage: string | null = null;

  nuevas: any[] = [];
  activas: any[] = [];
  historial: any[] = [];
  activeTab: 'nuevas' | 'activas' | 'historial' = 'nuevas';
  searchTerm: string = '';

  // Calendar State
  viewMode: 'list' | 'calendar' = 'list';
  currentMonth: Date = new Date();
  calendarDays: { date: Date, isCurrentMonth: boolean, requests: any[] }[] = [];
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  ngOnInit() {
    this.checkBusinessAndFetch();
  }

  setActiveTab(tab: 'nuevas' | 'activas' | 'historial') {
    this.activeTab = tab;
  }

  async checkBusinessAndFetch() {
    this.isLoading = true;
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      const res = await this.supabase
        .from('negocios')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      const negocio = res.data;
      const error = res.error as any;

      if (error && error.code !== 'PGRST116') {
        if (user.email === 'brandoncauich1@gmail.com') {
          this.business = { id: 'mock-id', nombre: 'Mock', owner_id: user.id };
          await this.fetchRequests();
          return;
        }
        throw error;
      }

      if (!negocio) {
        this.router.navigate(['/admin/register']);
        return;
      }

      this.business = negocio;
      await this.fetchRequests();
    } catch (e: any) {
      console.error("Requests Error", e);
      this.errorMessage = e.message;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async fetchRequests() {
    this.isLoading = true;
    try {
      if (!this.business) return;

      const { data: reqs, error } = await this.supabase
        .from('solicitudes')
        .select('*')
        .eq('negocio_id', this.business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rawRequests = reqs || [];

      // Map client profiles
      const clientIds = [...new Set(rawRequests.map(r => r.cliente_id).filter(id => !!id))];
      let clientsMap: any = {};
      if (clientIds.length > 0) {
        const { data: profiles } = await this.supabase
          .from('perfiles')
          .select('id, nombre_completo')
          .in('id', clientIds);

        if (profiles) {
          profiles.forEach(p => clientsMap[p.id] = p.nombre_completo);
        }
      }

      const requests = rawRequests.map(r => ({ ...r, nombre_cliente: clientsMap[r.cliente_id] || 'Cliente Desconocido' }));
      this.processRequests(requests);
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  processRequests(all: any[]) {
    const mapped = all.map(json => ({
      ...json,
      direccion: json['direccion_servicio'] || json['direccion'] || 'Sin dirección',
      fecha_solicitada: json['fecha_solicitada_cliente'] || json['fecha_solicitada'] || new Date().toISOString(),
      short_id: json.id ? String(json.id).substring(0, 8).toUpperCase() : ''
    }));

    this.nuevas = mapped.filter(s => ['pendiente', 'cotizada'].includes(s.estado));
    this.activas = mapped.filter(s => ['aceptada', 'agendada', 'en_proceso'].includes(s.estado));
    this.historial = mapped.filter(s => ['completada', 'cancelada'].includes(s.estado));

    this.generateCalendar();
  }

  // --- Calendar Logic ---
  toggleViewMode() {
    this.viewMode = this.viewMode === 'list' ? 'calendar' : 'list';
  }

  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  generateCalendar() {
    this.calendarDays = [];

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // First day of current month (0-6)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Number of days in previous month
    const prevDaysInMonth = new Date(year, month, 0).getDate();

    // All mapped requests to check bounds
    const allReqs = [...this.nuevas, ...this.activas, ...this.historial];

    // Previous month filler days
    for (let x = firstDayIndex; x > 0; x--) {
      const d = new Date(year, month - 1, prevDaysInMonth - x + 1);
      this.calendarDays.push({
        date: d,
        isCurrentMonth: false,
        requests: this.getRequestsForDate(d, allReqs)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      this.calendarDays.push({
        date: d,
        isCurrentMonth: true,
        requests: this.getRequestsForDate(d, allReqs)
      });
    }

    // Next month filler days (to complete 42 cells / 6 weeks if needed)
    const remainingCells = 42 - this.calendarDays.length;
    for (let j = 1; j <= remainingCells; j++) {
      const d = new Date(year, month + 1, j);
      this.calendarDays.push({
        date: d,
        isCurrentMonth: false,
        requests: this.getRequestsForDate(d, allReqs)
      });
    }
  }

  getRequestsForDate(date: Date, allReqs: any[]): any[] {
    const dateStr = date.toISOString().split('T')[0];
    return allReqs.filter(r => r.fecha_solicitada?.startsWith(dateStr));
  }

  goToDetail(req: any) {
    this.router.navigate(['/admin/request', req.id]);
  }

  getListForTab(): any[] {
    let list = [];
    if (this.activeTab === 'nuevas') list = this.nuevas;
    else if (this.activeTab === 'activas') list = this.activas;
    else list = this.historial;

    if (!this.searchTerm || !this.searchTerm.trim()) return list;

    const term = this.searchTerm.toLowerCase().trim();
    return list.filter(req =>
      (req.id && req.id.toLowerCase().includes(term)) ||
      (req.direccion && req.direccion.toLowerCase().includes(term))
    );
  }

  getEmptyMsg(): string {
    if (this.activeTab === 'nuevas') return "Todo al día. Sin solicitudes nuevas.";
    if (this.activeTab === 'activas') return "Tu agenda está libre. ¡Comparte tu enlace de catálogo con tus clientes para recibir reservas hoy mismo!";
    return "Tu historial está limpio.";
  }

  getColorClass(estado: string): string {
    return `status-${estado}`;
  }

  formatStatus(status: string): string {
    if (!status) return '';
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }
}
