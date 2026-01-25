import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="reset-wrapper">
      <div class="reset-content">
        <!-- Logo Section -->
        <div class="logo-container">
          <img src="logo.png" alt="MubClean Logo" class="logo-image">
        </div>
        
        <h1 class="app-title">Restablecer Contraseña</h1>
        <p class="app-subtitle">Ingresa tu nueva contraseña</p>

        <div class="spacer-50"></div>

        <!-- Form Section -->
        <div class="input-group">
          <span class="material-icons input-icon">lock_outline</span>
          <input 
            [type]="obscurePass ? 'password' : 'text'" 
            [(ngModel)]="newPassword" 
            placeholder="Nueva Contraseña"
            [disabled]="isLoading"
          />
          <button class="icon-button" (click)="obscurePass = !obscurePass">
            <span class="material-icons">{{ obscurePass ? 'visibility_off' : 'visibility' }}</span>
          </button>
        </div>

        <div class="spacer-20"></div>

        <div class="input-group">
          <span class="material-icons input-icon">lock</span>
          <input 
            [type]="obscureConfirm ? 'password' : 'text'" 
            [(ngModel)]="confirmPassword" 
            placeholder="Confirmar Contraseña"
            (keydown.enter)="resetPassword()"
            [disabled]="isLoading"
          />
          <button class="icon-button" (click)="obscureConfirm = !obscureConfirm">
            <span class="material-icons">{{ obscureConfirm ? 'visibility_off' : 'visibility' }}</span>
          </button>
        </div>

        <div class="spacer-30"></div>

        <button class="primary-button" (click)="resetPassword()" [disabled]="isLoading">
          <span *ngIf="!isLoading">RESTABLECER CONTRASEÑA</span>
          <div *ngIf="isLoading" class="spinner"></div>
        </button>

        <p *ngIf="error" class="error-msg">{{ error }}</p>
        <p *ngIf="successMsg" class="success-msg">{{ successMsg }}</p>

        <div class="spacer-30"></div>

        <div class="register-footer">
          <a routerLink="/login" class="register-link">Volver al inicio de sesión</a>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .reset-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: white;
      padding: 30px;
    }

    .reset-content {
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }

    .logo-container {
      align-self: center;
      width: 100px;
      height: 100px;
      background-color: rgba(21, 101, 192, 0.1);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px;
    }

    .logo-image {
      width: 70px;
      height: 70px;
      object-fit: contain;
    }

    .app-title {
      text-align: center;
      font-size: 28px;
      font-weight: 700;
      color: var(--primary-blue);
      letter-spacing: -1px;
      margin: 0;
    }

    .app-subtitle {
      text-align: center;
      color: var(--text-grey);
      font-size: 16px;
      margin: 5px 0 0 0;
    }

    .spacer-50 { height: 50px; }
    .spacer-30 { height: 30px; }
    .spacer-20 { height: 20px; }

    .input-group {
      display: flex;
      align-items: center;
      background-color: var(--input-fill);
      border: 1px solid var(--input-border);
      border-radius: 12px;
      padding: 0 12px;
      height: 56px;
      transition: border-color 0.2s;
    }

    .input-group:focus-within {
      border-color: var(--primary-blue);
      border-width: 2px;
    }

    .input-icon {
      color: var(--text-grey);
      margin-right: 10px;
    }

    .input-group input {
      border: none;
      background: transparent;
      flex: 1;
      height: 100%;
      font-size: 16px;
      outline: none;
      color: var(--text-color);
    }

    .icon-button {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-grey);
      display: flex;
      align-items: center;
      padding: 8px;
    }

    .primary-button {
      height: 55px;
      background-color: var(--primary-blue);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 6px var(--shadow-color);
      transition: background-color 0.2s, transform 0.1s;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .primary-button:hover:not(:disabled) {
      background-color: #0D47A1;
    }

    .primary-button:active:not(:disabled) {
      transform: translateY(1px);
    }

    .primary-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 3px solid white;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .register-footer {
      display: flex;
      justify-content: center;
      gap: 5px;
    }

    .register-link {
      color: var(--primary-blue);
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }

    .register-link:hover {
      text-decoration: underline;
    }

    .error-msg { color: #d32f2f; text-align: center; margin-top: 10px; }
    .success-msg { color: #388e3c; text-align: center; margin-top: 10px; }
  `]
})
export class ResetPasswordComponent implements OnInit {
    newPassword = '';
    confirmPassword = '';
    obscurePass = true;
    obscureConfirm = true;
    isLoading = false;
    error = '';
    successMsg = '';

    constructor(
        private auth: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        // Check if we have a valid session (user clicked email link)
        this.auth.checkSession();
    }

    async resetPassword() {
        this.error = '';
        this.successMsg = '';

        if (!this.newPassword || !this.confirmPassword) {
            this.error = 'Por favor completa ambos campos';
            return;
        }

        if (this.newPassword.length < 6) {
            this.error = 'La contraseña debe tener al menos 6 caracteres';
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.error = 'Las contraseñas no coinciden';
            return;
        }

        this.isLoading = true;

        try {
            const { error } = await this.auth.client.auth.updateUser({
                password: this.newPassword
            });

            if (error) throw error;

            this.successMsg = '¡Contraseña actualizada exitosamente!';

            // Redirect to login after 2 seconds
            setTimeout(() => {
                this.router.navigate(['/login']);
            }, 2000);
        } catch (e: any) {
            this.error = e.message || 'Error al actualizar contraseña';
        } finally {
            this.isLoading = false;
        }
    }
}
