import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-wrapper">
      <div class="login-content">
        <!-- Logo Section -->
        <div class="logo-container">
          <img src="logo.png" alt="MubClean Logo" class="logo-image">
        </div>
        
        <h1 class="app-title">MubClean</h1>
        <p class="app-subtitle">Tu servicio de limpieza experto</p>

        <div class="spacer-50"></div>

        <!-- Form Section -->
        <div class="input-group">
          <span class="material-icons input-icon">email</span>
          <input 
            type="email" 
            [(ngModel)]="email" 
            placeholder="Correo Electrónico"
            [disabled]="isLoading"
          />
        </div>

        <div class="spacer-20"></div>

        <div class="input-group">
          <span class="material-icons input-icon">lock_outline</span>
          <input 
            [type]="obscurePass ? 'password' : 'text'" 
            [(ngModel)]="password" 
            placeholder="Contraseña"
            (keydown.enter)="login()"
            [disabled]="isLoading"
          />
          <button class="icon-button" (click)="obscurePass = !obscurePass">
            <span class="material-icons">{{ obscurePass ? 'visibility_off' : 'visibility' }}</span>
          </button>
        </div>

        <div class="forgot-pass">
          <a (click)="forgotPassword()">¿Olvidaste tu contraseña?</a>
        </div>

        <div class="spacer-30"></div>

        <button class="primary-button" (click)="login()" [disabled]="isLoading">
          <span *ngIf="!isLoading">INICIAR SESIÓN</span>
          <div *ngIf="isLoading" class="spinner"></div>
        </button>

        <p *ngIf="error" class="error-msg">{{ error }}</p>
        <p *ngIf="successMsg" class="success-msg">{{ successMsg }}</p>

        <div class="spacer-30"></div>

        <div class="register-footer">
          <span class="text-grey">¿Nuevo aquí?</span>
          <a routerLink="/register" class="register-link">Crear Cuenta</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: white;
      padding: 30px;
    }

    .login-content {
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
      background-color: rgba(21, 101, 192, 0.1); /* Primary Blue 10% opacity */
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
      font-size: 32px;
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

    /* Input Styling */
    .input-group {
      display: flex;
      align-items: center;
      background-color: var(--input-fill);
      border: 1px solid var(--input-border);
      border-radius: 12px;
      padding: 0 12px;
      height: 56px; /* Typical Flutter input height */
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

    /* Links */
    .forgot-pass {
      text-align: right;
      margin-top: 8px;
    }

    .forgot-pass a {
      color: rgba(21, 101, 192, 0.8);
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
    }

    .forgot-pass a:hover {
      text-decoration: underline;
    }

    /* Button */
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
      background-color: #0D47A1; /* Darker blue */
    }

    .primary-button:active:not(:disabled) {
      transform: translateY(1px);
    }

    .primary-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    /* Spinner */
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

    /* Footer */
    .register-footer {
      display: flex;
      justify-content: center;
      gap: 5px;
    }

    .text-grey {
      color: var(--text-grey);
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
export class LoginComponent {
  email = '';
  password = '';
  obscurePass = true;
  isLoading = false;
  error = '';
  successMsg = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  async login() {
    if (!this.email || !this.password) {
      this.error = 'Por favor ingresa correo y contraseña';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      await this.auth.signIn(this.email, this.password);
    } catch (e: any) {
      // FORCE UI UPDATE ON ERROR
      this.ngZone.run(() => {
        console.log("Login Error Caught:", e);
        this.error = e.message || "Error al iniciar sesión";
        this.isLoading = false;
        this.cdr.detectChanges(); // <-- Critical fix for stuck loading state
      });
      return;
    }

    // Success Block
    this.ngZone.run(() => {
      this.isLoading = false;

      const profile = this.auth.profile;
      console.log("Login Success. Profile:", profile);

      if (!profile) {
        const userEmail = this.auth.currentUser?.email;
        if (userEmail === 'brandoncauich1@gmail.com') {
          this.router.navigate(['/admin/dashboard']);
          return;
        }
        this.router.navigate(['/customer/home']);
        return;
      }

      const role = (profile.rol || '').trim().toLowerCase();
      if (['admin', 'admin_negocio', 'negocio'].includes(role)) {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/customer/home']);
      }
    });
  }

  async forgotPassword() {
    const email = prompt("Ingresa tu correo para recuperar contraseña:");
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Por favor ingresa un correo electrónico válido.");
      return;
    }

    try {
      await this.auth.resetPassword(email);
      this.ngZone.run(() => {
        this.successMsg = `Se ha enviado un correo de recuperación a ${email}. Por favor revisa tu bandeja de entrada.`;
        this.error = '';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMsg = '';
          this.cdr.detectChanges();
        }, 10000);
      });
    } catch (e: any) {
      this.ngZone.run(() => {
        console.error(e);
        this.error = e.message || "Error al enviar correo de recuperación. Intenta nuevamente.";
        this.cdr.detectChanges();
      });
    }
  }
}
