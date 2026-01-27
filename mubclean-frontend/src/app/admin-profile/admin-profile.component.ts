import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Perfil de Negocio</h1>
        <p class="subtitle">Personaliza la imagen de tu empresa</p>
      </header>
      
      <div *ngIf="isLoading" class="loading-container">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!isLoading && business" class="profile-card">
        
        <!-- Banner Section -->
        <div class="banner-area" [style.backgroundImage]="getBannerUrl(business.portada_url)">
            <input type="file" #bannerInput style="display: none" (change)="uploadImage($event, 'portada')" accept="image/*">
            <button class="edit-banner-btn" (click)="bannerInput.click()" title="Cambiar Portada">
                <span class="material-icons">edit</span>
            </button>
        </div>

        <!-- Logo Section (Overlapping) -->
        <div class="header-content">
            <div class="logo-wrapper">
                <img [src]="business.logo_url || 'assets/placeholder-business.png'" 
                     onerror="this.src='https://via.placeholder.com/150?text=Logo'" alt="Logo">
                
                <input type="file" #logoInput style="display: none" (change)="uploadImage($event, 'logo')" accept="image/*">
                <button class="edit-logo-btn" (click)="logoInput.click()">
                    <span class="material-icons">edit</span>
                </button>
            </div>

            <div class="header-info">
                <h2>{{ business.nombre || 'Nombre de tu Negocio' }}</h2>
                <p>{{ business.email_contacto }}</p>
            </div>
        </div>

        <!-- Form Fields -->
        <div class="form-section">
            <div class="form-group full-width">
                <label>Nombre del Negocio</label>
                <input type="text" [(ngModel)]="business.nombre" placeholder="Ej. Limpieza Express">
            </div>

            <div class="form-group full-width">
                <label>Descripción</label>
                <textarea [(ngModel)]="business.descripcion" rows="3" placeholder="Describe tus servicios..."></textarea>
            </div>

            <div class="grid-row">
                    <label>Teléfono de Contacto</label>
                    <input type="text" [(ngModel)]="business.telefono" placeholder="10 dígitos" maxlength="10" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                </div>

                <div class="form-group">
                    <label>Correo Público</label>
                    <input type="email" [(ngModel)]="business.email_contacto" placeholder="contacto@empresa.com">
                </div>
            </div>
            
            <div class="form-group full-width">
                <label>Dirección</label>
                <input type="text" [(ngModel)]="business.direccion" placeholder="Calle, Número, Colonia, Ciudad">
            </div>

            <div class="actions">
                <button class="save-btn" (click)="saveChanges()" [disabled]="isSaving || isUploading">
                    <span *ngIf="isSaving" class="spinner-small"></span>
                    <span *ngIf="isUploading">SUBIENDO IMAGEN...</span>
                    <span *ngIf="!isSaving && !isUploading">GUARDAR CAMBIOS</span>
                </button>
            </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 30px; max-width: 800px; margin: 0 auto; }
    .page-header h1 { color: #1565C0; margin: 0 0 5px; }
    .subtitle { color: #666; margin: 0 0 30px; }

    .loading-container { display: flex; justify-content: center; padding: 50px; }
    .spinner { width: 30px; height: 30px; border: 3px solid rgba(21,101,192,0.2); border-top-color: #1565C0; border-radius: 50%; animation: spin 1s linear infinite; }
    .spinner-small { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .profile-card { 
        background: white; border-radius: 16px; overflow: hidden; 
        box-shadow: 0 2px 15px rgba(0,0,0,0.05); border: 1px solid #EEE;
    }

    /* Banner */
    .banner-area {
        height: 200px;
        background-color: #E3F2FD;
        background-size: cover;
        background-position: center;
        position: relative;
    }
    /* Button positioned directly on banner */
    .edit-banner-btn {
        position: absolute; 
        bottom: 15px; 
        right: 15px;
        width: 40px; 
        height: 40px; 
        border-radius: 50%;
        background: white; 
        color: #1565C0; 
        border: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        display: flex; 
        align-items: center; 
        justify-content: center;
        cursor: pointer; 
        transition: transform 0.2s, background 0.2s;
        z-index: 10;
    }
    .edit-banner-btn:hover { 
        transform: scale(1.05);
        background: #F5F9FF;
    }
    .edit-banner-btn .material-icons { font-size: 20px; }

    /* Header Content (Logo + Info) */
    .header-content {
        padding: 0 30px; display: flex; align-items: flex-end;
        margin-top: -50px; position: relative; gap: 20px; margin-bottom: 30px;
    }

    .logo-wrapper {
        position: relative;
        width: 120px; height: 120px;
        border-radius: 50%; border: 4px solid white;
        background: white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .logo-wrapper img {
        width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
    }
    
    .edit-logo-btn {
        position: absolute; bottom: 0; right: 0;
        width: 36px; height: 36px; border-radius: 50%;
        background: #1565C0; color: white; border: 2px solid white;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .edit-logo-btn:hover { background: #0D47A1; }
    .edit-logo-btn .material-icons { font-size: 18px; }

    .header-info { padding-bottom: 10px; }
    .header-info h2 { margin: 0; font-size: 24px; color: #333; }
    .header-info p { margin: 4px 0 0; color: #666; font-size: 14px; }

    /* Form */
    .form-section { padding: 0 30px 40px; }
    .grid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; font-weight: 600; font-size: 13px; color: #555; margin-bottom: 6px; }
    .form-group input, .form-group textarea {
        width: 100%; box-sizing: border-box; padding: 12px;
        border: 1px solid #E0E0E0; border-radius: 8px;
        font-family: inherit; font-size: 14px;
    }
    .form-group input:focus, .form-group textarea:focus { border-color: #1565C0; outline: none; }

    .actions { margin-top: 20px; display: flex; justify-content: flex-end; }
    .save-btn { 
        padding: 14px 40px; background: #1565C0; color: white; border: none; border-radius: 8px; 
        font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .save-btn:disabled { background: #B0BEC5; cursor: not-allowed; }
  `]
})
export class AdminProfileComponent implements OnInit {
  auth = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  isLoading = true;
  isSaving = false;
  isUploading = false;
  business: any = null;

  ngOnInit() {
    this.fetchBusiness();
  }

  async fetchBusiness() {
    this.isLoading = true;
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      const { data, error } = await this.auth.client
        .from('negocios')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      this.business = data || {};

    } catch (e: any) {
      console.error(e);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  getBannerUrl(url: string): string {
    return url ? `url('${url}')` : 'none';
  }

  async uploadImage(event: any, type: 'logo' | 'portada') {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading = true;
    this.cdr.detectChanges();

    try {
      const fileExt = file.name.split('.').pop();
      // Mobile app uses 'logos/' and 'portadas/' prefixes inside 'negocios' bucket
      const fileName = `${type}s/${this.business.id}-${Date.now()}.${fileExt}`;
      const bucket = 'negocios';

      const { error: uploadError } = await this.auth.client
        .storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = this.auth.client
        .storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (type === 'logo') {
        this.business.logo_url = publicUrl;
      } else {
        this.business.portada_url = publicUrl;
      }

      await this.updateImageField(type === 'logo' ? 'logo_url' : 'portada_url', publicUrl);

    } catch (e: any) {
      console.error('Upload error:', e);
      alert('Error al subir imagen: ' + e.message);
    } finally {
      this.isUploading = false;
      this.cdr.detectChanges();
    }
  }

  async updateImageField(field: string, url: string) {
    if (!this.business.id) return;
    await this.auth.client
      .from('negocios')
      .update({ [field]: url })
      .eq('id', this.business.id);
  }

  async saveChanges() {
    if (!this.business) return;
    this.isSaving = true;

    try {
      const payload: any = {
        nombre: this.business.nombre,
        descripcion: this.business.descripcion,
        telefono: this.business.telefono,
        email_contacto: this.business.email_contacto, // Correct column mapping
        direccion: this.business.direccion,
        logo_url: this.business.logo_url,
        portada_url: this.business.portada_url
      };

      const { error } = await this.auth.client
        .from('negocios')
        .update(payload)
        .eq('id', this.business.id);

      if (error) throw error;
      alert('Perfil actualizado correctamente');

    } catch (e: any) {
      console.error(e);
      alert('Error al guardar: ' + e.message);
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }
}
