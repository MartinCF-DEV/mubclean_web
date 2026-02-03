import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LandingNavbarComponent } from './components/landing-navbar/landing-navbar.component';
import { LandingHeroComponent } from './components/landing-hero/landing-hero.component';
import { LandingBenefitsComponent } from './components/landing-benefits/landing-benefits.component';
import { LandingHowItWorksComponent } from './components/landing-how-it-works/landing-how-it-works.component';
import { LandingSplitComponent } from './components/landing-split/landing-split.component';
import { LandingSecurityComponent } from './components/landing-security/landing-security.component';
import { LandingFooterComponent } from './components/landing-footer/landing-footer.component';

@Component({
    selector: 'app-landing-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        LandingNavbarComponent,
        LandingHeroComponent,
        LandingBenefitsComponent,
        LandingHowItWorksComponent,
        LandingSplitComponent,
        LandingSecurityComponent,
        LandingFooterComponent
    ],
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
    scrollToSection(sectionId: string) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Bound function to pass to child component

}
