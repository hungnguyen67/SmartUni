import { Component, OnInit, OnDestroy, ChangeDetectorRef, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, BehaviorSubject } from 'rxjs';

export interface FlashMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp?: number;
}

@Injectable({ providedIn: 'root' })
export class FlashMessageService {
  private messagesSubject = new BehaviorSubject<FlashMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private labels = {
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',
    info: 'Thông tin'
  };

  showMessage(type: 'success' | 'error' | 'warning' | 'info', message: string, duration: number = 1000): void {
    const newMessage: FlashMessage = {
      type,
      title: this.labels[type],
      message,
      duration,
      timestamp: Date.now()
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, newMessage]);

    setTimeout(() => {
      this.removeMessage(newMessage);
    }, duration);
  }

  removeMessage(message: FlashMessage): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next(currentMessages.filter(m => m !== message));
  }

  clearAll(): void {
    this.messagesSubject.next([]);
  }

  success(msg: string) { this.showMessage('success', msg, 2000); }
  error(msg: string) { this.showMessage('error', msg, 2000); }
  warning(msg: string) { this.showMessage('warning', msg, 2000); }
  info(msg: string) { this.showMessage('info', msg, 2000); }

  handleSuccess(res: any) {
    this.success(res?.message || 'Thao tác thành công!');
  }

  handleError(err: any) {
    this.error(err?.error?.message || err?.message || 'Có lỗi xảy ra!');
  }
}

@Component({
  selector: 'app-flash-message',
  templateUrl: './flash-message.component.html',
})
export class FlashMessageComponent implements OnInit, OnDestroy {
  messages: FlashMessage[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private flashMessageService: FlashMessageService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.subscription = this.flashMessageService.messages$.subscribe(
      msgs => {
        this.messages = msgs;
        this.cdr.detectChanges();
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  removeMessage(message: FlashMessage): void {
    this.flashMessageService.removeMessage(message);
  }

  trackByFn(index: number, item: FlashMessage): any {
    return item.timestamp || index;
  }
}