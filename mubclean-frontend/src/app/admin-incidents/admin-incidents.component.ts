import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { AdminReportIncidentComponent } from '../admin-report-incident/admin-report-incident.component';

@Component({
    selector: 'app-admin-incidents',
    standalone: true,
    imports: [CommonModule, FormsModule, AdminReportIncidentComponent],
    templateUrl: './admin-incidents.component.html',
    styleUrls: ['./admin-incidents.component.css']
})
export class AdminIncidentsComponent implements OnInit {
    private http = inject(HttpClient);
    private supabase: SupabaseClient;

    incidents: any[] = [];
    isLoading = true;
    activeTab: 'abierto' | 'en_revision' | 'resuelto' = 'abierto';
    showModal = false;
    negocioId: string | null = null;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async ngOnInit() {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return;

        // Get negocio_id for this admin user
        const { data: negocio } = await this.supabase
            .from('negocios')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (negocio) {
            this.negocioId = negocio.id;
            await this.loadIncidents();
        }
    }

    async loadIncidents() {
        if (!this.negocioId) return;
        this.isLoading = true;
        try {
            const data: any = await firstValueFrom(
                this.http.get(`${environment.apiUrl}/incidents?negocioId=${this.negocioId}`)
            );
            this.incidents = data || [];
        } catch (e) {
            console.error('Error loading incidents', e);
        } finally {
            this.isLoading = false;
        }
    }

    getForTab(): any[] {
        return this.incidents.filter(i => i.estado === this.activeTab);
    }

    countFor(tab: string): number {
        return this.incidents.filter(i => i.estado === tab).length;
    }

    openModal() {
        this.showModal = true;
    }

    onModalClosed(saved: boolean) {
        this.showModal = false;
        if (saved) this.loadIncidents();
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    tipoIcon(tipo: string): string {
        const map: Record<string, string> = {
            'Incidencia de Servicio': 'warning',
            'Daño en Propiedad': 'home_repair_service',
            'Retraso o No Presentación': 'schedule',
            'Queja del Cliente': 'feedback',
            'Problema con Personal': 'person_off',
            'Servicio Incompleto': 'do_not_disturb',
            'Otro': 'more_horiz'
        };
        return map[tipo] || 'report_problem';
    }

    estadoLabel(estado: string): string {
        const map: Record<string, string> = {
            'abierto': 'Abierto',
            'en_revision': 'En Revisión',
            'resuelto': 'Resuelto'
        };
        return map[estado] || estado;
    }
}
