import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'customer',
        loadComponent: () => import('./customer-layout/customer-layout.component').then(m => m.CustomerLayoutComponent),
        children: [
            { path: 'home', loadComponent: () => import('./customer-dashboard/customer-dashboard.component').then(m => m.CustomerDashboardComponent) },
            { path: 'history', loadComponent: () => import('./customer-history/customer-history.component').then(m => m.CustomerHistoryComponent) },
            { path: 'support', loadComponent: () => import('./customer-support/customer-support.component').then(m => m.CustomerSupportComponent) },
            { path: 'profile', loadComponent: () => import('./customer-profile/customer-profile.component').then(m => m.CustomerProfileComponent) },
            { path: 'business/:id', loadComponent: () => import('./customer-business-profile/customer-business-profile.component').then(m => m.CustomerBusinessProfileComponent) },
            { path: 'request/:id', loadComponent: () => import('./customer-request-detail/customer-request-detail.component').then(m => m.CustomerRequestDetailComponent) },
            { path: '', redirectTo: 'home', pathMatch: 'full' }
        ]
    },
    {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'change-password',
        loadComponent: () => import('./change-password/change-password.component').then(m => m.ChangePasswordComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'reset-password',
        loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
    },
    {
        path: 'admin',
        loadComponent: () => import('./admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
            { path: 'dashboard', loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
            { path: 'request/:id', loadComponent: () => import('./admin-request-detail/admin-request-detail.component').then(m => m.AdminRequestDetailComponent) },
            { path: 'employees', loadComponent: () => import('./admin-employees/admin-employees.component').then(m => m.AdminEmployeesComponent) },
            { path: 'support', loadComponent: () => import('./admin-support/admin-support.component').then(m => m.AdminSupportComponent) },
            { path: 'profile', loadComponent: () => import('./admin-profile/admin-profile.component').then(m => m.AdminProfileComponent) },
            { path: 'register', loadComponent: () => import('./admin-registration/admin-registration.component').then(m => m.AdminRegistrationComponent) },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];
