import { Component } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { SCTE35 } from 'scte35';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.styl']
})

export class AppComponent {
  scte35: SCTE35 = new SCTE35();
  title = 'SCTE35-JS PARSER DEMO (v0.4.0)';
  scte35format = 'Base64';
  formats: string[] = ['Base64', 'Hexadecimal'];
  scte35FormControl = new FormControl('', [
    Validators.required
  ]);
  matcher = new MyErrorStateMatcher();
  parsedObject: unknown;
  rawObject: string;
  displayObject: unknown;
  raw = false;

  parse(): void {
    switch (this.scte35format) {
      case 'Base64':
        this.parsedObject = this.scte35.parseFromB64(this.scte35FormControl.value);
        break;
      case 'Hexadecimal':
        this.parsedObject = this.scte35.parseFromHex(this.scte35FormControl.value);
        break;
    }
    this.displayObject = this.parsedObject;
    this.rawObject = JSON.stringify(this.parsedObject);
  }

  viewRaw(): void {
    this.displayObject = this.rawObject;
    this.raw = true;

  }

  viewPretty(): void {
    this.displayObject = this.parsedObject;
    this.raw = false;
  }
}
