import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="register-wrapper">
      <!-- Navbar-like header -->
      <div class="app-bar">
        <button class="icon-button" routerLink="/login">
          <span class="material-icons">arrow_back</span>
        </button>
        <span class="app-bar-title">Crear Cuenta</span>
      </div>

      <div class="register-content">
        <h2 class="title">Únete a MubClean</h2>
        <p class="subtitle">Completa tus datos para comenzar</p>

        <div class="spacer-30"></div>

        <!-- Name & Last Name Row -->
        <div class="row">
          <div class="input-container flex-1">
            <label>Nombre(s)</label>
            <div class="input-box">
               <input type="text" [(ngModel)]="name" />
            </div>
          </div>
          <div class="spacer-10"></div>
          <div class="input-container flex-1">
            <label>Apellido(s)</label>
            <div class="input-box">
               <input type="text" [(ngModel)]="lastName" />
            </div>
          </div>
        </div>

        <div class="spacer-15"></div>

        <!-- Phone -->
        <div class="input-container">
          <label>Teléfono Móvil</label>
          <div class="input-box">
             <span class="material-icons input-icon">phone</span>
             <input type="tel" [(ngModel)]="phone" maxlength="10" />
          </div>
        </div>

        <div class="spacer-15"></div>

        <!-- Email -->
        <div class="input-container">
          <label>Correo Electrónico</label>
          <div class="input-box">
             <span class="material-icons input-icon">email</span>
             <input type="email" [(ngModel)]="email" />
          </div>
        </div>

        <div class="spacer-15"></div>

        <!-- Password -->
        <div class="input-container">
          <label>Contraseña</label>
          <div class="input-box">
             <span class="material-icons input-icon">lock</span>
             <input [type]="obscurePass ? 'password' : 'text'" [(ngModel)]="password" />
             <button class="icon-button-small" (click)="obscurePass = !obscurePass">
                <span class="material-icons">{{ obscurePass ? 'visibility_off' : 'visibility' }}</span>
             </button>
          </div>
        </div>

        <div class="spacer-15"></div>

        <!-- Confirm Password -->
        <div class="input-container">
          <label>Confirmar Contraseña</label>
          <div class="input-box">
             <span class="material-icons input-icon">lock_outline</span>
             <input [type]="obscureConfirm ? 'password' : 'text'" [(ngModel)]="confirmPassword" />
             <button class="icon-button-small" (click)="obscureConfirm = !obscureConfirm">
                <span class="material-icons">{{ obscureConfirm ? 'visibility_off' : 'visibility' }}</span>
             </button>
          </div>
        </div>

        <div class="spacer-30"></div>

        <button class="primary-button" (click)="register()" [disabled]="isLoading">
           <span *ngIf="!isLoading">CREAR CUENTA</span>
           <div *ngIf="isLoading" class="spinner"></div>
        </button>

        <p *ngIf="error" class="error-msg">{{ error }}</p>

      </div>
    </div>
  `,
  styles: [`
    .register-wrapper {
      min-height: 100vh;
      background-color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .app-bar {
      width: 100%;
      height: 56px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      background: white;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .app-bar-title {
      font-size: 20px;
      font-weight: 500;
      margin-left: 20px;
    }

    .icon-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
    }

    .register-content {
      width: 100%;
      max-width: 500px;
      padding: 20px;
    }

    .title {
      font-size: 24px;
      font-weight: 700;
      color: #1976D2; /* Blue 700/800 approximate */
      margin: 0;
      text-align: center;
    }

    .subtitle {
      text-align: center;
      color: var(--text-grey);
      margin: 10px 0 0 0;
    }

    /* Spacers */
    .spacer-30 { height: 30px; }
    .spacer-15 { height: 15px; }
    .spacer-10 { height: 10px; }

    /* Layout */
    .row { display: flex; }
    .flex-1 { flex: 1; }

    /* Input Styling specific to Register (Outline style) */
    .input-container {
      display: flex;
      flex-direction: column;
    }

    .input-container label {
      font-size: 12px;
      color: var(--text-grey);
      margin-bottom: 4px;
      margin-left: 4px; /* Slight offset */
    }

    .input-box {
      display: flex;
      align-items: center;
      border: 1px solid #757575; /* Grey similar to OutlineInputBorder default */
      border-radius: 4px;
      height: 55px;
      padding: 0 12px;
    }

    .input-box:focus-within {
      border-color: var(--primary-blue);
      border-width: 2px;
    }

    .input-box input {
      border: none;
      background: transparent;
      flex: 1;
      height: 100%;
      font-size: 16px;
      outline: none;
      margin-left: 8px;
    }
    
    .input-icon {
      color: #757575;
    }

    .icon-button-small {
      background: none;
      border: none;
      cursor: pointer;
      color: #757575;
      display: flex;
    }

    /* Primary Button Reuse */
    .primary-button {
      width: 100%;
      height: 50px;
      background-color: #1565C0; /* Blue 800 */
      color: white;
      border: none;
      border-radius: 4px; /* Register screen uses flatter buttons in flutter default */
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 2px rgba(0,0,0,0.2);
    }

    .primary-button:hover:not(:disabled) {
      background-color: #0D47A1;
    }

    .error-msg { color: #d32f2f; text-align: center; margin-top: 15px; }
    
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 3px solid white;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class RegisterComponent {
  name = '';
  lastName = '';
  phone = '';
  email = '';
  password = '';
  confirmPassword = '';

  obscurePass = true;
  obscureConfirm = true;
  isLoading = false;
  error = '';

  auth = inject(AuthService);
  router = inject(Router);

  async register() {
    this.error = '';

    // Simple validation
    if (!this.name || !this.lastName) {
      this.error = 'Nombre y Apellido son requeridos';
      return;
    }
    if (this.phone.length !== 10) {
      this.error = 'El teléfono debe tener 10 dígitos';
      return;
    }
    if (!this.email.includes('@')) {
      this.error = 'Correo inválido';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.isLoading = true;

    try {
      const fullName = `${this.name} ${this.lastName}`.trim();
      // The AuthService needs to support phone number too, I should verify that.
      // The flutter code passes phone number to signUp.
      // I need to update AuthService to accept phone number.
      await this.auth.signUp(this.email, this.password, fullName, this.phone);
      // Important: The original auth.signUp in flutter app handles phone number upsert. 
      // I will need to update the angular service to match this logic.

      this.router.navigate(['/customer/home']);
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }
}
