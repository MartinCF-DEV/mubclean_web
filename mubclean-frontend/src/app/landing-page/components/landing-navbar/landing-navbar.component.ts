import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-landing-navbar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './landing-navbar.component.html',
    styleUrls: ['./landing-navbar.component.css']
})
export class LandingNavbarComponent {
    @Output() scrollTo = new EventEmitter<string>();

    onScroll(section: string) {
        this.scrollTo.emit(section);
    }
}
