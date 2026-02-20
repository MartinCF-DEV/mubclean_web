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
      const requests = reqs || [];
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
      fecha_solicitada: json['fecha_solicitada_cliente'] || json['fecha_solicitada'] || new Date().toISOString()
    }));

    this.nuevas = mapped.filter(s => ['pendiente', 'cotizada'].includes(s.estado));
    this.activas = mapped.filter(s => ['aceptada', 'agendada', 'en_proceso'].includes(s.estado));
    this.historial = mapped.filter(s => ['completada', 'cancelada'].includes(s.estado));
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
    if (this.activeTab === 'activas') return "No hay trabajos activos por ahora.";
    return "Tu historial está limpio.";
  }

  getColorClass(estado: string): string {
    return `status-${estado}`;
  }
}
