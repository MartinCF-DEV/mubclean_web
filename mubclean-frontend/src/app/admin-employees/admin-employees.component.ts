import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-admin-employees',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Mi Equipo</h1>
        <button class="add-btn" (click)="showAddDialog = true">
          <span class="material-icons">person_add</span>
          Nuevo
        </button>
      </header>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <div class="spinner"></div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && employees.length === 0" class="empty-state">
        <span class="material-icons empty-icon">group_off</span>
        <h3>No tienes empleados aún</h3>
        <p>Agrega técnicos para poder asignarles servicios.</p>
      </div>

      <!-- List -->
      <div *ngIf="!isLoading && employees.length > 0" class="employee-list">
        <div *ngFor="let emp of employees" class="employee-card" [class.inactive]="!emp.activo">
          <div class="avatar" [style.backgroundImage]="getAvatarUrl(emp.perfiles?.foto_url)">
            <span *ngIf="!emp.perfiles?.foto_url">{{ getInitials(emp.perfiles?.nombre_completo) }}</span>
          </div>
          
          <div class="info">
            <h3 class="name">{{ emp.perfiles?.nombre_completo || 'Usuario Desconocido' }}</h3>
            <p class="email">{{ emp.perfiles?.email }}</p>
          </div>

          <div class="actions">
            <label class="switch">
              <input type="checkbox" [checked]="emp.activo" (change)="toggleStatus(emp)">
              <span class="slider round"></span>
            </label>
            <span class="status-label">{{ emp.activo ? 'Activo' : 'Inactivo' }}</span>
          </div>
        </div>
      </div>

      <!-- Add Dialog -->
      <div class="modal-overlay" *ngIf="showAddDialog">
        <div class="modal">
          <h2>Agregar Técnico</h2>
          <p>Ingresa el correo del usuario registrado en la App.</p>
          
          <div class="form-group">
            <label>Correo Electrónico</label>
            <input type="email" [(ngModel)]="newEmail" placeholder="ejemplo@correo.com" [disabled]="isAdding">
          </div>

          <p class="error-msg" *ngIf="addError">{{ addError }}</p>

          <div class="modal-actions">
            <button class="cancel-btn" (click)="closeDialog()" [disabled]="isAdding">Cancelar</button>
            <button class="confirm-btn" (click)="addEmployee()" [disabled]="isAdding || !newEmail">
              <span *ngIf="!isAdding">Agregar</span>
              <span *ngIf="isAdding">Buscando...</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
    styles: [`
    .page-container { padding: 30px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    h1 { margin: 0; font-size: 24px; color: #333; }
    
    .add-btn {
      background: #1565C0; color: white; border: none; padding: 10px 20px;
      border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px;
      font-weight: 600; transition: background 0.2s;
    }
    .add-btn:hover { background: #0D47A1; }

    .loading-container { display: flex; justify-content: center; padding: 50px; }
    .spinner { border: 3px solid rgba(21, 101, 192, 0.1); border-radius: 50%; border-top: 3px solid #1565C0; width: 30px; height: 30px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .empty-state { text-align: center; color: #888; margin-top: 50px; }
    .empty-icon { font-size: 60px; color: #DDD; margin-bottom: 20px; }

    .employee-list { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .employee-card {
      background: white; border-radius: 12px; padding: 20px;
      display: flex; align-items: center; gap: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #EEE;
    }
    .employee-card.inactive { opacity: 0.7; background: #FAFAFA; }
    
    .avatar {
      width: 50px; height: 50px; border-radius: 50%; background-color: #E3F2FD;
      color: #1565C0; display: flex; align-items: center; justify-content: center;
      font-weight: bold; background-size: cover; background-position: center;
    }
    
    .info { flex: 1; overflow: hidden; }
    .name { margin: 0 0 4px; font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .email { margin: 0; font-size: 13px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .actions { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
    .status-label { font-size: 11px; font-weight: 600; color: #666; }

    /* Switch */
    .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 20px; }
    .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #4CAF50; }
    input:checked + .slider:before { transform: translateX(20px); }

    /* Modal */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 2000;
      display: flex; align-items: center; justify-content: center;
    }
    .modal { background: white; padding: 30px; border-radius: 16px; width: 100%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .modal h2 { margin-top: 0; }
    .form-group { margin: 20px 0; display: flex; flex-direction: column; gap: 8px; }
    .form-group input { padding: 10px; border: 1px solid #CCC; border-radius: 8px; font-size: 16px; }
    .error-msg { color: #D32F2F; font-size: 13px; margin-top: -10px; margin-bottom: 20px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .cancel-btn, .confirm-btn { padding: 10px 20px; border-radius: 8px; cursor: pointer; border: none; font-weight: 600; }
    .cancel-btn { background: #F5F5F5; color: #333; }
    .confirm-btn { background: #1565C0; color: white; }
    .confirm-btn:disabled { background: #B0BEC5; cursor: not-allowed; }
  `]
})
export class AdminEmployeesComponent implements OnInit {
    auth = inject(AuthService);
    cdr = inject(ChangeDetectorRef);

    isLoading = true;
    employees: any[] = [];
    negocioId: string | null = null;

    // Add Dialog
    showAddDialog = false;
    newEmail = '';
    isAdding = false;
    addError: string | null = null;

    ngOnInit() {
        this.fetchEmployees();
    }

    async fetchEmployees() {
        this.isLoading = true;
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            // 1. Get Negocio ID
            const { data: negocio } = await this.auth.client
                .from('negocios')
                .select('id')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (!negocio) {
                this.isLoading = false;
                return;
            }
            this.negocioId = negocio.id;

            // 2. Get Employees
            const { data: emps, error } = await this.auth.client
                .from('empleados_negocio')
                .select('*, perfiles(email, nombre_completo, foto_url)')
                .eq('negocio_id', this.negocioId);

            if (error) throw error;
            this.employees = emps || [];

        } catch (e) {
            console.error('Error fetching employees:', e);
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    getInitials(name: string): string {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    }

    getAvatarUrl(url: string): string | null {
        if (!url) return null;
        return `url('${url}')`;
    }

    async toggleStatus(emp: any) {
        const newVal = !emp.activo;
        // Optimistic update
        emp.activo = newVal;

        try {
            const { error } = await this.auth.client
                .from('empleados_negocio')
                .update({ activo: newVal })
                .eq('id', emp.id);

            if (error) {
                emp.activo = !newVal; // Revert
                throw error;
            }
        } catch (e) {
            console.error('Error toggling status:', e);
            alert('Error al actualizar estado');
        }
    }

    closeDialog() {
        this.showAddDialog = false;
        this.newEmail = '';
        this.addError = null;
        this.isAdding = false;
    }

    async addEmployee() {
        if (!this.newEmail) return;
        this.isAdding = true;
        this.addError = null;

        try {
            const email = this.newEmail.trim().toLowerCase();

            const { data, error } = await this.auth.client.rpc('contratar_empleado', {
                email_input: email,
                negocio_id_input: this.negocioId
            });

            if (error) throw error;

            if (data === 'Exito') {
                alert('¡Técnico agregado correctamente!');
                this.closeDialog();
                this.fetchEmployees();
            } else if (data === 'No existe') {
                this.addError = 'El usuario no se ha registrado en la App.';
            } else if (data === 'Ya registrado') {
                this.addError = 'Este usuario ya está en tu equipo.';
            } else {
                this.addError = `Error: ${data}`;
            }

        } catch (e: any) {
            console.error('Error adding employee:', e);
            this.addError = e.message || 'Error de conexión';
        } finally {
            this.isAdding = false;
            this.cdr.detectChanges();
        }
    }
}
