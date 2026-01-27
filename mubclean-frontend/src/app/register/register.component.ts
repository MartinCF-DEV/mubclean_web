import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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

      <div class="register-content fade-in">
        <h2 class="title">{{ isBusiness ? 'Registrar Negocio' : 'Únete a MubClean' }}</h2>
        <p class="subtitle">Completa tus datos para comenzar</p>

        <div class="spacer-30"></div>

        <form (ngSubmit)="register()" #registerForm="ngForm">
            <!-- Name & Last Name Row -->
            <div class="row gap-20">
              <div class="input-container flex-1">
                <label>Nombre(s) *</label>
                <div class="input-box" [class.error-border]="nameModel.invalid && (nameModel.dirty || nameModel.touched)">
                   <input type="text" [(ngModel)]="name" name="name" required #nameModel="ngModel" placeholder="Ej. Juan"/>
                </div>
                <div *ngIf="nameModel.invalid && (nameModel.dirty || nameModel.touched)" class="validation-msg">
                  Requerido
                </div>
              </div>
              
              <div class="input-container flex-1">
                <label>Apellido(s) *</label>
                <div class="input-box" [class.error-border]="lastNameModel.invalid && (lastNameModel.dirty || lastNameModel.touched)">
                   <input type="text" [(ngModel)]="lastName" name="lastName" required #lastNameModel="ngModel" placeholder="Ej. Pérez"/>
                </div>
                <div *ngIf="lastNameModel.invalid && (lastNameModel.dirty || lastNameModel.touched)" class="validation-msg">
                  Requerido
                </div>
              </div>
            </div>

            <div class="spacer-20"></div>

            <!-- Business Name (Only if isBusiness) -->
            <div class="input-container" *ngIf="isBusiness">
                <label>Nombre del Negocio *</label>
                <div class="input-box" [class.error-border]="businessModel.invalid && (businessModel.dirty || businessModel.touched)">
                    <span class="material-icons input-icon">store</span>
                    <input type="text" [(ngModel)]="businessName" name="businessName" required #businessModel="ngModel" placeholder="Ej. Limpieza Express"/>
                </div>
                <div *ngIf="businessModel.invalid && (businessModel.dirty || businessModel.touched)" class="validation-msg">
                    El nombre del negocio es requerido
                </div>
            </div>
            <div class="spacer-20" *ngIf="isBusiness"></div>

            <!-- Phone -->
            <div class="input-container">
              <label>Teléfono Móvil *</label>
              <div class="input-box" [class.error-border]="phoneModel.invalid && (phoneModel.dirty || phoneModel.touched)">
                 <span class="material-icons input-icon">phone</span>
                 <input type="tel" [(ngModel)]="phone" name="phone" required minlength="10" maxlength="10" pattern="^[0-9]*$" #phoneModel="ngModel" placeholder="10 dígitos"/>
              </div>
              <div *ngIf="phoneModel.invalid && (phoneModel.dirty || phoneModel.touched)" class="validation-msg">
                <span *ngIf="phoneModel.errors?.['required']">Requerido</span>
                <span *ngIf="phoneModel.errors?.['minlength'] || phoneModel.errors?.['pattern']">Ingresa 10 dígitos numéricos</span>
              </div>
            </div>

            <div class="spacer-20"></div>

            <!-- Email -->
            <div class="input-container">
              <label>Correo Electrónico *</label>
              <div class="input-box" [class.error-border]="emailModel.invalid && (emailModel.dirty || emailModel.touched)">
                 <span class="material-icons input-icon">email</span>
                 <input type="email" [(ngModel)]="email" name="email" required email #emailModel="ngModel" placeholder="ejemplo@correo.com"/>
              </div>
              <div *ngIf="emailModel.invalid && (emailModel.dirty || emailModel.touched)" class="validation-msg">
                 Correo inválido
              </div>
            </div>

            <div class="spacer-20"></div>

            <!-- Password -->
            <div class="input-container">
              <label>Contraseña *</label>
              <div class="input-box" [class.error-border]="passModel.invalid && (passModel.dirty || passModel.touched)">
                 <span class="material-icons input-icon">lock</span>
                 <input [type]="obscurePass ? 'password' : 'text'" [(ngModel)]="password" name="password" required minlength="6" #passModel="ngModel"/>
                 <button type="button" class="icon-button-small" (click)="obscurePass = !obscurePass">
                    <span class="material-icons">{{ obscurePass ? 'visibility_off' : 'visibility' }}</span>
                 </button>
              </div>
              <div *ngIf="passModel.invalid && (passModel.dirty || passModel.touched)" class="validation-msg">
                 Mínimo 6 caracteres
              </div>
            </div>

            <div class="spacer-20"></div>

            <!-- Confirm Password -->
            <div class="input-container">
              <label>Confirmar Contraseña *</label>
              <div class="input-box" [class.error-border]="password !== confirmPassword && confirmModel.touched">
                 <span class="material-icons input-icon">lock_outline</span>
                 <input [type]="obscureConfirm ? 'password' : 'text'" [(ngModel)]="confirmPassword" name="confirmPassword" required #confirmModel="ngModel"/>
                 <button type="button" class="icon-button-small" (click)="obscureConfirm = !obscureConfirm">
                    <span class="material-icons">{{ obscureConfirm ? 'visibility_off' : 'visibility' }}</span>
                 </button>
              </div>
              <div *ngIf="password !== confirmPassword && confirmModel.touched" class="validation-msg">
                 Las contraseñas no coinciden
              </div>
            </div>

            <div class="spacer-40"></div>

            <button type="submit" class="primary-button" [disabled]="isLoading || registerForm.invalid || (password !== confirmPassword)">
               <span *ngIf="!isLoading">{{ isBusiness ? 'REGISTRAR NEGOCIO' : 'CREAR CUENTA' }}</span>
               <div *ngIf="isLoading" class="spinner"></div>
            </button>

            <p *ngIf="error" class="error-bottom">
              <span class="material-icons" style="font-size: 16px; margin-right: 4px; vertical-align: text-bottom;">error</span>
              {{ error }}
            </p>
        </form>

      </div>
    </div>
  `,
  styles: [`
    .register-wrapper {
      min-height: 100vh;
      background-color: #F8FAFC; /* Softer background */
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: 'Inter', sans-serif;
    }

    .app-bar {
      width: 100%;
      height: 60px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      background: white;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .app-bar-title {
      font-size: 18px;
      font-weight: 600;
      margin-left: 16px;
      color: #334155;
    }

    .icon-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      color: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .icon-button:hover { background: #F1F5F9; }

    .register-content {
      width: 100%;
      max-width: 520px;
      padding: 30px;
      background: white;
      margin-top: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      margin-bottom: 40px;
    }

    .title {
      font-size: 28px;
      font-weight: 700;
      color: #1976D2;
      margin: 0;
      text-align: center;
      letter-spacing: -0.5px;
    }

    .subtitle {
      text-align: center;
      color: #64748B;
      font-size: 14px;
      margin: 8px 0 0 0;
    }

    /* Spacers */
    .spacer-40 { height: 40px; }
    .spacer-30 { height: 30px; }
    .spacer-20 { height: 20px; }

    /* Layout */
    .row { display: flex; }
    .gap-20 { gap: 20px; }
    .flex-1 { flex: 1; }

    /* Input Styling */
    .input-container {
      display: flex;
      flex-direction: column;
    }

    .input-container label {
      font-size: 13px;
      font-weight: 500;
      color: #475467;
      margin-bottom: 6px;
    }

    .input-box {
      display: flex;
      align-items: center;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      height: 48px;
      padding: 0 12px;
      background: white;
      transition: all 0.2s ease;
    }

    .input-box:focus-within {
      border-color: #1565C0;
      box-shadow: 0 0 0 4px rgba(21, 101, 192, 0.1);
    }

    .input-box.error-border {
      border-color: #EF4444;
    }
    
    .input-box.error-border:focus-within {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
    }

    .input-box input {
      border: none;
      background: transparent;
      flex: 1;
      height: 100%;
      font-size: 15px;
      outline: none;
      margin-left: 8px;
      color: #1E293B;
    }
    
    .input-box input::placeholder { color: #94A3B8; }

    .input-icon {
      color: #64748B;
      font-size: 20px;
    }

    .icon-button-small {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748B;
      display: flex;
      padding: 4px;
    }

    /* Validation Message */
    .validation-msg {
      font-size: 12px;
      color: #EF4444;
      margin-top: 4px;
      font-weight: 500;
    }

    /* Primary Button */
    .primary-button {
      width: 100%;
      height: 52px;
      background-color: #1565C0;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .primary-button:hover:not(:disabled) {
      background-color: #0D47A1;
    }
    
    .primary-button:disabled {
      background-color: #94A3B8;
      cursor: not-allowed;
    }

    .error-bottom { 
      color: #B91C1C; 
      background: #FEF2F2;
      border: 1px solid #FECACA;
      padding: 10px;
      border-radius: 8px;
      text-align: center; 
      margin-top: 20px; 
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 3px solid white;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    }
    
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    @media (max-width: 600px) {
        .register-content {
             margin-top: 0;
             box-shadow: none;
             max-width: 100%;
             padding: 20px;
        }
        .register-wrapper {
            background: white;
        }
    }
  `]
})
export class RegisterComponent implements OnInit {
  name = '';
  lastName = '';
  phone = '';
  email = '';
  password = '';
  confirmPassword = '';

  // New Field
  businessName = '';

  obscurePass = true;
  obscureConfirm = true;
  isLoading = false;
  error = '';
  isBusiness = false;

  auth = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.isBusiness = params['type'] === 'business';
    });
  }

  async register() {
    this.error = '';

    // Business Validation
    if (this.isBusiness && !this.businessName.trim()) {
      this.error = 'El nombre del negocio es requerido';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = "Las contraseñas no coinciden";
      return;
    }

    this.isLoading = true;

    try {
      const fullName = `${this.name} ${this.lastName}`.trim();
      const role = this.isBusiness ? 'negocio' : 'cliente';

      await this.auth.signUp(this.email, this.password, fullName, this.phone, role, this.businessName);

      if (this.isBusiness) {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/customer/home']);
      }

    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }
}
