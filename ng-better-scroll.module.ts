import { NgModule, ModuleWithProviders } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  BetterScrollComponent,
  BETTER_SCROLL_CONFIG
} from "./better-scroll/better-scroll.component";
import { ObserversModule } from "@angular/cdk/observers";
@NgModule({
  imports: [CommonModule, ObserversModule],
  declarations: [BetterScrollComponent],
  exports: [BetterScrollComponent]
})
export class NgBetterScrollModule {
  public static forRoot(cfg: any): ModuleWithProviders {
    return {
      ngModule: NgBetterScrollModule,
      providers: []
    };
  }
}
