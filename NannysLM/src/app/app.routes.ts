import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { HomeComponent } from './components/home/home';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';
import { ClientDashboardComponent } from './pages/client/client-dashboard.component';
import { NannyDashboardComponent } from './pages/nanny/nanny-dashboard.component';
import { ServiceDetailsComponent } from './pages/nanny/service-details.component';
import { ProfileViewComponent } from './pages/profile-view/profile-view.component';
import { CompleteClientProfileComponent } from './components/complete-client-profile/complete-client-profile.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register', 
    component: RegisterComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  {
    path: 'dashboard/admin',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/client',
    component: ClientDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'client' }
  },
  {
    path: 'dashboard/nanny',
    component: NannyDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'nanny' }
  },
  {
    path: 'complete-client-profile',
    component: CompleteClientProfileComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'client' }
  },
  {
    path: 'profile',
    component: ProfileViewComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'client/dashboard',
    redirectTo: 'dashboard/client'
  },
  {
    path: 'nanny/dashboard',
    redirectTo: 'dashboard/nanny'
  },
  {
    path: 'nanny/service-details/:serviceId',
    component: ServiceDetailsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'nanny' }
  },
  {
    path: 'admin/dashboard',
    redirectTo: 'dashboard/admin'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
