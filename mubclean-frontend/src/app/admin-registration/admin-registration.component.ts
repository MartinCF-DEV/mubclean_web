import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-admin-registration',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './admin-registration.component.html',
    styleUrls: ['./admin-registration.component.css']
})
export class AdminRegistrationComponent {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private auth = inject(AuthService);
    private supabase: SupabaseClient;

    // Pasos: 1 = Cuenta, 2 = Negocio
    currentStep = 1;
    isLoading = false;

    // Plan Details
    currentPlan = 'monthly';
    planPrice = 150;
    planName = 'Plan Mensual';

    accountForm: FormGroup;
    businessForm: FormGroup;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

        const urlTree = this.router.parseUrl(this.router.url);
        this.currentPlan = urlTree.queryParams['plan'] || 'monthly';
        this.updatePlanDetails();

        this.accountForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        });

        this.businessForm = this.fb.group({
            nombre: ['', Validators.required],
            direccion: ['', Validators.required],
            telefono: ['', Validators.required],
            emailContacto: ['', [Validators.required, Validators.email]],
            descripcion: ['', Validators.required]
        });

        // Si ya existe usuario, saltar al paso 2
        if (this.auth.currentUser) {
            this.currentStep = 2;
        }
    }

    updatePlanDetails() {
        switch (this.currentPlan) {
            case 'trial':
                this.planPrice = 10;
                this.planName = 'Validación Tarjeta (Reembolsable)';
                break;
            case 'monthly':
                this.planPrice = 150;
                this.planName = 'Suscripción Mensual';
                break;
            case 'annual':
                this.planPrice = 1500;
                this.planName = 'Suscripción Anual';
                break;
            default:
                this.planPrice = 150;
                this.planName = 'Suscripción Mensual';
        }
    }

    async onStep1Submit() {
        if (this.accountForm.invalid) return;
        this.isLoading = true;

        const { email, password, confirmPassword } = this.accountForm.value;

        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden");
            this.isLoading = false;
            return;
        }

        try {
            // Registrar usuario en Supabase Auth
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            // Si el registro es exitoso (y posiblemente auto-login), pasar al paso 2
            if (data.user) {
                this.auth.checkSession();
                this.currentStep = 2;
            }
        } catch (e: any) {
            alert("Error al crear cuenta: " + e.message);
        } finally {
            this.isLoading = false;
        }
    }

    async onStep2Submit() {
        if (this.businessForm.invalid) return;
        this.isLoading = true;

        try {
            const user = this.auth.currentUser;
            if (!user) throw new Error("No hay usuario autenticado.");

            // Determine Plan
            const urlTree = this.router.parseUrl(this.router.url);
            const plan = urlTree.queryParams['plan'] || 'monthly'; // default

            const { nombre, direccion, telefono, emailContacto, descripcion } = this.businessForm.value;

            // Setup initial status - All plans now start as pending payment
            let status = 'pending';
            let expiry = null;

            // Insert Business
            const { data, error } = await this.supabase
                .from('negocios')
                .insert({
                    owner_id: user.id,
                    nombre,
                    direccion,
                    telefono,
                    email_contacto: emailContacto,
                    descripcion,
                    activo: true,
                    subscription_status: status,
                    license_expiry: expiry
                })
                .select()
                .single();

            if (error) throw error;

            console.log('Negocio creado:', data);

            // Reload user profile
            await this.auth.loadUserProfile();

            // Handle Redirection based on Plan
            const backendUrl = `${environment.apiUrl}/create_license_preference`;

            let price = 0;
            let title = '';

            switch (plan) {
                case 'trial':
                    price = 10;
                    title = `Licencia Prueba (Validación) - ${nombre}`;
                    break;
                case 'monthly':
                    price = 150;
                    title = `Licencia Mensual - ${nombre}`;
                    break;
                case 'annual':
                    price = 1500;
                    title = `Licencia Anual - ${nombre}`;
                    break;
                default:
                    price = 150;
                    title = `Licencia Mensual - ${nombre}`;
            }

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: data.id,
                    title: title,
                    price: price,
                    payerEmail: emailContacto,
                    planType: plan
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Error al crear pago');
            }

            const { init_point } = await response.json();

            // Redirect
            window.location.href = init_point;

        } catch (e: any) {
            console.error(e);
            alert("Error General: " + (e.message || JSON.stringify(e)));
            this.isLoading = false;
        } finally {
            // keep loading if redirecting
        }
    }
}
