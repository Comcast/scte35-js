import { Component, OnInit } from '@angular/core';
import * as scte35 from 'scte35/build/lib/scte35';

@Component({
  selector: 'app-demo-page',
  templateUrl: './demo-page.component.html',
  styleUrls: ['./demo-page.component.scss']
})
export class DemoPageComponent implements OnInit {

  public payload = '';
  public parsedObject: any;
  public parsedObjectString: any;
  public showRawJson = false;

  constructor() { }

  ngOnInit() {
  }

  parsePayload() {
    this.showRawJson = false;
    this.parsedObject = scte35.SCTE35.parseFromB64(this.payload);
    this.parsedObjectString = JSON.stringify(this.parsedObject);
  }
}
