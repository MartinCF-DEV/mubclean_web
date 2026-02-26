import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-admin-metrics',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-metrics.component.html',
    styleUrls: ['./admin-metrics.component.css']
})
export class AdminMetricsComponent implements OnInit, OnDestroy {
    auth = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    private supabase: SupabaseClient;

    isLoading = true;
    business: any = null;
    weeklyStats: { day: string, count: number, height: number }[] = [];

    // Placeholders for KPIs
    totalEarnings = 0;
    completedJobs = 0;
    averageRating = 0;
    retentionRate = 0;
    recurringClients = 0;
    newClients = 0;

    // Data for Export
    rawRequests: any[] = [];

    refreshInterval: any;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    ngOnInit() {
        this.fetchData();

        // Auto-refresh stats every 2s (Poling)
        this.refreshInterval = setInterval(() => {
            if (this.business) {
                this.fetchData(true);
            }
        }, 2000);
    }

    ngOnDestroy() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
    }

    async fetchData(silent = false) {
        if (!silent) this.isLoading = true;
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            const { data: negocio } = await this.supabase
                .from('negocios')
                .select('*')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (!negocio) return;
            this.business = negocio;

            const { data: reqs } = await this.supabase
                .from('solicitudes')
                .select('*')
                .eq('negocio_id', this.business.id)
                .order('created_at', { ascending: false });

            const requests = reqs || [];
            this.rawRequests = requests;
            this.generateChartData(requests);

            // Mock KPIs placeholders
            this.totalEarnings = requests.reduce((acc, r) => acc + (r.total_calculado || 0), 0);
            this.completedJobs = requests.filter(r => r.estado === 'completada').length || 15;
            this.averageRating = 4.8; // Constant mock for now
            this.calculateRetention(requests);

        } catch (e) {
            console.error(e);
        } finally {
            if (!silent) {
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        }
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
            const count = all.filter((r: any) => r.created_at?.startsWith(dateStr)).length;
            stats.push({ day: dayName, count });
        }

        const max = Math.max(...stats.map(s => s.count), 1);
        this.weeklyStats = stats.map(s => ({
            ...s,
            height: Math.round((s.count / max) * 100)
        }));
    }

    calculateRetention(all: any[]) {
        if (!all || all.length === 0) {
            this.retentionRate = 0;
            this.recurringClients = 0;
            this.newClients = 0;
            return;
        }

        const clientCounts: { [key: string]: number } = {};
        all.forEach(req => {
            if (req.cliente_id) {
                clientCounts[req.cliente_id] = (clientCounts[req.cliente_id] || 0) + 1;
            }
        });

        const totalUniqueClients = Object.keys(clientCounts).length;
        if (totalUniqueClients === 0) return;

        this.recurringClients = 0;
        this.newClients = 0;

        for (const clientId in clientCounts) {
            if (clientCounts[clientId] > 1) {
                this.recurringClients++;
            } else {
                this.newClients++;
            }
        }

        this.retentionRate = Math.round((this.recurringClients / totalUniqueClients) * 100);
    }

    exportToCSV() {
        if (!this.rawRequests || this.rawRequests.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

        const headers = ['ID Solicitud', 'Fecha Solicitada', 'Estado', 'Monto Total', 'Dirección'];
        const csvRows = [];
        csvRows.push(headers.join(','));

        for (const req of this.rawRequests) {
            const fecha = req.fecha_solicitada || req.created_at || 'Sin fecha';
            const estado = req.estado || 'Desconocido';
            const monto = req.total_calculado || 0;
            const direccion = `"${(req.direccion_servicio || req.direccion || 'Sin dirección').replace(/"/g, '""')}"`;

            csvRows.push(`${req.id},${fecha},${estado},${monto},${direccion}`);
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `Reporte_Servicios_${dateStr}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
