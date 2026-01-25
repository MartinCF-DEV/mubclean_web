import { Component, inject, effect, signal, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="loading" class="loading-container">
       <div class="spinner"></div>
    </div>

    <div class="profile-container" *ngIf="!loading && auth.userProfile() as profile">
      <header class="app-bar">
        <h1>Mi Perfil</h1>
      </header>

      <div class="content">
        <!-- Avatar Section -->
        <div class="avatar-section">
          <div class="avatar-wrapper">
             <div *ngIf="profile.foto_url; else defaultAvatar" class="avatar-container">
                <img [src]="profile.foto_url" (error)="profile.foto_url = null" alt="Profile">
             </div>
             <ng-template #defaultAvatar>
                <div class="default-avatar">
                   <span class="material-icons">person</span>
                </div>
             </ng-template>
            <button class="edit-avatar-btn" (click)="triggerFileInput()">
              <span class="material-icons">camera_alt</span>
            </button>
            <input type="file" id="fileInput" (change)="onFileSelected($event)" accept="image/*" style="display: none;">
          </div>
          <h2 class="user-name">{{ profile.nombre_completo }}</h2>
          <p class="user-email">{{ profile.email }}</p>
        </div>

        <div class="spacer-30"></div>

        <!-- Phone Section -->
        <div class="info-card">
          <div class="card-row">
            <span class="material-icons card-icon blue">phone</span>
            <div class="card-content">
              <span class="label">Teléfono</span>
              <span class="value">{{ profile.telefono || 'Sin registrar' }}</span>
            </div>
            <button class="edit-btn" (click)="editingPhone = true">
              <span class="material-icons">edit</span>
            </button>
          </div>
        </div>

        <div class="spacer-30"></div>

        <!-- Actions -->
        <div class="action-list">
          <button class="action-item" (click)="goToChangePassword()">
            <span class="material-icons left-icon blue">lock_reset</span>
            <span class="action-label">Cambiar Contraseña</span>
            <span class="material-icons right-icon">arrow_forward_ios</span>
          </button>
          
          <div class="divider"></div>

          <button class="action-item" (click)="logout()">
            <span class="material-icons left-icon orange">logout</span>
            <span class="action-label">Cerrar Sesión</span>
          </button>

          <div class="divider"></div>

          <button class="action-item" (click)="deleteAccount()">
            <span class="material-icons left-icon red">delete_forever</span>
            <span class="action-label red-text">Eliminar Cuenta</span>
          </button>
        </div>
      </div>

      <!-- Edit Phone Modal -->
      <div class="modal-overlay" *ngIf="editingPhone">
        <div class="modal">
          <h3>Actualizar Teléfono</h3>
          <input type="tel" [(ngModel)]="newPhone" placeholder="Nuevo número" class="modal-input">
          <div class="modal-actions">
            <button (click)="editingPhone = false" class="cancel-btn">Cancelar</button>
            <button (click)="savePhone()" class="save-btn">Guardar</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .profile-container {
      background-color: white;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .app-bar {
      padding: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .app-bar h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #333;
    }

    .content { padding: 20px; flex: 1; }

    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .avatar-wrapper {
      position: relative;
      margin-bottom: 15px;
      width: 100px;
      height: 100px;
    }

    .avatar-container, .default-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 4px solid #E3F2FD;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #EEE;
    }

    .avatar-container img {
      width: 100%; height: 100%; object-fit: cover;
    }

    .default-avatar .material-icons {
      font-size: 60px; color: #BDBDBD;
    }

    .edit-avatar-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      background: #1565C0;
      color: white;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
    }
    .edit-avatar-btn .material-icons { font-size: 18px; }

    .user-name { font-size: 20px; font-weight: 700; margin: 0 0 5px; color: #333; text-align: center; }
    .user-email { font-size: 14px; color: #666; margin: 0; text-align: center; }

    .spacer-30 { height: 30px; }

    /* Info Card */
    .info-card {
      background: #FAFAFA;
      border: 1px solid #EEE;
      border-radius: 12px;
      padding: 15px;
    }
    .card-row { display: flex; align-items: center; }
    .card-icon { margin-right: 15px; }
    .card-icon.blue { color: #1565C0; }
    .card-content { flex: 1; display: flex; flex-direction: column; }
    .label { font-size: 12px; color: #999; margin-bottom: 2px; }
    .value { font-size: 16px; font-weight: 500; color: #333; }
    .edit-btn { background: none; border: none; color: #1565C0; cursor: pointer; }

    /* Action List */
    .action-list { display: flex; flex-direction: column; }
    .action-item {
      display: flex; align-items: center; width: 100%;
      padding: 16px 0; background: none; border: none;
      cursor: pointer; text-align: left;
    }
    .action-item:hover { background-color: #FAFAFA; }
    
    .left-icon { margin-right: 15px; font-size: 24px; }
    .left-icon.blue { color: #1565C0; }
    .left-icon.orange { color: #F57C00; }
    .left-icon.red { color: #D32F2F; }
    
    .action-label { flex: 1; font-size: 16px; font-weight: 500; color: #333; }
    .red-text { color: #D32F2F; }
    
    .right-icon { font-size: 16px; color: #CCC; }
    
    .divider { height: 1px; background: #EEE; width: 100%; }

    /* Modal */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); z-index: 100;
      display: flex; justify-content: center; align-items: center;
    }
    .modal {
      background: white; border-radius: 12px; padding: 20px;
      width: 90%; max-width: 320px;
    }
    .modal h3 { margin: 0 0 15px; font-size: 18px; }
    .modal-input {
      width: 100%; padding: 10px; border: 1px solid #DDD;
      border-radius: 8px; margin-bottom: 20px; font-size: 16px;
      box-sizing: border-box;
    }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .cancel-btn, .save-btn {
      padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; border: none;
    }
    .cancel-btn { background: #EEE; color: #333; }
    .save-btn { background: #1565C0; color: white; }

    .loading-container { display: flex; justify-content: center; padding: 50px; }
    .spinner {
      border: 3px solid rgba(21, 101, 192, 0.1); border-radius: 50%;
      border-top: 3px solid #1565C0; width: 30px; height: 30px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class CustomerProfileComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  editingPhone = false;
  newPhone = '';
  loading = true;

  constructor() {
    effect(() => {
      const user = this.auth.user();
      const profile = this.auth.userProfile();

      if (profile) {
        this.newPhone = profile.telefono || '';
        this.loading = false;
      } else if (user) {
        // User exists but profile not yet loaded, show loading
        this.loading = true;
        // Optionally trigger load if missing (redundant if AuthService does it, but safe)
        if (!this.auth.userProfile()) {
          // We rely on AuthService to trigger load on session change, 
          // but if it failed or hasn't started, we could trigger it.
          // However, best to let the reactive flow handle it.
        }
      } else {
        // No user (fetching session or logged out)
        // Keep loading true until auth resolves via signal
        this.loading = true;
      }
      this.cdr.detectChanges(); // Force update
    });

    // Removed setTimeout as it is unreliable and handled by signals/effects
  }

  ngOnInit() {
    // Immediate fetch to catch any missed initial loads
    if (this.auth.currentUser) {
      this.auth.loadUserProfile();
    }
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  refreshInterval: any;

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      const user = this.auth.currentUser;
      if (user) {
        this.auth.loadUserProfile();
      }
    }, 3000);
  }

  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.loading = true;
      try {
        await this.auth.uploadProfileImage(file);
        alert("Foto actualizada correctamente");
      } catch (e: any) {
        console.error(e);
        alert("Error al subir imagen: " + e.message);
      } finally {
        this.loading = false;
      }
    }
  }

  async savePhone() {
    try {
      await this.auth.updatePhone(this.newPhone);
      this.editingPhone = false;
    } catch (e) {
      alert("Error al actualizar teléfono");
    }
  }

  goToChangePassword() {
    this.router.navigate(['/change-password']);
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }

  deleteAccount() {
    if (confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      // In a real app we would call auth.deleteAccount() but user is aware of limitation
      alert("Funcionalidad de eliminación pendiente de backend.");
    }
  }
}
