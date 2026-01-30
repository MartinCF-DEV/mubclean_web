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
    openClientAppBound = () => {
        this.openClientApp();
    }

    openClientApp() {
        // Path to the APK file in assets
        const apkUrl = 'assets/mubclean-client.apk';

        // Create a temporary anchor element to trigger the download
        const link = document.createElement('a');
        link.href = apkUrl;
        link.download = 'mubclean-client.apk';
        link.target = '_blank'; // Optional, but good practice

        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
