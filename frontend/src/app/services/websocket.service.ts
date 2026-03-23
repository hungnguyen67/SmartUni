import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { RegistrationService } from './registration.service';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private stompClient: Client;
    private serverUrl = 'http://localhost:8001/ws';

    constructor(private registrationService: RegistrationService) {
        this.stompClient = new Client({
            webSocketFactory: () => new SockJS(this.serverUrl),
            debug: (str) => {
                // console.log(str); 
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.stompClient.onConnect = (frame) => {
            console.log('Connected to WebSocket server (STOMP)');
            
            this.stompClient.subscribe('/topic/enrollment-updates', (message: Message) => {
                if (message.body) {
                    console.log('Real-time Enrollment Update:', message.body);
                    this.registrationService.notifyUpdate();
                }
            });
        };

        this.stompClient.onStompError = (frame) => {
            console.error('STOMP error:', frame.headers['message']);
            console.error('Additional info:', frame.body);
        };

        this.stompClient.activate();
    }

    send(topic: string, message: any) {
        if (this.stompClient.connected) {
            this.stompClient.publish({
                destination: topic,
                body: JSON.stringify(message)
            });
        }
    }
}
