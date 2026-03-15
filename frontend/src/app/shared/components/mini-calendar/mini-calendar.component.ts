import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-mini-calendar',
    templateUrl: './mini-calendar.component.html'
})
export class MiniCalendarComponent implements OnInit {
    @Output() dateSelected = new EventEmitter<Date>();

    currentDate = new Date();
    selectedDate = new Date();
    displayDate = new Date();
    days: number[] = [];
    weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'Cn'];
    monthYearString = '';

    ngOnInit(): void {
        this.generateCalendar();
    }

    onDateClick(day: number, index: number): void {
        if (!this.isCurrentMonth(index)) return;

        this.selectedDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth(), day);
        this.dateSelected.emit(this.selectedDate);
    }

    isSelected(day: number, index: number): boolean {
        return this.isCurrentMonth(index) &&
            day === this.selectedDate.getDate() &&
            this.displayDate.getMonth() === this.selectedDate.getMonth() &&
            this.displayDate.getFullYear() === this.selectedDate.getFullYear();
    }

    generateCalendar(): void {
        const year = this.displayDate.getFullYear();
        const month = this.displayDate.getMonth();

        this.monthYearString = `Tháng ${month + 1}-${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        // Adjust for Monday start (T2)
        const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        this.days = [];

        // Previous month's days
        for (let i = startDay - 1; i >= 0; i--) {
            this.days.push(prevMonthDays - i);
        }

        // Current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            this.days.push(i);
        }

        // Next month's days to fill the grid (usually 42 cells)
        const remaining = 42 - this.days.length;
        for (let i = 1; i <= remaining; i++) {
            this.days.push(i);
        }
    }

    previousMonth(): void {
        this.displayDate.setMonth(this.displayDate.getMonth() - 1);
        this.generateCalendar();
    }

    nextMonth(): void {
        this.displayDate.setMonth(this.displayDate.getMonth() + 1);
        this.generateCalendar();
    }

    isToday(day: number): boolean {
        const now = new Date();
        return day === now.getDate() &&
            this.displayDate.getMonth() === now.getMonth() &&
            this.displayDate.getFullYear() === now.getFullYear();
    }

    isCurrentMonth(index: number): boolean {
        // This is a simple approximation for the 42-cell grid
        const year = this.displayDate.getFullYear();
        const month = this.displayDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        return index >= startDay && index < (startDay + daysInMonth);
    }
}
