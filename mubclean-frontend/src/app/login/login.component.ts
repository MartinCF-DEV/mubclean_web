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
    /* Google Fonts Import */
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;400;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap');

    :host {
      display: block;
      font-family: 'Inter', sans-serif;
    }

    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #F8FAFC; /* Dashboard bg */
      padding: 20px;
    }

    .login-content {
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      background: white;
      border: 3px solid #000;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 8px 8px 0 #000;
      position: relative;
    }

    /* Logo Section */
    .logo-container {
      align-self: center;
      width: 80px;
      height: 80px;
      background-color: #EFF6FF;
      border: 2px solid #000;
      border-radius: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 24px;
      box-shadow: 4px 4px 0 #000;
    }

    .logo-image {
      width: 50px;
      height: 50px;
      object-fit: contain;
    }

    .app-title {
      text-align: center;
      font-size: 36px;
      font-weight: 800;
      color: #0F172A;
      margin: 0;
      font-family: 'Fraunces', serif;
      letter-spacing: -1px;
    }

    .app-subtitle {
      text-align: center;
      color: #64748B;
      font-size: 16px;
      font-weight: 500;
      margin: 8px 0 0 0;
    }

    .spacer-50 { height: 40px; }
    .spacer-30 { height: 24px; }
    .spacer-20 { height: 20px; }

    /* Input Styling */
    .input-group {
      display: flex;
      align-items: center;
      background-color: white;
      border: 2px solid #000;
      border-radius: 12px;
      padding: 0 16px;
      height: 56px;
      transition: all 0.2s;
    }

    .input-group:focus-within {
      transform: translate(-2px, -2px);
      box-shadow: 4px 4px 0 #000;
    }

    .input-icon {
      color: #0F172A;
      margin-right: 12px;
    }

    .input-group input {
      border: none;
      background: transparent;
      flex: 1;
      height: 100%;
      font-size: 16px;
      font-weight: 500;
      outline: none;
      color: #0F172A;
      font-family: 'Inter', sans-serif;
    }
    
    .input-group input::placeholder {
      color: #94A3B8;
    }

    .icon-button {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748B;
      display: flex;
      align-items: center;
      padding: 8px;
    }
    
    .icon-button:hover {
      color: #0F172A;
    }

    /* Links */
    .forgot-pass {
      text-align: right;
      margin-top: 12px;
    }

    .forgot-pass a {
      color: #64748B;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      transition: color 0.2s;
    }

    .forgot-pass a:hover {
      color: #1565C0;
      text-decoration: underline;
    }

    /* Button */
    .primary-button {
      height: 56px;
      background-color: #1565C0;
      color: white;
      border: 2px solid #000;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 4px 4px 0 #000;
      transition: all 0.2s;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Inter', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .primary-button:hover:not(:disabled) {
      background-color: #1E40AF;
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0 #000;
    }

    .primary-button:active:not(:disabled) {
      transform: translate(0, 0);
      box-shadow: 2px 2px 0 #000;
    }

    .primary-button:disabled {
      background-color: #94A3B8;
      cursor: not-allowed;
      box-shadow: 2px 2px 0 #000;
      opacity: 1;
      transform: none;
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
      gap: 6px;
      font-size: 15px;
    }

    .text-grey {
      color: #64748B;
      font-weight: 500;
    }

    .register-link {
      color: #1565C0;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }

    .register-link:hover {
      text-decoration: underline;
    }

    .error-msg { 
      color: #DC2626; 
      text-align: center; 
      margin-top: 16px; 
      font-weight: 600;
      font-size: 14px;
      background: #FEE2E2;
      border: 2px solid #F87171;
      padding: 10px;
      border-radius: 8px;
    }
    
    .success-msg { 
      color: #15803D; 
      text-align: center; 
      margin-top: 16px;
      font-weight: 600;
      font-size: 14px;
      background: #DCFCE7;
      border: 2px solid #4ADE80;
      padding: 10px;
      border-radius: 8px;
    }
    
    /* Responsive */
    @media (max-width: 480px) {
      .login-content {
        padding: 30px 20px;
        box-shadow: 6px 6px 0 #000;
      }
      
      .app-title {
        font-size: 28px;
      }
    }
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
