import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { HomeComponent } from './components/home/home';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';
import { ClientDashboardComponent } from './pages/client/client-dashboard.component';
import { NannyDashboardComponent } from './pages/nanny/nanny-dashboard.component';
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
    path: '**',
    redirectTo: ''
  }
];
