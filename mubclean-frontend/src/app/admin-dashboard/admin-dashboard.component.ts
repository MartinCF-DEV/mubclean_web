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

    // Lists
    tickets: any[] = []; // Store filtered tickets
    upcomingJobs: any[] = []; // Store for the modal
    recentRequests: any[] = []; // Store for Recent Activity

    refreshInterval: any;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    ngOnInit() {
        this.checkBusinessAndFetch();

        // Auto-refresh stats every 2s (Poling)
        this.refreshInterval = setInterval(() => {
            if (this.business && !this.licenseExpired) {
                this.fetchData(true);
            }
        }, 2000);
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
            this.recentRequests = requests.slice(0, 5);

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

            // C) Unassigned or pending Requests (Act as notifications)
            const pendingRequests = requests.filter(r => r.estado === 'pendiente' || r.estado === 'EN_PROCESO');
            pendingRequests.slice(0, 10).forEach(pr => {
                allRelevantTickets.push({
                    id: pr.id,
                    asunto: '¡Nueva Solicitud: ' + pr.direccion + '!',
                    tipo: 'solicitud',
                    created_at: pr.created_at,
                    isRequest: true,
                    reqData: pr
                });
            });

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

        if (req.isRequest) {
            this.router.navigate(['/admin/request', req.id]);
        } else if (req.asunto) {
            // It is a ticket
            this.router.navigate(['/admin/support']); // Go to support list
        } else {
            this.router.navigate(['/admin/request', req.id]);
        }
    }

    // Helpers
    getColorClass(estado: string): string {
        if (!estado) return 'status-pendiente';
        const e = estado.toLowerCase().replace(' ', '_');
        return `status-${e}`;
    }

    formatStatus(status: string): string {
        if (!status) return 'Desconocido';
        const str = status.replace('_', ' ').toLowerCase();
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
