import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
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
            <label>Correo Electrónico *</label>
            <input type="email" [(ngModel)]="newEmail" placeholder="ejemplo@correo.com" [disabled]="isAdding">
          </div>

          <div class="form-group">
            <label>Nombre Completo *</label>
            <input type="text" [(ngModel)]="newName" placeholder="Nombre y Apellido" [disabled]="isAdding">
          </div>

          <div class="form-group">
            <label>Teléfono *</label>
            <input type="tel" [(ngModel)]="newPhone" placeholder="000 000 0000" [disabled]="isAdding" maxlength="10" (input)="restrictPhone($event)">
          </div>

          <p class="error-msg" *ngIf="addError">{{ addError }}</p>

          <div class="modal-actions">
            <button class="cancel-btn" (click)="closeDialog()" [disabled]="isAdding">Cancelar</button>
            <button class="confirm-btn" (click)="addEmployee()" [disabled]="isAdding || !newEmail || !newName || !newPhone">
              <span *ngIf="!isAdding">Agregar</span>
              <span *ngIf="isAdding">Buscando...</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-container { padding: 30px; font-family: 'Inter', sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    h1 { margin: 0; font-size: 32px; font-weight: 800; color: #0F172A; font-family: 'Fraunces', serif; }
    
    .add-btn {
      background: white; color: #0F172A; border: 2px solid #000; padding: 12px 24px;
      border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 8px;
      font-weight: 700; transition: all 0.2s; box-shadow: 4px 4px 0 #000;
      font-family: 'Inter', sans-serif;
    }
    .add-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #000; background: #F8FAFC; }
    .add-btn:active { transform: translate(0, 0); box-shadow: 2px 2px 0 #000; }

    .loading-container { display: flex; justify-content: center; padding: 50px; }
    .spinner { border: 4px solid #F1F5F9; border-radius: 50%; border-top: 4px solid #000; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .empty-state { text-align: center; color: #64748B; margin-top: 50px; }
    .empty-icon { font-size: 60px; color: #CBD5E1; margin-bottom: 20px; }

    .employee-list { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
    .employee-card {
      background: white; border-radius: 16px; padding: 24px;
      display: flex; align-items: center; gap: 20px;
      box-shadow: 6px 6px 0 #000; border: 2px solid #000;
      transition: all 0.2s;
    }
    .employee-card:hover { transform: translate(-2px, -2px); box-shadow: 8px 8px 0 #000; }
    .employee-card.inactive { opacity: 0.7; background: #F1F5F9; border-style: dashed; }
    
    .avatar {
      width: 56px; height: 56px; border-radius: 50%; background-color: #F1F5F9;
      color: #0F172A; display: flex; align-items: center; justify-content: center;
      font-weight: 800; background-size: cover; background-position: center;
      border: 2px solid #000; font-size: 18px;
    }
    
    .info { flex: 1; overflow: hidden; }
    .name { margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #0F172A; font-family: 'Fraunces', serif; }
    .email { margin: 0; font-size: 14px; color: #64748B; font-weight: 500; }

    .actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .status-label { font-size: 12px; font-weight: 700; color: #0F172A; text-transform: uppercase; }

    /* Switch with Neo Style */
    .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #CBD5E1; transition: .4s; border-radius: 20px; border: 2px solid #000; }
    .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; border: 1px solid #000; }
    input:checked + .slider { background-color: #22C55E; }
    input:checked + .slider:before { transform: translateX(20px); }

    /* Modal */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6); z-index: 2000;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
    }
    .modal { 
      background: white; padding: 32px; border-radius: 20px; 
      width: 90%; max-width: 450px; 
      box-shadow: 8px 8px 0 #000; border: 3px solid #000;
    }
    .modal h2 { margin-top: 0; font-family: 'Fraunces', serif; font-size: 24px; font-weight: 800; }
    .form-group { margin: 20px 0; display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-weight: 700; font-size: 14px; color: #0F172A; }
    .form-group input { 
      padding: 12px; border: 2px solid #000; border-radius: 12px; 
      font-size: 16px; font-family: 'Inter', sans-serif; outline: none; transition: box-shadow 0.2s;
    }
    .form-group input:focus { box-shadow: 4px 4px 0 #CBD5E1; }
    
    .error-msg { color: #EF4444; font-size: 13px; margin-top: -10px; margin-bottom: 20px; font-weight: 600; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 32px; }
    
    .cancel-btn, .confirm-btn { 
      padding: 12px 24px; border-radius: 12px; cursor: pointer; 
      font-weight: 700; font-family: 'Inter', sans-serif;
      border: 2px solid #000; box-shadow: 4px 4px 0 #000; transition: all 0.2s;
    }
    .cancel-btn:hover, .confirm-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #000; }
    .cancel-btn:active, .confirm-btn:active { transform: translate(0, 0); box-shadow: 2px 2px 0 #000; }
    
    .cancel-btn { background: white; color: #0F172A; }
    .confirm-btn { background: #1565C0; color: white; }
    .confirm-btn:disabled { background: #94A3B8; cursor: not-allowed; transform: none; box-shadow: 2px 2px 0 #000; }
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
  newName = '';
  newPhone = '';
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
      console.log('Employees fetched:', emps);
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

  getAvatarUrl(url: string | null): string | null {
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
    this.newName = '';
    this.newPhone = '';
    this.addError = null;
    this.isAdding = false;
  }

  async addEmployee() {
    if (!this.newEmail || !this.newName || !this.newPhone) {
      this.addError = 'Todos los campos son obligatorios.';
      return;
    }

    // Phone Validation (Exactly 10 digits)
    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(this.newPhone)) {
      this.addError = 'El teléfono debe tener exactamente 10 dígitos.';
      return;
    }

    // Email Validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(this.newEmail)) {
      this.addError = 'Por favor ingresa un correo válido.';
      return;
    }

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
        // 1. Employee Linked. Now Update Profile Info.
        try {
          // Get User ID by Email
          const { data: userData, error: userError } = await this.auth.client
            .from('perfiles')
            .select('id')
            .eq('email', email)
            .single();

          if (userData && !userError) {
            // Update Profile
            await this.auth.client
              .from('perfiles')
              .update({
                nombre_completo: this.newName,
                telefono: this.newPhone
              })
              .eq('id', userData.id);
          }
        } catch (updateErr) {
          console.warn('Could not update profile details (might lack permissions or user not found)', updateErr);
          // We continue anyway since the employee was linked
        }

        alert('¡Técnico agregado correctamente!');
        this.closeDialog();
        this.fetchEmployees();
      } else if (data === 'No existe') {
        // User does not exist, so we create it automatically
        await this.registerNewUser(email, this.newName, this.newPhone);
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
  restrictPhone(event: any) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.newPhone = input.value;
  }

  async registerNewUser(email: string, name: string, phone: string) {
    try {
      console.log('Creating user:', email, name);
      // 1. Create a TEMPORARY Supabase client with NO PERSISTENCE
      const tempClient = createClient(environment.supabaseUrl, environment.supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      // 2. Sign Up the new user
      const tempPassword = 'Mubclean' + Math.floor(1000 + Math.random() * 9000);

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: email,
        password: tempPassword,
        options: {
          data: {
            nombre_completo: name,
            full_name: name
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        console.log('User created:', authData.user.id);

        // 3. Upsert Profile
        // We remove 'rol' from update in case RLS blocks it. 
        // We use upsert to handle both insert (new) and update (existing from trigger)
        const { error: upsertError } = await tempClient
          .from('perfiles')
          .upsert({
            id: authData.user.id,
            email: email,
            nombre_completo: name,
            telefono: phone,
            // rol: 'trabajador' // Commented out to avoid RLS issues
            foto_url: null
          }, { onConflict: 'id' });

        if (upsertError) {
          console.error('Profile upsert FAILED:', upsertError);
        } else {
          console.log('Profile upsert success');
        }

        // 4. Link Access
        const { data, error } = await this.auth.client.rpc('contratar_empleado', {
          email_input: email,
          negocio_id_input: this.negocioId
        });

        if (error) throw error;

        if (data === 'Exito') {
          alert(`¡Usuario creado y agregado!\n\nContraseña temporal: ${tempPassword}\n\nPor favor compártela con el técnico.`);
          this.closeDialog();

          // Longer delay and log fetch
          setTimeout(() => this.fetchEmployees(), 2000);
        } else {
          this.addError = `Error al vincular tras crear usuario: ${data}`;
        }
      }

    } catch (e: any) {
      console.error('Error creating user:', e);
      this.addError = 'No se pudo crear el usuario automáticamente: ' + e.message;
    }
  }
}
