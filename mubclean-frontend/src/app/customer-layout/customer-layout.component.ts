import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-customer-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="layout-container">
      <div class="content-area">
        <router-outlet></router-outlet>
      </div>
      
      <nav class="bottom-nav">
        <a routerLink="/customer/home" routerLinkActive="active" class="nav-item">
          <span class="material-icons">home</span>
          <span class="label">Inicio</span>
        </a>
        <a routerLink="/customer/history" routerLinkActive="active" class="nav-item">
          <span class="material-icons">history</span>
          <span class="label">Historial</span>
        </a>
        <a routerLink="/customer/support" routerLinkActive="active" class="nav-item">
          <span class="material-icons">help_outline</span>
          <span class="label">Ayuda</span>
        </a>
        <a routerLink="/customer/profile" routerLinkActive="active" class="nav-item">
          <span class="material-icons">person</span>
          <span class="label">Perfil</span>
        </a>
      </nav>
    </div>
  `,
    styles: [`
    .layout-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: #F5F9FF;
    }

    .content-area {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 70px; /* Space for bottom nav */
    }

    .bottom-nav {
      position: fixed;
      bottom: 0;
      width: 100%;
      height: 60px;
      background-color: black;
      display: flex;
      justify-content: space-around;
      align-items: center;
      z-index: 1000;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: grey;
      text-decoration: none;
      font-size: 10px;
      background: none;
      border: none;
      cursor: pointer;
    }

    .nav-item .material-icons {
      font-size: 24px;
      margin-bottom: 2px;
    }

    .nav-item.active {
      color: white;
    }
  `]
})
export class CustomerLayoutComponent { }
