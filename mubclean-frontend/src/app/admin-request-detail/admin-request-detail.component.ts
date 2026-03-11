import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from '../auth.service';
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
    private auth = inject(AuthService);
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

    // Incident sheet state
    showIncidentSheet = false;
    incidentAsunto = '';
    incidentDesc = '';
    incidentSaving = false;
    incidentError = '';

    constructor() {
        this.supabase = this.auth.client;
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
            console.log("SENDING TO SUPABASE ESTADO: 'cotizado'");
            const { data: reqData, error: reqError } = await this.supabase
                .from('solicitudes')
                .update({
                    precio_total: this.totalCalculated,
                    estado: 'cotizado'
                })
                .eq('id', this.requestId)
                .select();

            if (reqError) throw reqError;
            if (!reqData || reqData.length === 0) {
                throw new Error("Supabase rechazó la solicitud (posible restricción RLS de la Base de Datos).");
            }

            this.toast.success('Cotización enviada exitosamente.');
            await this.fetchDetails();

        } catch (e: any) {
            console.error("Error capturado:", e);
            this.toast.error(e.message || 'Error al enviar cotización.');
            this.isLoading = false;
        }
    }

    async confirmAppointment() {
        if (!this.selectedEmployeeId) {
            this.toast.warning('Selecciona un técnico.');
            return;
        }

        try {
            this.isLoading = true;
            this.cdr.detectChanges();

            await this.supabase
                .from('solicitudes')
                .update({
                    tecnico_asignado_id: this.selectedEmployeeId,
                    estado: 'agendado'
                })
                .eq('id', this.requestId);

            this.toast.success('Técnico asignado exitosamente.');
            this.router.navigate(['/admin/dashboard']);

        } catch (e) {
            console.error(e);
            this.toast.error('Error al asignar el técnico.');
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

    /** Shows the incident mini-modal (sheet) */
    reportIncident() {
        this.showIncidentSheet = true;
    }

    /** Saves incident directly to Supabase — avoids backend sleep issue */
    async submitIncident() {
        if (!this.incidentAsunto.trim() || this.incidentDesc.trim().length < 5) return;
        this.incidentSaving = true;
        this.incidentError = '';
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            const folio = this.request?.short_id || this.requestId?.slice(0, 8) || '';
            const { error } = await this.supabase.from('soporte_tickets').insert({
                cliente_id: user.id,           // required NOT NULL
                tipo: 'servicio',
                asunto: `[Servicio #${folio}] ${this.incidentAsunto.trim()}`,
                descripcion: this.incidentDesc.trim(),
                estado: 'abierto',
                solicitud_id: this.requestId
            });
            if (error) throw error;

            this.showIncidentSheet = false;
            this.incidentAsunto = '';
            this.incidentDesc = '';
            this.toast.success('Incidencia levantada correctamente.');
        } catch (e: any) {
            console.error('Incident error:', e);
            this.incidentError = e.message || 'Error al guardar. Intenta de nuevo.';
        } finally {
            this.incidentSaving = false;
            this.cdr.detectChanges();
        }
    }

    formatStatus(status: string): string {
        if (!status) return '';
        const formatted = status.replace(/_/g, ' ');
        return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
    }
}
