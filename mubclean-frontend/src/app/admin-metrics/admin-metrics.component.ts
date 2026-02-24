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
            this.generateChartData(requests);

            // Mock KPIs placeholders
            this.totalEarnings = requests.reduce((acc, r) => acc + (r.total_calculado || 0), 0) || 12500; // Mock calculation
            this.completedJobs = requests.filter(r => r.estado === 'completada').length || 15;
            this.averageRating = 4.8; // Constant mock for now

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
}
