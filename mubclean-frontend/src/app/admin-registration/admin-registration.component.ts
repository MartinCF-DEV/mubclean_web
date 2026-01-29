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

    accountForm: FormGroup;
    businessForm: FormGroup;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

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

            // Setup initial status based on plan
            let status = 'pending';
            let expiry = null;

            if (plan === 'trial') {
                status = 'active';
                const now = new Date();
                now.setSeconds(now.getSeconds() + 30); // 30 seconds trial
                expiry = now.toISOString();
            }

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

            // Reload user profile to catch new business role/status
            await this.auth.loadUserProfile();

            // Handle Redirection based on Plan
            if (plan === 'trial') {
                // Trial: Go to Dashboard immediately
                this.router.navigate(['/admin/dashboard']);
                this.isLoading = false;
            } else {
                // Paid: Go to Payment Gateway
                const backendUrl = 'http://localhost:3000/api/create_license_preference';

                const price = plan === 'annual' ? 1500 : 150;
                const title = plan === 'annual'
                    ? `Licencia Anual - ${nombre}`
                    : `Licencia Mensual - ${nombre}`;

                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessId: data.id,
                        title: title,
                        price: price,
                        payerEmail: emailContacto
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Error al crear pago');
                }

                const { init_point } = await response.json();

                // Redirect
                window.location.href = init_point;
            }

        } catch (e: any) {
            alert("Error al registrar negocio: " + e.message);
            this.isLoading = false;
        } finally {
            // keep loading if redirecting
        }
    }
}
