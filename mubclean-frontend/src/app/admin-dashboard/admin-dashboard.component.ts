import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
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
    showCopyToast = false;

    // Stats
    upcomingJobsCount = 0;
    newReportsCount = 0;
    activeTechnicians = 0;
    totalTechnicians = 0;
    weeklyEarnings = 0;

    // Lists
    tickets: any[] = [];
    upcomingJobs: any[] = [];
    recentRequests: any[] = [];

    refreshInterval: any;

    constructor() {
        this.supabase = this.auth.client;
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

            const clientIds = [...new Set((reqs || []).map(r => r.cliente_id).filter(id => !!id))];
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

            const requests = (reqs || []).map(json => ({
                ...json,
                direccion: json['direccion_servicio'] || json['direccion'] || 'Sin dirección',
                fecha_solicitada: json['fecha_solicitada_cliente'] || json['fecha_solicitada'] || new Date().toISOString(),
                nombre_cliente: clientsMap[json.cliente_id] || 'Cliente Desconocido'
            }));

            this.calculateStats(requests);
            this.recentRequests = requests.slice(0, 5);

            // Calculate Weekly Earnings (Mock / Simple sum of recent)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const recentReqs = requests.filter((r: any) => ['completada', 'completado'].includes(String(r.estado).toLowerCase()) && new Date(r.created_at) >= oneWeekAgo);
            this.weeklyEarnings = recentReqs.reduce((acc: any, r: any) => acc + (r.precio_total || r.total_calculado || 0), 0);

            // Fetch Employees for Active Techs stat
            const { data: emps } = await this.supabase
                .from('empleados_negocio')
                .select('activo')
                .eq('negocio_id', this.business.id);
            if (emps) {
                this.totalTechnicians = emps.length;
                this.activeTechnicians = emps.filter(e => e.activo).length;
            }

            // 2. Fetch Relevant Tickets
            let allRelevantTickets: any[] = [];

            // A) Client Tickets related to our orders
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

            // B) My own tickets (Only show if MubClean has responded or updated it, so NOT 'pendiente')
            // AND the business hasn't read it yet
            const { data: myTickets } = await this.supabase
                .from('soporte_tickets')
                .select('*')
                .eq('cliente_id', this.business.owner_id)
                .neq('estado', 'pendiente')
                .neq('estado', 'resuelto')
                .eq('leido_por_cliente', false) /* Only show unread support tickets */
                .order('created_at', { ascending: false })
                .limit(10);

            if (myTickets) {
                myTickets.forEach((t: any) => t.isUnread = true);
                allRelevantTickets.push(...myTickets);
            }

            // C) Unassigned or pending Requests (Act as notifications)
            // ONLY show if it hasn't been read by business, and it's still pending.
            const pendingRequests = requests.filter(r => r.estado === 'pendiente' && r.leido_por_negocio !== true);
            pendingRequests.slice(0, 10).forEach(pr => {
                allRelevantTickets.push({
                    id: pr.id,
                    asunto: '¡Nueva Solicitud: ' + pr.nombre_cliente + ' en ' + pr.direccion + '!',
                    tipo: 'solicitud',
                    created_at: pr.created_at,
                    isRequest: true,
                    reqData: pr,
                    isUnread: true
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

    copyCatalogLink() {
        const businessId = this.business?.id || '';
        const origin = window.location.origin;
        const url = `${origin}/customer/business/${businessId}`;
        navigator.clipboard.writeText(url).then(() => {
            this.showCopyToast = true;
            this.cdr.detectChanges();
            setTimeout(() => { this.showCopyToast = false; this.cdr.detectChanges(); }, 3000);
        }).catch(() => {
            prompt('Copia este enlace:', url);
        });
    }

    async markAsReadAndGo(req: any) {
        try {
            if (req.isRequest) {
                // Update leido_por_negocio in Supabase
                this.supabase.from('solicitudes')
                    .update({ leido_por_negocio: true })
                    .eq('id', req.id)
                    .then(); // no await needed here for navigation
                this.router.navigate(['/admin/request', req.id]);
            } else if (req.asunto) {
                // This is a support ticket, so update leido_por_cliente
                this.supabase.from('soporte_tickets')
                    .update({ leido_por_cliente: true })
                    .eq('id', req.id)
                    .then(); // no await needed
                this.router.navigate(['/admin/support']);
            } else {
                this.router.navigate(['/admin/request', req.id]);
            }
        } catch (e) {
            console.error("Error marking as read", e);
        }
    }

    goToDetail(req: any) {
        if (req.isRequest || !req.asunto) {
            this.router.navigate(['/admin/request', req.id]);
        } else {
            this.router.navigate(['/admin/support']);
        }
    }

    goToMetrics() {
        this.router.navigate(['/admin/metrics']);
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
