import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private counter = 0;
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    toasts$ = this.toastsSubject.asObservable();

    show(message: string, type: ToastType = 'info', duration = 3500) {
        const id = ++this.counter;
        const current = this.toastsSubject.getValue();
        this.toastsSubject.next([...current, { id, message, type }]);
        setTimeout(() => this.dismiss(id), duration);
    }

    success(msg: string) { this.show(msg, 'success'); }
    error(msg: string) { this.show(msg, 'error', 5000); }
    warning(msg: string) { this.show(msg, 'warning'); }
    info(msg: string) { this.show(msg, 'info'); }

    dismiss(id: number) {
        const current = this.toastsSubject.getValue();
        this.toastsSubject.next(current.filter(t => t.id !== id));
    }
}
