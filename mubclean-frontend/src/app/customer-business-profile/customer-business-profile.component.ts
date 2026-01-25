import { Component, OnInit, inject, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-customer-business-profile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './customer-business-profile.html',
    styleUrls: ['./customer-business-profile.css']
})
export class CustomerBusinessProfileComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private auth = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    private supabase: SupabaseClient;

    businessId: string | null = null;
    business: any = null;
    services: any[] = [];
    loading = true;

    selectedService: any = null; // For modal

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

        effect(() => {
            // Reactive refresh if auth changes, though usually we just need ID
            if (this.auth.currentUser && this.businessId) {
                // Optional: User-specific checks
            }
        });
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.businessId = params.get('id');
            if (this.businessId) {
                this.fetchData();
            }
        });
    }

    async fetchData() {
        this.loading = true;
        try {
            if (!this.businessId) return;

            // Fetch Business
            const { data: bus, error: busError } = await this.supabase
                .from('negocios')
                .select('*')
                .eq('id', this.businessId)
                .single();

            if (busError) throw busError;
            this.business = bus;

            // Fetch Services
            const { data: serv, error: servError } = await this.supabase
                .from('servicios_catalogo')
                .select('*')
                .eq('negocio_id', this.businessId)
                .eq('activo', true)
                .order('nombre');

            if (servError) throw servError;
            this.services = serv || [];

        } catch (e) {
            console.error('Error fetching business details:', e);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    openServiceDetail(service: any) {
        this.selectedService = service;
    }

    closeServiceDetail() {
        this.selectedService = null;
    }

    goToWizard(service?: any) {
        // Navigate to wizard
        // We haven't created wizard yet, but let's plan the route
        // We might need to pass state or query params
        const queryParams: any = { businessId: this.businessId };
        if (service) {
            queryParams.serviceId = service.id;
        }

        // For now, alert or placeholder
        alert("Navegando al Wizard de Solicitud (Próximo paso)");
        // this.router.navigate(['/customer/wizard'], { queryParams });
    }

    goBack() {
        this.router.navigate(['/customer/home']);
    }
}
