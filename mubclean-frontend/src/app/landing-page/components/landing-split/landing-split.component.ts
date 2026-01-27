import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-landing-split',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './landing-split.component.html',
    styleUrls: ['./landing-split.component.css']
})
export class LandingSplitComponent {
    @Input() type: 'provider' | 'client' = 'provider';
    @Input() title = '';
    @Input() text = '';
    @Input() imagePath = '';
    @Input() btnText = '';
    @Input() btnLink = '';
    @Input() btnAction: (() => void) | null = null;

    handleAction() {
        if (this.btnAction) {
            this.btnAction();
        }
    }
}
