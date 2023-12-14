import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('should create the app', () => {
    const app = new AppComponent();
    expect(app).toBeTruthy();
  });
  it(`should have as title 'SCTE35-JS PARSER DEMO (v0.6.0)'`, () => {
    const app = new AppComponent();
    expect(app.title).toEqual('SCTE35-JS PARSER DEMO (v0.6.0)');
  });
});
