import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-admin-payment-callback',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="payment-callback-container">
      <div class="card" *ngIf="status === 'success'">
        <div class="icon-circle success">
          <i class="fas fa-check"></i>
        </div>
        <h2>¡Pago Exitoso!</h2>
        <p>Tu licencia ha sido activada correctamente.</p>
        <p>Estamos configurando tu panel...</p>
        <div class="spinner"></div>
      </div>

      <div class="card" *ngIf="status === 'failure'">
        <div class="icon-circle failure">
          <i class="fas fa-times"></i>
        </div>
        <h2>Pago Fallido</h2>
        <p>Hubo un problema al procesar tu pago.</p>
        <button (click)="retryPayment()" class="btn-retry">Intentar Nuevamente</button>
      </div>

      <div class="card" *ngIf="status === 'pending'">
        <div class="icon-circle pending">
          <i class="fas fa-clock"></i>
        </div>
        <h2>Pago Pendiente</h2>
        <p>Tu pago está siendo procesado.</p>
        <button (click)="goToDashboard()" class="btn-dashboard">Ir al Dashboard (Restringido)</button>
      </div>
    </div>
  `,
    styles: [`
    .payment-callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f4f6f9;
      font-family: 'Inter', sans-serif;
    }
    .card {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
      width: 90%;
    }
    .icon-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin: 0 auto 1.5rem;
    }
    .success { background-color: #d1fae5; color: #059669; }
    .failure { background-color: #fee2e2; color: #dc2626; }
    .pending { background-color: #fef3c7; color: #d97706; }
    
    h2 { color: #1f2937; margin-bottom: 0.5rem; }
    p { color: #6b7280; margin-bottom: 1.5rem; }
    
    button {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      border: none;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-retry { background-color: #dc2626; color: white; }
    .btn-dashboard { background-color: #4f46e5; color: white; }
    
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class AdminPaymentCallbackComponent implements OnInit {
    status: 'success' | 'failure' | 'pending' = 'pending';
    private http = inject(HttpClient);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.status = params.get('status') as any;
            if (this.status === 'success') {
                this.confirmPayment();
            }
        });
    }

    confirmPayment() {
        const paymentId = this.route.snapshot.queryParamMap.get('payment_id');
        const externalReference = this.route.snapshot.queryParamMap.get('external_reference'); // business_id

        if (paymentId && externalReference) {
            // Call backend to confirm
            // Assuming backend is on port 3000 for local dev, replace with environment.apiUrl if available
            const apiUrl = 'http://localhost:3000/api/confirm_license_payment';

            this.http.post(apiUrl, { paymentId, businessId: externalReference })
                .subscribe({
                    next: () => {
                        setTimeout(() => {
                            this.router.navigate(['/admin/dashboard']);
                        }, 2000);
                    },
                    error: (err) => {
                        console.error('Verification failed', err);
                        // Even if verification call fails, if MP says success, we might want to let them in or show error
                        // For now, redirect anyway or stay showing error? 
                        // Let's stay and show error details if needed, but for MVP:
                        alert('Hubo un error verificando tu pago. Contacta a soporte.');
                    }
                });
        }
    }

    retryPayment() {
        this.router.navigate(['/admin/register']);
    }

    goToDashboard() {
        this.router.navigate(['/admin/dashboard']);
    }
}
