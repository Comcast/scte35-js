import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { Injectable } from '@angular/core';

@Injectable()
export class CustomIconService {
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {}
  init() {
    this.matIconRegistry.addSvgIcon(
      'cf',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../../assets/icons/custom/cf.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'github',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../../assets/icons/custom/github.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'jenkins',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../../assets/icons/custom/jenkins.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'slack',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../../assets/icons/custom/slack.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'splunk',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../../assets/icons/custom/splunk.svg')
    );
  }
}
