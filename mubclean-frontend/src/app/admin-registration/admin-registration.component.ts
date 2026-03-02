import { Component, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
    planPrice = 599;
    planName = 'Suscripción Mensual';

    accountForm: FormGroup;
    businessForm: FormGroup;

    constructor(private route: ActivatedRoute) {
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

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            console.log('Query Params:', params);

            this.currentPlan = params['plan'] || 'monthly';
            this.updatePlanDetails();
        });
    }

    updatePlanDetails() {
        switch (this.currentPlan) {
            case 'trial':
                this.planPrice = 0;
                this.planName = '14 Días de Prueba';
                break;
            case 'monthly':
                this.planPrice = 599;
                this.planName = 'Suscripción Mensual';
                break;
            case 'annual':
                this.planPrice = 5990;
                this.planName = 'Suscripción Anual';
                break;
            default:
                this.planPrice = 599;
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
                this.ngZone.run(() => {
                    this.auth.checkSession();
                    this.currentStep = 2;
                });
            }
        } catch (e: any) {
            this.ngZone.run(() => {
                alert("Error al crear cuenta: " + e.message);
            });
        } finally {
            this.ngZone.run(() => {
                this.isLoading = false;
                this.cdr.detectChanges();
            });
        }
    }
    private cdr = inject(ChangeDetectorRef);
    private ngZone = inject(NgZone);

    async onStep2Submit() {
        if (this.businessForm.invalid) return;
        this.isLoading = true;

        try {
            const user = this.auth.currentUser;
            if (!user) throw new Error("No hay usuario autenticado. Completa el paso 1 primero.");

            // Create Business
            const { nombre, direccion, telefono, emailContacto, descripcion } = this.businessForm.value;
            const status = 'pending'; // Inicia como pendiente hasta que se pague

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
                    license_expiry: null
                })
                .select()
                .single();

            if (error) throw error;
            console.log('Negocio creado en DB:', data);

            // Refrescar perfil en app
            await this.auth.loadUserProfile();

            // 1) Si eligió Prueba Gratuita (14 días), activarlo directo sin MP
            if (this.currentPlan === 'trial') {
                const claimUrl = `${environment.apiUrl}/claim_license_payment`;
                const response = await fetch(claimUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentId: 'trial_' + new Date().getTime(), // Fake ID
                        businessId: data.id,
                        planType: 'trial'
                    })
                });

                if (!response.ok) throw new Error('Error al activar prueba');

                this.ngZone.run(() => {
                    this.isLoading = false;
                    alert('¡Prueba Gratuita de 14 Días Activada! Bienvenido a MubClean.');
                    this.router.navigate(['/admin/dashboard']);
                });
                return;
            }

            // 2) Si eligió Mensual o Anual, generar ticket de MercadoPago (Checkout Seguro)
            const backendUrl = `${environment.apiUrl}/create_license_preference`;
            const payload = {
                businessId: data.id,
                payerEmail: emailContacto || user.email,
                title: this.planName,
                price: this.planPrice,
                planType: this.currentPlan
            };

            const mpResponse = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!mpResponse.ok) {
                const errData = await mpResponse.json().catch(() => ({}));
                throw new Error(`Error Backend (${mpResponse.status}): ${errData.error || mpResponse.statusText}`);
            }

            const { init_point } = await mpResponse.json();

            // Redirigir la ventana actual al Checkout
            window.location.href = init_point;

        } catch (e: any) {
            this.ngZone.run(() => {
                console.error(e);
                alert("Error: " + (e.message || JSON.stringify(e)));
                this.isLoading = false;
            });
        }
    }
}
