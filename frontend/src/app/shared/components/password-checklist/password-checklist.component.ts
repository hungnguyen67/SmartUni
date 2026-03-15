import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-checklist',
  templateUrl: './password-checklist.component.html'
})
export class PasswordChecklistComponent implements OnChanges {
  @Input() password: string = '';

  lengthCheck = false;
  lowercaseCheck = false;
  uppercaseCheck = false;
  numberCheck = false;
  specialCheck = false;
  spacesCheck = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      this.checkPassword();
    }
  }

  private checkPassword(): void {
    const pwd = this.password;
    this.lengthCheck = pwd.length >= 8;
    this.lowercaseCheck = /[a-z]/.test(pwd);
    this.uppercaseCheck = /[A-Z]/.test(pwd);
    this.numberCheck = /\d/.test(pwd);
    this.specialCheck = /[@$!%*?&]/.test(pwd);
    this.spacesCheck = !/\s/.test(pwd);
  }
}