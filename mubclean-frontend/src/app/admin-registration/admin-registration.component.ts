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

    // Pasos: 1 = Cuenta, 2 = Selecciona Plan, 3 = Info del Negocio
    currentStep = 1;
    isLoading = false;

    // Plan Details (selected in step 2)
    currentPlan = '';
    planPrice = 0;
    planName = '';

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
    }

    async ngOnInit() {
        // If user is already logged in, check if they already have a business
        if (this.auth.currentUser) {
            const user = this.auth.currentUser;
            const { data: negocio } = await this.supabase
                .from('negocios')
                .select('id, subscription_status, prueba_utilizada')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (negocio) {
                // User already has a business, redirect to dashboard or license page
                alert('Ya tienes un negocio registrado. Redirigiendo a tu panel...');
                this.router.navigate(['/admin/dashboard']);
                return;
            }

            // Has account but no business yet, skip to plan selection
            this.currentStep = 2;
        }
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
            alert("Las contraseñas no coinciden");
            this.isLoading = false;
            return;
        }

        try {
            const { data, error } = await this.supabase.auth.signUp({ email, password });
            if (error) throw error;

            if (data.user) {
                await this.auth.checkSession();
                this.ngZone.run(() => {
                    this.currentStep = 2; // Go to plan selection
                    this.cdr.detectChanges();
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

    async onStep3Submit() {
        if (!this.currentPlan) {
            alert('Por favor selecciona un plan primero.');
            this.currentStep = 2;
            return;
        }
        if (this.businessForm.invalid) return;
        this.isLoading = true;

        try {
            const user = this.auth.currentUser;
            if (!user) throw new Error("No hay usuario autenticado. Completa el paso 1 primero.");

            const { nombre, direccion, telefono, emailContacto, descripcion } = this.businessForm.value;

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
                    subscription_status: 'pending',
                    license_expiry: null
                })
                .select()
                .single();

            if (error) throw error;
            console.log('Negocio creado en DB:', data);

            await this.auth.loadUserProfile();

            // If trial: activate directly without MercadoPago
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

                if (!response.ok) throw new Error('Error al activar prueba gratuita');

                this.ngZone.run(() => {
                    this.isLoading = false;
                    alert('¡Prueba Gratuita de 14 Días Activada! Bienvenido a MubClean.');
                    this.router.navigate(['/admin/dashboard']);
                });
                return;
            }

            // For Monthly / Annual: generate MercadoPago checkout
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
