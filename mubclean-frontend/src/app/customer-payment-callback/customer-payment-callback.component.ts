import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-customer-payment-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="card" *ngIf="status === 'success'">
        <div class="icon-circle success">
          <span class="material-icons">check</span>
        </div>
        <h2>¡Pago Confirmado!</h2>
        <p>Tu servicio ha sido pagado con éxito. El técnico asignado ha sido notificado con todos los detalles.</p>
        <div class="spinner" *ngIf="processing"></div>
      </div>

      <div class="card" *ngIf="status === 'failure'">
        <div class="icon-circle failure">
          <span class="material-icons">close</span>
        </div>
        <h2>Pago Rechazado</h2>
        <p>Tuvimos un problema procesando tu pago.</p>
        <button class="btn" (click)="goToHistory()">Volver a mis servicios</button>
      </div>

      <div class="card" *ngIf="status === 'pending'">
        <div class="icon-circle pending">
          <span class="material-icons">schedule</span>
        </div>
        <h2>Pago Pendiente</h2>
        <p>Estamos procesando tu pago...</p>
        <button class="btn" (click)="goToHistory()">Volver a mis servicios</button>
      </div>
    </div>
  `,
  styles: [`
    .callback-container { display: flex; align-items: center; justify-content: center; height: 100vh; background: #F8FAFC; }
    .card { background: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.05); max-width: 400px; width: 90%; }
    .icon-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; }
    .success { background: #D1FAE5; color: #059669; }
    .failure { background: #FEE2E2; color: #DC2626; }
    .pending { background: #FEF3C7; color: #D97706; }
    h2 { font-family: 'Fraunces', serif; color: #0F172A; margin: 0 0 10px; font-size: 24px; }
    p { color: #64748B; margin-bottom: 20px; font-size: 15px; }
    .btn { background: #1565C0; color: white; padding: 12px 24px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; }
    .btn:hover { background: #1E40AF; }
    .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #1565C0; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class CustomerPaymentCallbackComponent implements OnInit {
  status: 'success' | 'failure' | 'pending' = 'pending';
  processing = true;
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.status = params.get('status') as any;
      if (this.status === 'success' || this.status === 'pending') {
        this.confirmPayment();
      } else {
        this.processing = false;
      }
    });
  }

  async confirmPayment() {
    const paymentId = this.route.snapshot.queryParamMap.get('payment_id');
    const solicitudId = this.route.snapshot.queryParamMap.get('external_reference');

    if (solicitudId) {
      try {
        await this.auth.client
          .from('solicitudes')
          .update({ metodo_pago: 'tarjeta' })
          .eq('id', solicitudId);

        // Disparador: Notificar al técnico
        await this.triggerTechNotification(solicitudId);

      } catch (e) {
        console.error('Error confirming payment:', e);
      }
    }
    
    setTimeout(() => {
      this.processing = false;
      this.router.navigate(['/customer/history']);
    }, 3000);
  }

  async triggerTechNotification(solicitudId: string) {
    // 1. Fetch full details for the professional message
    const { data: request } = await this.auth.client
      .from('solicitudes')
      .select('*, cliente:cliente_id(nombre_completo, telefono), tecnico:tecnico_asignado_id(perfiles(nombre_completo))')
      .eq('id', solicitudId)
      .single();

    if (!request || !request.tecnico_asignado_id) return;

    // 2. Fetch items (limpiezas)
    const { data: items } = await this.auth.client
      .from('items_solicitud')
      .select('*, servicios_catalogo(nombre)')
      .eq('solicitud_id', solicitudId);

    let cleaningDetails = (items || []).map((i: any) => `- ${i.cantidad}x ${i.servicios_catalogo?.nombre} (${i.descripcion_item || 'Sin obs'})`).join('\n');

    const message = 
`NUEVA ASIGNACIÓN CONFIRMADA 🟢
----------------------------------------
Técnico: ${request.tecnico?.perfiles?.nombre_completo}
Fecha: ${new Date(request.fecha_solicitada_cliente || request.fecha_solicitada || '').toLocaleDateString('es-ES', { dateStyle: 'full' })}
Hora: ${new Date(request.fecha_solicitada_cliente || request.fecha_solicitada || '').toLocaleTimeString('es-ES', { timeStyle: 'short' })}

📍 DIRECCIÓN
${request.direccion_servicio || request.direccion}
Referencias: ${request.referencias_direccion || 'No especificadas'}
Cliente: ${request.cliente?.nombre_completo} (Tel: ${request.cliente?.telefono || 'N/A'})

🧹 DETALLE DEL SERVICIO
${cleaningDetails}

💰 MÉTODO DE PAGO
${request.metodo_pago === 'efectivo' ? 'EFECTIVO (COBRAR AL CLIENTE)' : 'PAGADO POR TARJETA (NO COBRAR)'}
Total: $${request.precio_total}`;

    // 3. Save to Tech Notifications table (simulating SMS/WhatsApp/Push)
    await this.auth.client.from('notificaciones_tecnico').insert({
      negocio_id: request.negocio_id,
      tecnico_id: request.tecnico_asignado_id,
      solicitud_id: solicitudId,
      tipo: 'asignacion',
      mensaje: message,
      tecnico_nombre: request.tecnico?.perfiles?.nombre_completo,
      leida: false
    });

    console.log('✅ Disparador ejecutado. Información enviada al técnico:');
    console.log(message);
  }

  goToHistory() {
    this.router.navigate(['/customer/history']);
  }
}
