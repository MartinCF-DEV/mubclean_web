import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
    router = inject(Router);
    auth = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    private supabase: SupabaseClient;

    // State
    isLoading = true;
    business: any = null;
    errorMessage: string | null = null;
    currentDate = new Date();
    licenseExpired = false;

    // Modal State
    modalVisible = false;
    modalTitle = '';
    modalList: any[] = [];
    modalType: 'jobs' | 'reports' = 'jobs';

    // Stats
    upcomingJobsCount = 0;
    newReportsCount = 0;
    weeklyStats: { day: string, count: number, height: number }[] = [];

    // Lists
    nuevas: any[] = [];
    activas: any[] = [];
    historial: any[] = [];
    tickets: any[] = []; // Store filtered tickets

    activeTab: 'nuevas' | 'activas' | 'historial' = 'nuevas';
    refreshInterval: any;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    ngOnInit() {
        this.checkBusinessAndFetch();

        // Auto-refresh stats every 10s
        this.refreshInterval = setInterval(() => {
            if (this.business && !this.licenseExpired) {
                this.fetchData(true);
            }
        }, 10000);
    }

    ngOnDestroy() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
    }

    setActiveTab(tab: 'nuevas' | 'activas' | 'historial') {
        this.activeTab = tab;
    }

    async checkBusinessAndFetch() {
        this.isLoading = true;
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            const { data: negocio, error } = await this.supabase
                .from('negocios')
                .select('*')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                // Dev fallback
                if (user.email === 'brandoncauich1@gmail.com') {
                    this.business = { id: 'mock-id', nombre: 'Mock', owner_id: user.id };
                    await this.fetchData();
                    return;
                }
                throw error;
            }

            if (!negocio) {
                this.router.navigate(['/admin/register']);
                return;
            }

            this.business = negocio;

            // Check Expiry
            if (this.business.license_expiry) {
                const expiry = new Date(this.business.license_expiry);
                if (expiry < new Date()) {
                    this.licenseExpired = true;
                }
            }

            // NOTE: For testing purposes, uncomment to force expiry
            // this.licenseExpired = true;

            if (!this.licenseExpired) {
                await this.fetchData();
            }

        } catch (e: any) {
            console.error("Dashboard Error", e);
            this.errorMessage = e.message;
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    async fetchData(silent = false) {
        if (!silent) this.isLoading = true;
        try {
            if (!this.business) return;

            // 1. Fetch Requests
            const { data: reqs, error } = await this.supabase
                .from('solicitudes')
                .select('*')
                .eq('negocio_id', this.business.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const requests = reqs || [];

            this.processRequests(requests);
            this.calculateStats(requests);
            this.generateChartData(requests);

            // 2. Fetch Relevant Tickets (Smart Link)
            // Strategy: Get tickets from clients we have worked with, then check description for Order IDs.

            // Get unique client IDs from our requests
            const clientIds = [...new Set(requests.map(r => r.cliente_id).filter(id => !!id))];

            if (clientIds.length > 0) {
                const { data: tickets, error: ticketError } = await this.supabase
                    .from('soporte_tickets')
                    .select('*')
                    .in('cliente_id', clientIds)
                    .neq('estado', 'resuelto') // Only open tickets
                    .order('created_at', { ascending: false });

                if (!ticketError && tickets) {
                    const myRequestIds = new Set(requests.map(r => r.id));

                    this.tickets = tickets.filter((t: any) => {
                        // Check for ID in description
                        const match = t.descripcion.match(/Reference Orden ID: ([a-f0-9\-]+)/) ||
                            t.descripcion.match(/Referencia Orden ID: ([a-f0-9\-]+)/);

                        if (match && match[1]) {
                            return myRequestIds.has(match[1]);
                        }
                        return false;
                    });
                }
            } else {
                this.tickets = [];
            }

            this.newReportsCount = this.tickets.length;

        } catch (e) {
            console.error(e);
        } finally {
            if (!silent) {
                this.isLoading = false;
                this.cdr.detectChanges();
            }
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

    calculateStats(all: any[]) {
        this.upcomingJobsCount = all.filter(s => s.estado === 'agendada' || s.estado === 'aceptada').length;
    }

    generateChartData(all: any[]) {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const today = new Date();
        const stats = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = days[d.getDay()];
            const count = all.filter(r => r.created_at?.startsWith(dateStr)).length;
            stats.push({ day: dayName, count });
        }

        const max = Math.max(...stats.map(s => s.count), 1);
        this.weeklyStats = stats.map(s => ({
            ...s,
            height: Math.round((s.count / max) * 100)
        }));
    }

    openModal(type: 'jobs' | 'reports') {
        this.modalType = type;
        this.modalVisible = true;

        if (type === 'jobs') {
            this.modalTitle = 'Próximos Trabajos';
            this.modalList = this.activas.filter(s => ['aceptada', 'agendada'].includes(s.estado));
        } else {
            this.modalTitle = 'Reportes Nuevos';
            // Use filtered tickets
            this.modalList = this.tickets;
        }
    }

    closeModal() {
        this.modalVisible = false;
    }

    goToDetail(req: any) {
        if (this.modalVisible) this.closeModal();

        // If it's a ticket (has 'asunto'), maybe navigate to support?
        // But dashboard usually navigates to Request Detail.
        // For Tickets, we should ideally go to a Ticket Detail page or Support tab.
        // Let's check matching logic.

        if (req.asunto) {
            // It is a ticket
            this.router.navigate(['/admin/support']); // Go to support list
        } else {
            this.router.navigate(['/admin/request', req.id]);
        }
    }

    // Helpers
    getIconForState(estado: string): string {
        switch (estado) {
            case 'pendiente': return 'notifications_active';
            case 'cotizada': return 'request_quote';
            case 'aceptada': return 'check_circle';
            case 'agendada': return 'event';
            case 'en_proceso': return 'cleaning_services';
            default: return 'history';
        }
    }

    getColorClass(estado: string): string {
        return `status-${estado}`;
    }

    getListForTab(): any[] {
        if (this.activeTab === 'nuevas') return this.nuevas;
        if (this.activeTab === 'activas') return this.activas;
        return this.historial;
    }

    getEmptyMsg(): string {
        if (this.activeTab === 'nuevas') return "Todo al día. Sin solicitudes nuevas.";
        if (this.activeTab === 'activas') return "No hay trabajos activos por ahora.";
        return "Tu historial está limpio.";
    }
}
