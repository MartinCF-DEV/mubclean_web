import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-landing-how-it-works',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './landing-how-it-works.component.html',
    styleUrls: ['./landing-how-it-works.component.css']
})
export class LandingHowItWorksComponent {
    steps = [
        { num: '01', title: 'Registro Fácil', desc: 'Validamos tu empresa en récord' },
        { num: '02', title: 'Configura', desc: 'Define precios, horarios y zonas' },
        { num: '03', title: 'Recibe Pedidos', desc: 'Los clientes te encuentran solos' },
        { num: '04', title: 'Cobra Seguro', desc: 'Pagos directos a tu cuenta' }
    ];
}
