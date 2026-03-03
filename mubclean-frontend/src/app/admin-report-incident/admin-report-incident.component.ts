import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-admin-report-incident',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-report-incident.component.html',
    styleUrls: ['./admin-report-incident.component.css']
})
export class AdminReportIncidentComponent implements OnInit {
    @Input() solicitudId: string | null = null;
    @Input() negocioId: string | null = null;
    @Input() solicitudLabel: string = '';
    @Output() closed = new EventEmitter<boolean>(); // true = saved

    private http = inject(HttpClient);
    private supabase: SupabaseClient;

    tipo = '';
    asunto = '';
    descripcion = '';
    isSaving = false;
    successMsg = '';
    errorMsg = '';

    // For dropdown when solicitudId is not pre-loaded
    allRequests: any[] = [];
    selectedSolicitudId = '';

    readonly tipoOptions = [
        { value: 'Incidencia', label: '⚠️ Incidencia de Servicio' },
        { value: 'Queja', label: '😤 Queja' },
        { value: 'Reembolso', label: '💵 Solicitud de Reembolso' },
        { value: 'Ayuda', label: '🙋 Ayuda / Duda' },
        { value: 'Otro', label: '📋 Otro' },
    ];

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async ngOnInit() {
        if (!this.solicitudId && this.negocioId) {
            // Load all requests so admin can pick one
            const { data } = await this.supabase
                .from('solicitudes')
                .select('id, direccion_servicio, fecha_solicitada_cliente')
                .eq('negocio_id', this.negocioId)
                .order('created_at', { ascending: false })
                .limit(50);
            this.allRequests = data || [];
        }
    }

    getEffectiveSolicitudId(): string | null {
        return this.solicitudId || this.selectedSolicitudId || null;
    }

    canSubmit(): boolean {
        return !!this.tipo && this.descripcion.trim().length > 5;
    }

    async submit() {
        if (!this.canSubmit() || !this.negocioId) return;
        this.isSaving = true;
        this.errorMsg = '';
        this.successMsg = '';

        try {
            await firstValueFrom(this.http.post(`${environment.apiUrl}/incidents`, {
                negocio_id: this.negocioId,
                solicitud_id: this.getEffectiveSolicitudId(),
                tipo: this.tipo,
                asunto: this.asunto.trim() || this.tipo,
                descripcion: this.descripcion.trim()
            }));
            this.successMsg = '✅ Incidencia levantada correctamente.';
            setTimeout(() => this.closed.emit(true), 1200);
        } catch (e: any) {
            this.errorMsg = 'Error al guardar la incidencia. Intenta de nuevo.';
            console.error(e);
        } finally {
            this.isSaving = false;
        }
    }

    cancel() {
        this.closed.emit(false);
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    }
}
