import { Component } from '@angular/core';
import { HeroComponent } from '../hero/hero';
import { HeaderComponent } from '../header/header';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, HeaderComponent],
  template: `
    <app-header></app-header>
    <app-hero></app-hero>
  `,
  styleUrls: []
})
export class HomeComponent {

}