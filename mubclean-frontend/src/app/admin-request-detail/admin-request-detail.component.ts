import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { ToastService } from '../toast.service';

@Component({
    selector: 'app-admin-request-detail',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-request-detail.component.html',
    styleUrls: ['./admin-request-detail.component.css']
})
export class AdminRequestDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private toast = inject(ToastService);
    private supabase: SupabaseClient;

    requestId: string | null = null;
    isLoading = true;
    request: any = null;
    items: any[] = [];
    employees: any[] = [];

    // Quote State
    totalCalculated = 0;

    // Appointment State
    selectedEmployeeId = '';
    scheduleDate = '';
    scheduleTime = '09:00';

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async ngOnInit() {
        this.requestId = this.route.snapshot.paramMap.get('id');
        if (this.requestId) {
            await this.fetchDetails();
        }
    }

    async fetchDetails() {
        this.isLoading = true;
        this.cdr.detectChanges(); // Update UI to show loading
        console.log("RequestDetail: Fetching for ID", this.requestId);
        try {
            // 1. Fetch Request
            console.log("RequestDetail: Querying solicitud...");
            const { data: reqData, error: reqError } = await this.supabase
                .from('solicitudes')
                .select('*')
                .eq('id', this.requestId)
                .single();

            console.log("RequestDetail: Solicitud result", { reqData, reqError });

            if (reqError) throw reqError;

            // Map keys (Flutter logic)
            this.request = {
                ...reqData,
                direccion: reqData['direccion_servicio'] || reqData['direccion'] || 'Sin dirección',
                fecha_solicitada: reqData['fecha_solicitada_cliente'] || reqData['fecha_solicitada']
            };

            // 2. Fetch Items
            console.log("RequestDetail: Querying items...");
            const { data: itemsData, error: itemsError } = await this.supabase
                .from('items_solicitud')
                .select('*, servicios_catalogo(nombre), fotos_solicitud(foto_url)')
                .eq('solicitud_id', this.requestId);

            console.log("RequestDetail: Items result", { itemsData, itemsError });

            if (itemsError) throw itemsError;

            this.items = (itemsData || []).map((item: any) => ({
                ...item,
                precio_unitario: item.precio_unitario || 0
            }));

            // 3. Fetch Employees if Accepted
            if (this.request.estado === 'aceptada' && this.request.negocio_id) {
                console.log("RequestDetail: Querying employees...");
                const { data: emps, error: empsError } = await this.supabase
                    .from('empleados_negocio')
                    .select('id, perfiles(nombre_completo)')
                    .eq('negocio_id', this.request.negocio_id)
                    .eq('activo', true);

                console.log("RequestDetail: Employees result", { emps, empsError });

                if (!empsError) {
                    this.employees = emps || [];
                }
            }

            this.calculateTotal();

        } catch (e) {
            console.error("Error loading details", e);
            this.toast.error('Error al cargar detalles del pedido.');
        } finally {
            console.log("RequestDetail: Finished loading.");
            this.isLoading = false;
            this.cdr.detectChanges(); // Force UI update
        }
    }

    calculateTotal() {
        this.totalCalculated = this.items.reduce((sum, item) => sum + (Number(item.precio_unitario) || 0), 0);
    }

    async sendQuote() {
        if (this.totalCalculated <= 0) {
            this.toast.warning('El total debe ser mayor a 0.');
            return;
        }

        try {
            this.isLoading = true;
            this.cdr.detectChanges();

            // Update items prices
            for (const item of this.items) {
                await this.supabase
                    .from('items_solicitud')
                    .update({ precio_unitario: item.precio_unitario })
                    .eq('id', item.id);
            }

            // Update request total and status
            await this.supabase
                .from('solicitudes')
                .update({
                    precio_total: this.totalCalculated,
                    estado: 'cotizada'
                })
                .eq('id', this.requestId);

            this.toast.success('Cotización enviada exitosamente.');
            await this.fetchDetails();

        } catch (e) {
            console.error(e);
            this.toast.error('Error al enviar cotización.');
            this.isLoading = false;
        }
    }

    async confirmAppointment() {
        if (!this.selectedEmployeeId || !this.scheduleDate || !this.scheduleTime) {
            this.toast.warning('Completa todos los campos de la cita.');
            return;
        }

        try {
            this.isLoading = true;
            this.cdr.detectChanges();

            await this.supabase
                .from('solicitudes')
                .update({
                    tecnico_asignado_id: this.selectedEmployeeId,
                    fecha_agendada_final: this.scheduleDate,
                    hora_agendada_final: this.scheduleTime + ':00',
                    estado: 'agendada'
                })
                .eq('id', this.requestId);

            this.toast.success('Cita confirmada.');
            this.router.navigate(['/admin/dashboard']);

        } catch (e) {
            console.error(e);
            this.toast.error('Error al agendar la cita.');
            this.isLoading = false;
        }
    }

    goBack() {
        this.router.navigate(['/admin/dashboard']);
    }

    /** Solo se puede reportar si el servicio ya inició o se completó */
    canReportIncident(): boolean {
        const reportableStates = ['en_proceso', 'completada'];
        return reportableStates.includes(this.request?.estado);
    }

    /** Navega a Reportes con folio pre-cargado (sin modalception) */
    reportIncident() {
        const folio = this.request?.short_id || this.requestId?.slice(0, 8) || '';
        this.router.navigate(['/admin/incidents'], {
            queryParams: { solicitudId: this.requestId, folio }
        });
    }

    formatStatus(status: string): string {
        if (!status) return '';
        const formatted = status.replace(/_/g, ' ');
        return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
    }
}
