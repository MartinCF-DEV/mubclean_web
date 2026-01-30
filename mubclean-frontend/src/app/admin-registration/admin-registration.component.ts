import { Component, inject } from '@angular/core';
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
    planPrice = 150;
    planName = 'Plan Mensual';

    // Payment State
    paymentId: string | null = null;
    isPaymentConfirmed = false;

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
        // Capture query params robustly
        this.route.queryParams.subscribe(params => {
            console.log('Query Params:', params);
            // alert('Debug Params: ' + JSON.stringify(params)); // Uncomment to debug on mobile

            this.currentPlan = params['plan'] || 'monthly';
            this.updatePlanDetails();

            // Check for payment return
            const status = params['status'] || params['collection_status'];
            const pId = params['payment_id'] || params['collection_id'];

            if (status === 'approved' && pId) {
                this.isPaymentConfirmed = true;
                this.paymentId = pId;
                // alert('Pago confirmado: ' + pId); // Debug
            } else {
                // Fallback or just let them stay on step 1 (they can't submit anyway without payment logic?)
                // Actually, if we want to enforce pay-first, checking here is good.
                // But let's avoid auto-redirect loop if they just arrived.
            }
        });
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
            const status = 'pending'; // Start pending, activate after claim

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

            console.log('Negocio creado (pending):', data);
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
                const errData = await response.json().catch(() => ({}));
                const msg = errData.error || errData.details || response.statusText;
                throw new Error('Error al activar licencia: ' + msg);
            }

            alert('¡Cuenta y Licencia Activadas! Bienvenido a MubClean.');
            this.router.navigate(['/admin/dashboard']);

        } catch (e: any) {
            console.error(e);
            alert("Error: " + (e.message || JSON.stringify(e)));
            this.isLoading = false;
        } finally {
            // this.isLoading = false; // Intentionally left commented or handled above to allow redirect
        }
    }
}
