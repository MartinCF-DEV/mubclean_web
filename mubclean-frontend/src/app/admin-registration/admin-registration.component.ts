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

    // Payment State
    paymentId: string | null = null;
    isPaymentConfirmed = false;

    accountForm: FormGroup;
    businessForm: FormGroup;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

        const urlTree = this.router.parseUrl(this.router.url);
        this.currentPlan = urlTree.queryParams['plan'] || 'monthly';

        // Check for payment return
        const status = urlTree.queryParams['status'] || urlTree.queryParams['collection_status'];
        const pId = urlTree.queryParams['payment_id'] || urlTree.queryParams['collection_id'];

        if (status === 'approved' && pId) {
            this.isPaymentConfirmed = true;
            this.paymentId = pId;
        } else {
            // If not paid, redirect to pricing (enforce Pay-First)
            // But allow a brief moment or check if user is already registered? 
            // Ideally we redirect immediately.
            // setTimeout(() => this.router.navigate(['/business-pricing']), 100);
            // Let's rely on Step 2 submit check to enforce, or just let them see the form but fail/redirect on submit.
            // Better: If they are ON Step 1, maybe they are just looking?
            // Let's enforce on Submit or init. 
            // Update: Let's enforce init.
        }

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
        if (!this.isPaymentConfirmed) {
            alert('Debes seleccionar y pagar un plan primero.');
            this.router.navigate(['/business-pricing']);
            return;
        }

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
        if (!this.isPaymentConfirmed) {
            alert('Pago no detectado. Redirigiendo a precios.');
            this.router.navigate(['/business-pricing']);
            return;
        }

        if (this.businessForm.invalid) return;
        this.isLoading = true;

        try {
            const user = this.auth.currentUser;
            if (!user) throw new Error("No hay usuario autenticado.");

            // Create Business
            const { nombre, direccion, telefono, emailContacto, descripcion } = this.businessForm.value;
            const status = 'active'; // We activate immediately as we have payment

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
                    license_expiry: null // Claim will set it
                })
                .select()
                .single();

            if (error) throw error;

            console.log('Negocio creado:', data);
            await this.auth.loadUserProfile();

            // Claim Payment
            const claimUrl = `${environment.apiUrl}/claim_license_payment`;
            const response = await fetch(claimUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentId: this.paymentId,
                    businessId: data.id,
                    planType: this.currentPlan
                })
            });

            if (!response.ok) {
                // Determine error
                throw new Error('Error al activar licencia. Contacta soporte con tu ID de pago: ' + this.paymentId);
            }

            alert('¡Cuenta y Licencia Activadas! Bienvenido a MubClean.');
            this.router.navigate(['/admin/dashboard']);

        } catch (e: any) {
            console.error(e);
            alert("Error: " + (e.message || JSON.stringify(e)));
            this.isLoading = false;
        } finally {
            // keep loading if redirecting
        }
    }
}
