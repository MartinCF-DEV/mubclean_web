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
        // Attempt to open the app via custom scheme
        // You should configure this scheme in your mobile app (e.g. mubclean://)
        const appScheme = 'mubclean://home';

        // ... rest of logic


        // Fallback URLs (Play Store / App Store)
        const androidStore = 'https://play.google.com/store/apps/details?id=com.mubclean.client';
        const iosStore = 'https://apps.apple.com/app/id123456789'; // Placeholder

        // Try to open the app
        window.location.href = appScheme;

        // Fallback if app is not installed (detect if we are still on the page)
        setTimeout(() => {
            // Check if page is hidden (app opened) or not
            if (!document.hidden) {
                // Determine OS to redirect to correct store
                const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

                if (/android/i.test(userAgent)) {
                    window.location.href = androidStore;
                } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
                    window.location.href = iosStore;
                } else {
                    // Desktop or unknown -> Redirect to a page explaining the app or generic store
                    alert("La aplicación móvil está disponible para iOS y Android.");
                }
            }
        }, 1500); // Wait 1.5s to see if app launched
    }
}
