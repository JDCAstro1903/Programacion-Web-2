import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { HomeComponent } from './components/home/home';
import { UserSelectionComponent } from './components/user-selection/user-selection.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';
import { ClientDashboardComponent } from './pages/client/client-dashboard.component';
import { NannyDashboardComponent } from './pages/nanny/nanny-dashboard.component';

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
    path: 'user-selection',
    component: UserSelectionComponent
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent
  },
  {
    path: 'client/dashboard',
    component: ClientDashboardComponent
  },
  {
    path: 'nanny/dashboard',
    component: NannyDashboardComponent
  }
];
