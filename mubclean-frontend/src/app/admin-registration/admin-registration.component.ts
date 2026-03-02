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
    private cdr = inject(ChangeDetectorRef);
    private ngZone = inject(NgZone);

    // Steps: 1 = Account, 2 = Plan, 3 = Business
    currentStep = 1;
    isLoading = false;

    // Plan Info
    currentPlan = '';
    planPrice = 0;
    planName = '';

    // Toast
    toastMessage = '';
    toastType: 'success' | 'error' | 'info' = 'info';
    toastVisible = false;
    private toastTimer: any;

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
            emailContacto: ['', [Validators.required, Validators.email]]
            // descripcion removed to reduce registration friction
        });
    }

    async ngOnInit() {
        if (this.auth.currentUser) {
            const user = this.auth.currentUser;
            const { data: negocio } = await this.supabase
                .from('negocios')
                .select('id')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (negocio) {
                this.router.navigate(['/admin/dashboard']);
                return;
            }
            // Auto-fill email from logged in user
            this.businessForm.patchValue({ emailContacto: user.email });
            this.currentStep = 2;
        }
    }

    showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.ngZone.run(() => {
            this.toastMessage = message;
            this.toastType = type;
            this.toastVisible = true;
            this.cdr.detectChanges();
            this.toastTimer = setTimeout(() => {
                this.toastVisible = false;
                this.cdr.detectChanges();
            }, 4000);
        });
    }

    selectPlan(plan: string) {
        this.currentPlan = plan;
        switch (plan) {
            case 'trial':
                this.planPrice = 0;
                this.planName = '14 Días de Prueba Gratuita';
                break;
            case 'monthly':
                this.planPrice = 599;
                this.planName = 'Licencia Mensual';
                break;
            case 'annual':
                this.planPrice = 5990;
                this.planName = 'Licencia Anual';
                break;
        }
        this.currentStep = 3;
    }

    async onStep1Submit() {
        if (this.accountForm.invalid) return;
        this.isLoading = true;

        const { email, password, confirmPassword } = this.accountForm.value;

        if (password !== confirmPassword) {
            this.showToast('Las contraseñas no coinciden. Por favor verifica.', 'error');
            this.isLoading = false;
            return;
        }

        try {
            const { data, error } = await this.supabase.auth.signUp({ email, password });
            if (error) {
                if (error.message.includes('already registered') || error.message.includes('already been registered')) {
                    this.showToast('Este correo ya tiene una cuenta registrada. ¿Quieres iniciar sesión?', 'error');
                } else {
                    this.showToast(error.message || 'Error al crear la cuenta.', 'error');
                }
                return;
            }

            if (data.user) {
                await this.auth.checkSession();
                // Pre-fill email in step 3
                this.businessForm.patchValue({ emailContacto: email });
                this.ngZone.run(() => {
                    this.currentStep = 2;
                    this.cdr.detectChanges();
                });
            }
        } catch (e: any) {
            this.showToast(e.message || 'Error inesperado al crear la cuenta.', 'error');
        } finally {
            this.ngZone.run(() => {
                this.isLoading = false;
                this.cdr.detectChanges();
            });
        }
    }

    async onStep3Submit() {
        if (!this.currentPlan) {
            this.showToast('Por favor selecciona un plan primero.', 'error');
            this.currentStep = 2;
            return;
        }
        if (this.businessForm.invalid) return;
        this.isLoading = true;

        try {
            const user = this.auth.currentUser;
            if (!user) throw new Error('No hay usuario autenticado. Completa el paso 1 primero.');

            const { nombre, direccion, telefono, emailContacto } = this.businessForm.value;

            const { data, error } = await this.supabase
                .from('negocios')
                .insert({
                    owner_id: user.id,
                    nombre,
                    direccion,
                    telefono,
                    email_contacto: emailContacto,
                    descripcion: '',
                    activo: true,
                    subscription_status: 'pending',
                    license_expiry: null
                })
                .select()
                .single();

            if (error) throw error;
            await this.auth.loadUserProfile();

            if (this.currentPlan === 'trial') {
                const claimUrl = `${environment.apiUrl}/claim_license_payment`;
                const response = await fetch(claimUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentId: 'trial_' + new Date().getTime(),
                        businessId: data.id,
                        planType: 'trial'
                    })
                });

                if (!response.ok) throw new Error('Error al activar la prueba gratuita.');

                this.ngZone.run(() => {
                    this.isLoading = false;
                    this.router.navigate(['/admin/dashboard']);
                });
                return;
            }

            // Monthly / Annual: go to MercadoPago
            const backendUrl = `${environment.apiUrl}/create_license_preference`;
            const mpResponse = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: data.id,
                    payerEmail: emailContacto || user.email,
                    title: this.planName,
                    price: this.planPrice,
                    planType: this.currentPlan
                })
            });

            if (!mpResponse.ok) {
                const errData = await mpResponse.json().catch(() => ({}));
                throw new Error(`Error Backend (${mpResponse.status}): ${errData.error || mpResponse.statusText}`);
            }

            const { init_point } = await mpResponse.json();
            window.location.href = init_point;

        } catch (e: any) {
            this.ngZone.run(() => {
                this.showToast(e.message || 'Error inesperado. Intenta de nuevo.', 'error');
                this.isLoading = false;
            });
        }
    }
}
