import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../toast.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container">
        <div *ngFor="let t of toasts" class="toast" [ngClass]="'toast-' + t.type">
            <span class="toast-icon material-icons">{{ iconFor(t.type) }}</span>
            <span class="toast-msg">{{ t.message }}</span>
            <button class="toast-close" (click)="toastSvc.dismiss(t.id)">
                <span class="material-icons">close</span>
            </button>
        </div>
    </div>`,
    styles: [`
        .toast-container {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
            pointer-events: none;
        }
        .toast {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 20px;
            border-radius: 14px;
            font-size: 14px;
            font-weight: 600;
            font-family: 'Inter', sans-serif;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            min-width: 260px;
            max-width: 400px;
            pointer-events: all;
            animation: slideUp 0.25s ease;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .toast-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .toast-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .toast-warning { background: #fff7ed; color: #d97706; border: 1px solid #fed7aa; }
        .toast-info    { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .toast-icon { font-size: 20px; flex-shrink: 0; }
        .toast-msg  { flex: 1; line-height: 1.4; }
        .toast-close {
            background: none; border: none; cursor: pointer;
            color: inherit; opacity: 0.5; padding: 2px;
            display: flex; align-items: center;
        }
        .toast-close:hover { opacity: 1; }
        .toast-close .material-icons { font-size: 16px; }
    `]
})
export class ToastComponent implements OnInit, OnDestroy {
    toastSvc = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);
    toasts: Toast[] = [];
    private sub!: Subscription;

    ngOnInit() {
        this.sub = this.toastSvc.toasts$.subscribe(t => {
            this.toasts = t;
            this.cdr.markForCheck();
        });
    }
    ngOnDestroy() { this.sub.unsubscribe(); }

    iconFor(type: string): string {
        return { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' }[type] || 'info';
    }
}
