import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-landing-benefits',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './landing-benefits.component.html',
    styleUrls: ['./landing-benefits.component.css']
})
export class LandingBenefitsComponent {
    benefits = [
        { icon: 'bolt', title: 'Cotizaciones Flash', desc: 'Precios al instante. Sin llamadas eternas.' },
        { icon: 'calendar_today', title: 'Agenda Smart', desc: 'Organización automática de tus servicios.' },
        { icon: 'lock', title: 'Pagos Blindados', desc: 'Seguridad bancaria en cada transacción.' },
        { icon: 'visibility', title: 'Radar Local', desc: 'Clientes cerca de ti buscándote ahora.' },
        { icon: 'sentiment_very_satisfied', title: 'Cero Drama', desc: 'Menos estrés, más limpieza.' },
        { icon: 'rocket_launch', title: 'Despegue Rápido', desc: 'Empieza a vender en menos de 24 horas.', highlight: true },
    ];
}
