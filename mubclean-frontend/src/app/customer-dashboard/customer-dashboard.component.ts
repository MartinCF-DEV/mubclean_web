import { Component, OnInit, OnDestroy, inject, effect, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="app-bar">
        <h1>MubClean</h1>
      </header>

      <div *ngIf="isLoading" class="loading-container">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!isLoading && negocios.length === 0" class="empty-state">
        <p>No hay negocios disponibles.</p>
      </div>

      <div *ngIf="!isLoading && negocios.length > 0" class="business-list">
        <div *ngFor="let negocio of negocios" class="business-card">
          <!-- Banner Image -->
          <div class="card-banner" [style.background-image]="negocio.portada_url ? 'url(' + negocio.portada_url + ')' : null">
             <div *ngIf="!negocio.portada_url" class="placeholder-banner">
               <span class="material-icons">store</span>
             </div>
          </div>

          <div class="card-content">
            <div class="card-header">
              <h3 class="business-name">{{ negocio.nombre }}</h3>
              <div class="rating-badge">
                <span class="material-icons star-icon">star</span>
                <span>4.8</span>
              </div>
            </div>

            <p class="business-desc">
              {{ negocio.descripcion || "Expertos en limpieza de muebles y tapicería." }}
            </p>

            <button class="view-btn" (click)="goToBusiness(negocio.id)">VER SERVICIOS</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 0;
    }

    .app-bar {
      background-color: white;
      padding: 16px 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .app-bar h1 {
      margin: 0;
      font-size: 24px;
      color: #1565C0;
      font-weight: 700;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .spinner {
      border: 3px solid rgba(21, 101, 192, 0.1);
      border-radius: 50%;
      border-top: 3px solid #1565C0;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .business-list {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .business-card {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(21, 101, 192, 0.08);
      transition: transform 0.2s;
    }

    .business-card:hover {
      transform: translateY(-2px);
    }

    .card-banner {
      height: 160px;
      background-color: #eee;
      background-size: cover;
      background-position: center;
    }

    .placeholder-banner {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #bbdefb;
    }

    .placeholder-banner .material-icons {
      font-size: 50px;
    }

    .card-content {
      padding: 20px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .business-name {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #333;
    }

    .rating-badge {
      background-color: #E8F5E9;
      color: #2E7D32;
      padding: 5px 10px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      font-weight: 700;
      font-size: 12px;
    }

    .star-icon {
      font-size: 14px;
      margin-right: 4px;
    }

    .business-desc {
      color: #666;
      font-size: 14px;
      margin: 0 0 20px 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .view-btn {
      width: 100%;
      padding: 12px;
      background: transparent;
      border: 1px solid #1565C0;
      color: #1565C0;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }

    .view-btn:hover {
      background: rgba(21, 101, 192, 0.05);
    }
  `]
})
export class CustomerDashboardComponent implements OnInit, OnDestroy {
  negocios: any[] = [];
  isLoading = true;
  private supabase: SupabaseClient;

  auth = inject(AuthService);
  cdr = inject(ChangeDetectorRef);
  router = inject(Router);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    effect(() => {
      // We listen to user changes to re-fetch if permissions depend on it
      // Or just fetch immediately if public.
      // Assuming we want to fetch as soon as loaded, but if RLS depends on auth:
      if (this.auth.user() || !environment.production) {
        this.fetchNegocios();
      }
    });
  }

  ngOnInit() {
    this.fetchNegocios();

    this.refreshInterval = setInterval(() => {
      if (this.auth.user()) {
        this.fetchNegocios();
      }
    }, 3000);
  }

  refreshInterval: any;

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async fetchNegocios() {
    try {
      const { data, error } = await this.supabase
        .from('negocios')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      this.negocios = data || [];
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  goToBusiness(id: string) {
    this.router.navigate(['/customer/business', id]);
  }
}

