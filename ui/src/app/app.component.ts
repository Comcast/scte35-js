import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { SCTE35 } from 'scte35';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  scte35: SCTE35 = new SCTE35();
  title = 'SCTE35-JS PARSER DEMO (v0.5.0)';
  scte35format = 'Base64';
  formats: string[] = ['Base64', 'Hexadecimal'];
  scte35FormControl = new FormControl('', [
    Validators.required
  ]);
  parsedObject: unknown;
  rawObject: string = '';
  displayObject: unknown;
  raw = false;

  parse(): void {
    switch (this.scte35format) {
      case 'Base64':
        this.parsedObject = this.scte35.parseFromB64(this.scte35FormControl.value ?? "");
        break;
      case 'Hexadecimal':
        this.parsedObject = this.scte35.parseFromHex(this.scte35FormControl.value ?? "");
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
