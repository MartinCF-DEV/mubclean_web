import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-admin-services',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-services.component.html',
    styleUrls: ['./admin-services.component.css']
})
export class AdminServicesComponent implements OnInit {
    auth = inject(AuthService);
    cdr = inject(ChangeDetectorRef);

    isLoading = true;
    services: any[] = [];
    negocioId: string | null = null;

    // Dialog State
    showDialog = false;
    isProcessing = false;
    editingService: any = null;

    // Form Fields
    formNombre = '';
    formDesc = '';
    formTipo = '';
    formNotas = '';
    formActive = true;

    // Image Handling
    formImageUrl: string | null = null;
    newImageFile: File | null = null;
    imagePreview: string | null = null;

    ngOnInit() {
        this.fetchServices();
    }

    async fetchServices() {
        this.isLoading = true;
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            // 1. Get Negocio ID if not cached
            if (!this.negocioId) {
                const { data: neg } = await this.auth.client
                    .from('negocios')
                    .select('id')
                    .eq('owner_id', user.id)
                    .maybeSingle();

                if (neg) this.negocioId = neg.id;
                else {
                    this.isLoading = false;
                    return;
                }
            }

            // 2. Fetch Services
            const { data, error } = await this.auth.client
                .from('servicios_catalogo')
                .select('*')
                .eq('negocio_id', this.negocioId)
                .order('nombre');

            if (error) throw error;
            this.services = data || [];

        } catch (e) {
            console.error('Error loading services:', e);
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    openDialog(service?: any) {
        this.editingService = service || null;

        if (service) {
            // Edit Mode
            this.formNombre = service.nombre;
            this.formDesc = service.descripcion || '';
            this.formTipo = service.tipo_servicio || '';
            this.formNotas = service.notas || '';
            this.formActive = service.activo;
            this.formImageUrl = service.imagen_url;
            this.imagePreview = service.imagen_url;
        } else {
            // Create Mode
            this.formNombre = '';
            this.formDesc = '';
            this.formTipo = '';
            this.formNotas = '';
            this.formActive = true;
            this.formImageUrl = null;
            this.imagePreview = null;
        }

        this.newImageFile = null;
        this.showDialog = true;
    }

    closeDialog() {
        this.showDialog = false;
        this.editingService = null;
        this.newImageFile = null;
        this.imagePreview = null;
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.newImageFile = file;
            // Create local preview
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreview = e.target.result;
                this.cdr.detectChanges();
            };
            reader.readAsDataURL(file);
        }
    }

    async saveService() {
        if (!this.formNombre || !this.negocioId) return;
        this.isProcessing = true;

        try {
            let finalImageUrl = this.formImageUrl;

            // 1. Upload Image if new
            if (this.newImageFile) {
                const fileExt = this.newImageFile.name.split('.').pop();
                const fileName = `servicios/${this.negocioId}_${Date.now()}.${fileExt}`;
                const bucket = 'muebles';

                const { error: uploadError } = await this.auth.client.storage
                    .from(bucket)
                    .upload(fileName, this.newImageFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = this.auth.client.storage
                    .from(bucket)
                    .getPublicUrl(fileName);

                finalImageUrl = publicUrl;
            }

            // 2. Insert/Update
            const payload: any = {
                negocio_id: this.negocioId,
                nombre: this.formNombre,
                descripcion: this.formDesc,
                tipo_servicio: this.formTipo || null,
                notas: this.formNotas || null,
                imagen_url: finalImageUrl,
                activo: this.formActive // Update active status too if editing? usually controlled by toggle, but good to have sync
            };

            if (this.editingService) {
                // Update
                const { error } = await this.auth.client
                    .from('servicios_catalogo')
                    .update(payload)
                    .eq('id', this.editingService.id);
                if (error) throw error;
            } else {
                // Create
                payload.activo = true; // Default active
                const { error } = await this.auth.client
                    .from('servicios_catalogo')
                    .insert(payload);
                if (error) throw error;
            }

            this.closeDialog();
            this.fetchServices();
            alert('Servicio guardado exitosamente');

        } catch (e: any) {
            console.error(e);
            alert('Error: ' + e.message);
        } finally {
            this.isProcessing = false;
            this.cdr.detectChanges();
        }
    }

    async deleteService() {
        if (!this.editingService) return;
        if (!confirm('¿Estás seguro de eliminar este servicio? Si tiene historial, considera solo desactivarlo.')) return;

        this.isProcessing = true;
        try {
            const { error } = await this.auth.client
                .from('servicios_catalogo')
                .delete()
                .eq('id', this.editingService.id);

            if (error) throw error;

            this.closeDialog();
            this.fetchServices();
            alert('Servicio eliminado');
        } catch (e: any) {
            console.error(e);
            alert('Error eliminar: ' + e.message);
        } finally {
            this.isProcessing = false;
            this.cdr.detectChanges();
        }
    }

    async toggleActive(service: any) {
        const newVal = !service.activo;
        service.activo = newVal; // Optimistic

        try {
            const { error } = await this.auth.client
                .from('servicios_catalogo')
                .update({ activo: newVal })
                .eq('id', service.id);

            if (error) {
                service.activo = !newVal; // Revert
                throw error;
            }
        } catch (e) {
            console.error(e);
            alert('Error al actualizar estado');
        }
    }
}
