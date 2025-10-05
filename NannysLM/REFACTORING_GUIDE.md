/* 
GUÍA DE REFACTORIZACIÓN COMPLETADA
=====================================

## ¿Qué hemos creado?

### 1. Componentes Reutilizables:
- **LogoutModalComponent**: Modal de cierre de sesión que funciona para todos los tipos de usuario
- **SidebarComponent**: Sidebar configurable con diferentes temas según el tipo de usuario

### 2. Servicios de Configuración:
- **UserConfigService**: Servicio que maneja la configuración específica para cada tipo de usuario (admin, client, nanny)

### 3. Estilos Globales:
- **_variables.css**: Variables CSS globales para colores, espaciado, sombras, etc.
- **_components.css**: Componentes de UI reutilizables (botones, cards, badges, etc.)
- **index.css**: Archivo principal que importa todos los estilos

## ¿Cómo usar estos componentes en otros dashboards?

### Para el Dashboard de Cliente:

```typescript
// client-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { LogoutModalComponent } from '../../shared/components/logout-modal/logout-modal.component';
import { UserConfigService } from '../../shared/services/user-config.service';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [SidebarComponent, LogoutModalComponent],
  template: `
    <div class="layout">
      <app-sidebar 
        [config]="sidebarConfig" 
        [currentView]="currentView"
        (onViewChange)="onViewChange($event)"
        (onLogoutClick)="openLogoutModal()">
      </app-sidebar>
      
      <main class="main-content">
        <!-- Contenido específico del cliente -->
      </main>
      
      <app-logout-modal 
        [isVisible]="showLogoutModal"
        [userName]="currentUser.name"
        [userRole]="currentUser.role"
        (onCancel)="closeLogoutModal()"
        (onConfirm)="confirmLogout()">
      </app-logout-modal>
    </div>
  `
})
export class ClientDashboardComponent implements OnInit {
  currentView = 'dashboard';
  sidebarConfig = this.userConfigService.getSidebarConfig('client');
  showLogoutModal = false;
  
  constructor(private userConfigService: UserConfigService) {}
  
  onViewChange(view: string) { this.currentView = view; }
  openLogoutModal() { this.showLogoutModal = true; }
  closeLogoutModal() { this.showLogoutModal = false; }
  confirmLogout() { /* lógica de logout */ }
}
```

### Para el Dashboard de Nanny:

```typescript
// nanny-dashboard.component.ts
export class NannyDashboardComponent implements OnInit {
  sidebarConfig = this.userConfigService.getSidebarConfig('nanny');
  // ... resto igual que el ejemplo anterior pero con 'nanny'
}
```

## ¿Cómo usar los estilos globales?

### En cualquier componente CSS:

```css
/* Importar variables en tu componente */
@import '../../shared/styles/_variables.css';

.mi-boton {
  background: var(--primary-gradient);
  color: white;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

.mi-card {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-xl);
}
```

### Usando clases utilitarias:

```html
<!-- En cualquier template HTML -->
<div class="card hover-lift">
  <button class="btn btn-primary">Acción Principal</button>
  <span class="badge badge-success">Activo</span>
</div>

<div class="filter-tabs">
  <div class="filter-tab active success">Verificados</div>
  <div class="filter-tab">Sin verificar</div>
</div>
```

## Ventajas de esta refactorización:

✅ **DRY (Don't Repeat Yourself)**: No más código duplicado
✅ **Mantenibilidad**: Cambios en un solo lugar afectan toda la app
✅ **Consistencia**: Mismos estilos y comportamientos en toda la app
✅ **Escalabilidad**: Fácil agregar nuevos tipos de usuario
✅ **Temas**: Diferentes colores automáticos por tipo de usuario
✅ **Reutilización**: Componentes que funcionan en cualquier parte

## Configuraciones por tipo de usuario:

### ADMIN (Rosa/Azul):
- Color primario: #E31B7E (rosa)
- Color secundario: #049BD7 (azul)
- Funciones: Dashboard, Nannys, Clientes, Pagos, Analíticas, Configuración

### CLIENT (Azul):
- Color primario: #3b82f6 (azul)
- Funciones: Inicio, Buscar Nannys, Favoritas, Reservas, Historial, Mi Perfil

### NANNY (Verde):
- Color primario: #10b981 (verde)
- Funciones: Mi Dashboard, Disponibilidad, Reservas, Mis Clientes, Ganancias, Mi Perfil

## Próximos pasos sugeridos:

1. Crear los dashboards de cliente y nanny usando estos componentes
2. Agregar más componentes reutilizables (header, footer, notifications)
3. Implementar un sistema de temas dinámico
4. Crear más utilidades CSS según necesidades
5. Agregar tests unitarios para los componentes compartidos

*/