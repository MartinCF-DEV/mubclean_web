import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cp-container">
      <header class="app-bar">
        <div class="header-left">
            <button class="back-btn" (click)="goBack()">
            <span class="material-icons">arrow_back</span>
            </button>
            <h1 class="app-bar-title">Restablecer Contraseña</h1>
        </div>
      </header>

      <div class="content">
        
        <div class="icon-container">
            <span class="material-icons icon-bg">lock_reset</span>
        </div>
        
        <h2 class="page-title">Ingresa tu nueva contraseña</h2>
        <p class="page-subtitle">Asegúrate de usar una contraseña segura.</p>

        <form (ngSubmit)="updatePassword()">
          
          <!-- New Password -->
          <div class="form-group">
            <div class="input-wrapper">
              <span class="material-icons prefix-icon">lock</span>
              <input [type]="showNewPass ? 'text' : 'password'" 
                     [(ngModel)]="newPassword" 
                     name="newPass" 
                     class="form-input" 
                     placeholder="Nueva Contraseña"
                     required minlength="6">
              <button type="button" class="visibility-btn" (click)="showNewPass = !showNewPass">
                <span class="material-icons">{{ showNewPass ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <div class="input-wrapper">
              <span class="material-icons prefix-icon">lock_outline</span>
              <input [type]="showConfirmPass ? 'text' : 'password'" 
                     [(ngModel)]="confirmPassword" 
                     name="confirmPass" 
                     class="form-input" 
                     placeholder="Confirmar Contraseña"
                     required minlength="6">
              <button type="button" class="visibility-btn" (click)="showConfirmPass = !showConfirmPass">
                <span class="material-icons">{{ showConfirmPass ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <div *ngIf="errorMsg" class="error-msg">{{ errorMsg }}</div>
          <div *ngIf="successMsg" class="success-msg">{{ successMsg }}</div>

          <div class="spacer-20"></div>

          <button type="submit" class="submit-btn" [disabled]="loading">
            <span *ngIf="!loading">ACTUALIZAR CONTRASEÑA</span>
            <div *ngIf="loading" class="spinner-sm"></div>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .cp-container { background: white; min-height: 100vh; font-family: 'Roboto', sans-serif; }
    
    .app-bar {
      padding: 16px; display: flex; align-items: center;
      background: white;
    }
    .header-left { display: flex; align-items: center; }
    .back-btn { background: none; border: none; cursor: pointer; padding: 0; margin-right: 20px; color: #333; display: flex; align-items: center; }
    .back-btn .material-icons { font-size: 24px; }
    .app-bar-title { margin: 0; font-size: 20px; font-weight: 500; color: #333; }

    .content { padding: 40px 24px; display: flex; flex-direction: column; align-items: center; }

    .icon-container { margin-bottom: 24px; margin-top: 40px; }
    /* Recreating the circular icon style from the image */
    .icon-bg {
        font-size: 80px;
        color: #2196F3;
    }
    
    .page-title { font-size: 18px; font-weight: 700; color: #212121; margin: 0 0 8px; text-align: center; }
    .page-subtitle { font-size: 14px; color: #757575; margin: 0 0 40px; text-align: center; }

    form { width: 100%; max-width: 400px; }

    .form-group { margin-bottom: 20px; }
    .input-wrapper {
      position: relative; display: flex; align-items: center;
      border: 1px solid #757575; border-radius: 4px;
      padding: 4px 12px; height: 50px;
      box-sizing: border-box;
    }
    .input-wrapper:focus-within { border-color: #2196F3; border-width: 2px; }

    .prefix-icon { color: #616161; font-size: 22px; margin-right: 12px; }
    
    .form-input {
      flex: 1; border: none; outline: none; background: transparent;
      padding: 0; font-size: 16px; color: #212121; height: 100%;
    }
    .form-input::placeholder { color: #757575; }

    .visibility-btn {
      background: none; border: none; cursor: pointer; padding: 4px;
      color: #616161; display: flex; align-items: center;
    }
    .visibility-btn .material-icons { font-size: 22px; }

    .submit-btn {
      width: 100%; padding: 14px; background: #2196F3; color: white;
      border: none; border-radius: 8px; font-weight: 700; font-size: 14px;
      cursor: pointer; display: flex; justify-content: center;
      text-transform: uppercase; letter-spacing: 0.5px;
      box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
    }
    .submit-btn:disabled { opacity: 0.7; box-shadow: none; }

    .error-msg { color: #D32F2F; margin-bottom: 15px; font-size: 14px; text-align: center; }
    .success-msg { color: #2E7D32; margin-bottom: 15px; font-size: 14px; text-align: center; }
    
    .spacer-20 { height: 20px; }
    .spinner-sm {
      border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white;
      border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class ChangePasswordComponent {
  newPassword = '';
  confirmPassword = '';
  showNewPass = false;
  showConfirmPass = false;

  loading = false;
  errorMsg = '';
  successMsg = '';

  private router = inject(Router);
  private supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  goBack() {
    this.router.navigate(['/customer/profile']);
  }

  async updatePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
    }
    if (this.newPassword.length < 6) {
      this.errorMsg = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    try {
      const { error } = await this.supabase.auth.updateUser({
        password: this.newPassword
      });

      if (error) throw error;

      this.successMsg = 'Contraseña actualizada correctamente.';
      this.newPassword = '';
      this.confirmPassword = '';

      setTimeout(() => this.goBack(), 1500);
    } catch (e: any) {
      this.errorMsg = e.message || 'Error al actualizar contraseña.';
    } finally {
      this.loading = false;
    }
  }
}
