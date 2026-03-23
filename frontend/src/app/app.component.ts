import { Component } from '@angular/core';
import { WebSocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(private webSocketService: WebSocketService) {}
  title = 'SmartUni';
}