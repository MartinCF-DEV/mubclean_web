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
    tickets: any[] = []; // Store filtered tickets
    upcomingJobs: any[] = []; // Store for the modal

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
            if (!this.business.license_expiry) {
                this.licenseExpired = true;
            } else {
                const expiry = new Date(this.business.license_expiry);
                if (expiry < new Date()) {
                    this.licenseExpired = true;
                }
            }

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
            const requests = (reqs || []).map(json => ({
                ...json,
                direccion: json['direccion_servicio'] || json['direccion'] || 'Sin dirección',
                fecha_solicitada: json['fecha_solicitada_cliente'] || json['fecha_solicitada'] || new Date().toISOString()
            }));

            this.calculateStats(requests);
            this.generateChartData(requests);

            // 2. Fetch Relevant Tickets
            let allRelevantTickets: any[] = [];

            // A) Client Tickets related to our orders
            const clientIds = [...new Set(requests.map(r => r.cliente_id).filter(id => !!id))];
            if (clientIds.length > 0) {
                const { data: clientTickets } = await this.supabase
                    .from('soporte_tickets')
                    .select('*')
                    .in('cliente_id', clientIds)
                    .neq('estado', 'resuelto')
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (clientTickets) {
                    const myRequestIds = new Set(requests.map(r => r.id));
                    const related = clientTickets.filter((t: any) => {
                        const match = t.descripcion?.match(/Reference Orden ID: ([a-f0-9\-]+)/) ||
                            t.descripcion?.match(/Referencia Orden ID: ([a-f0-9\-]+)/);
                        return match && match[1] && myRequestIds.has(match[1]);
                    });
                    allRelevantTickets.push(...related);
                }
            }

            // B) My own tickets (created by the business owner)
            const { data: myTickets } = await this.supabase
                .from('soporte_tickets')
                .select('*')
                .eq('cliente_id', this.business.owner_id)
                .neq('estado', 'resuelto')
                .order('created_at', { ascending: false })
                .limit(10);

            if (myTickets) {
                allRelevantTickets.push(...myTickets);
            }

            // Sort and limit
            allRelevantTickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // Filter out exact duplicates by ID (just in case)
            const seen = new Set();
            this.tickets = allRelevantTickets.filter(t => {
                if (seen.has(t.id)) return false;
                seen.add(t.id);
                return true;
            }).slice(0, 5); // Keep top 5 most recent total

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


    calculateStats(all: any[]) {
        this.upcomingJobs = all.filter(s => s.estado === 'agendada' || s.estado === 'aceptada');
        this.upcomingJobsCount = this.upcomingJobs.length;
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
            this.modalList = this.upcomingJobs;
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
    getColorClass(estado: string): string {
        return `status-${estado}`;
    }
}
