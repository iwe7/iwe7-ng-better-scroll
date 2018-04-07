### [better-scroll](https://github.com/ustbhuangyi/better-scroll) 是什么

> better-scroll 是一款重点解决移动端（已支持 PC）各种滚动场景需求的插件。它的核心是借鉴的 iscroll 的实现，它的 API 设计基本兼容 iscroll，在 iscroll 的基础上又扩展了一些 feature 以及做了一些性能优化。
> better-scroll 是基于原生 JS 实现的，不依赖任何框架。它编译后的代码大小是 63kb，压缩后是 35kb，gzip 后仅有 9kb，是一款非常轻量的 JS lib。

### [github 源码](https://github.com/iwe7/iwe7-ng-better-scroll)

### 安装

```sh
yarn add iwe7-ng-better-scroll
```

### api

* 请参考[better-scroll api](https://ustbhuangyi.github.io/better-scroll/doc/zh-hans/)

### 使用

```ts
import {
  NgBetterScrollModule,
  BetterScrollConfigDefault
} from "iwe7-ng-better-scroll";

@NgModule({
  imports: [
    ...
    NgBetterScrollModule.forRoot(BetterScrollConfigDefault)
    ...
  ]
})
export class AppModule {}
```

### 在模板中使用

```
<better-scroll (onPullingDown)="init($event)"
  (onPullingUp)="loadMore($event)">
  <ul>
    <li *ngFor="let item of list">
      {{item}}
    </li>
  </ul>
</better-scroll>
```

```ts
import {
  Component,
  OnInit,
  ElementRef,
  InjectionToken,
  Inject,
  AfterViewInit,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  Output,
  OnDestroy
} from "@angular/core";
// import BScroll from "better-scroll";
// 为了兼容才这样写
import * as _better_scroll from "better-scroll";
const BScroll = (_better_scroll as any).default || _better_scroll;

export const BETTER_SCROLL_CONFIG = new InjectionToken("BETTER_SCROLL_CONFIG");
import { CdkObserveContent } from "@angular/cdk/observers";

export const BetterScrollConfigDefault = {
  startX: 0,
  startY: 0,
  scrollX: false,
  scrollY: true,
  freeScroll: false,
  directionLockThreshold: 5,
  eventPassthrough: "",
  click: false,
  tap: false,
  bounce: true,
  bounceTime: 800,
  momentum: true,
  momentumLimitTime: 300,
  momentumLimitDistance: 15,
  swipeTime: 2500,
  swipeBounceTime: 500,
  deceleration: 0.001,
  flickLimitTime: 200,
  flickLimitDistance: 100,
  resizePolling: 60,
  probeType: 0,
  preventDefault: true,
  preventDefaultException: {
    tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/
  },
  HWCompositing: true,
  useTransition: true,
  useTransform: true,
  bindToWrapper: false,
  observeDOM: true,
  autoBlur: true,
  wheel: false,
  snap: false,
  scrollbar: false,
  pullDownRefresh: {
    threshold: 50,
    stop: 20
  },
  pullUpLoad: { threshold: 50 },
  mouseWheel: {
    speed: 20,
    invert: false
  },
  stopPropagation: false
};

export interface BetterScrollWhellInterface {
  selectedIndex: number;
  rotate: number;
  adjustTime: number;
  wheelWrapperClass: string;
  wheelItemClass: string;
}

export interface BetterScrollEasingInterface {
  style: string;
  fn: Function;
}

export interface BetterScrollSnapInterface {
  loop: boolean;
  threshold: number;
  stepX: number;
  stepY: number;
  easing: BetterScrollEasingInterface;
}

export interface BetterScrollScrollbarInterface {
  fade: boolean;
  interactive: boolean;
}

export interface BetterScrollPullDownRefreshInterface {
  threshold: number;
  stop: number;
}

export interface BetterScrollPullUpLoadInterface {
  threshold: number;
}

export interface BetterScrollMouseWheelInterface {
  speed: number;
  invert: boolean;
}

@Component({
  selector: "better-scroll",
  templateUrl: "./better-scroll.component.html",
  styleUrls: ["./better-scroll.component.scss"]
})
export class BetterScrollComponent implements OnInit, OnChanges, OnDestroy {
  scroll: any;
  // 配置选项
  // 横轴方向初始化位置。
  @Input() startX: number = 0;
  // 纵轴方向初始化位置
  @Input() startY: number = 0;
  // 当设置为 true 的时候，可以开启横向滚动
  @Input() scrollX: boolean = false;
  // 当设置为 true 的时候，可以开启纵向滚动
  @Input() scrollY: boolean = true;
  // 有些场景我们需要支持横向和纵向同时滚动，而不仅限制在某个方向，这个时候我们只要设置 freeScroll 为 true 即可
  @Input() freeScroll: boolean = false;
  // 当我们需要锁定只滚动一个方向的时候，我们在初始滚动的时候根据横轴和纵轴滚动的绝对值做差，当差值大于 directionLockThreshold 的时候来决定滚动锁定的方向。
  @Input() directionLockThreshold: number = 5;
  // 有时候我们使用 better-scroll 在某个方向模拟滚动的时候，希望在另一个方向保留原生的滚动（比如轮播图，我们希望横向模拟横向滚动，而纵向的滚动还是保留原生滚动，我们可以设置 eventPassthrough 为 vertical；相应的，如果我们希望保留横向的原生滚动，可以设置eventPassthrough为 horizontal）
  @Input() eventPassthrough: string = "";
  // better-scroll 默认会阻止浏览器的原生 click 事件。当设置为 true，better-scroll 会派发一个 click 事件，我们会给派发的 event 参数加一个私有属性 _constructed，值为 true。
  @Input() click: boolean = false;
  // 因为 better-scroll 会阻止原生的 click 事件，我们可以设置 tap 为 true，它会在区域被点击的时候派发一个 tap 事件，你可以像监听原生事件那样去监听它，如 element.addEventListener('tap', doSomething, false);。如果 tap 设置为字符串, 那么这个字符串就作为自定义事件名称。如 tap: 'myCustomTapEvent'。
  @Input() tap: boolean = false;
  // 当滚动超过边缘的时候会有一小段回弹动画。设置为 true 则开启动画。
  @Input() bounce: boolean = true;
  // 设置回弹动画的动画时长。
  @Input() bounceTime: number = 800;
  // 当快速在屏幕上滑动一段距离的时候，会根据滑动的距离和时间计算出动量，并生成滚动动画。设置为 true 则开启动画。
  @Input() momentum: boolean = true;
  // 只有在屏幕上快速滑动的时间小于 momentumLimitTime，才能开启 momentum 动画
  @Input() momentumLimitTime: number = 300;
  // 只有在屏幕上快速滑动的距离大于 momentumLimitDistance，才能开启 momentum 动画。
  @Input() momentumLimitDistance: number = 15;
  // 设置 momentum 动画的动画时长。
  @Input() swipeTime: number = 2500;
  // 设置当运行 momentum 动画时，超过边缘后的回弹整个动画时间
  @Input() swipeBounceTime: number = 500;
  // 表示 momentum 动画的减速度。
  @Input() deceleration: number = 0.001;
  // 有的时候我们要捕获用户的轻拂动作（短时间滑动一个较短的距离）。只有用户在屏幕上滑动的时间小于 flickLimitTime ，才算一次轻拂。
  @Input() flickLimitTime: number = 200;
  // 只有用户在屏幕上滑动的距离小于 flickLimitDistance ，才算一次轻拂。
  @Input() flickLimitDistance: number = 100;
  // 当窗口的尺寸改变的时候，需要对 better-scroll 做重新计算，为了优化性能，我们对重新计算做了延时。60ms 是一个比较合理的值。
  @Input() resizePolling: number = 60;
  // 有时候我们需要知道滚动的位置。当 probeType 为 1 的时候，会非实时（屏幕滑动超过一定时间后）派发scroll 事件；当 probeType 为 2 的时候，会在屏幕滑动的过程中实时的派发 scroll 事件；当 probeType 为 3 的时候，不仅在屏幕滑动的过程中，而且在 momentum 滚动动画运行过程中实时派发 scroll 事件。如果没有设置该值，其默认值为 0，即不派发 scroll 事件。
  @Input() probeType: number = 0;
  // 当事件派发后是否阻止浏览器默认行为。这个值应该设为 true，除非你真的知道你在做什么，通常你可能用到的是 preventDefaultException。
  @Input() preventDefault: boolean = true;
  // better-scroll 的实现会阻止原生的滚动，这样也同时阻止了一些原生组件的默认行为。这个时候我们不能对这些元素做 preventDefault，所以我们可以配置 preventDefaultException。默认值 {tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/}表示标签名为 input、textarea、button、select 这些元素的默认行为都不会被阻止。
  @Input()
  preventDefaultException: any = {
    tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/
  };
  // 是否开启硬件加速，开启它会在 scroller 上添加 translateZ(0) 来开启硬件加速从而提升动画性能，有很好的滚动效果。
  @Input() HWCompositing: boolean = true;
  // 是否使用 CSS3 transition 动画。如果设置为 false，则使用 requestAnimationFrame 做动画。
  @Input() useTransition: boolean = true;
  // 是否使用 CSS3 transform 做位移。如果设置为 false, 则设置元素的 top/left (这种情况需要 scroller 是绝对定位的)。
  @Input() useTransform: boolean = true;
  // move 事件通常会绑定到 document 上而不是滚动的容器上，当移动的过程中光标或手指离开滚动的容器滚动仍然会继续，这通常是期望的。当然你也可以把 move 事件绑定到滚动的容器上，bindToWrapper 设置为 true 即可，这样一旦移动的过程中光标或手指离开滚动的容器，滚动会立刻停止。
  @Input() bindToWrapper: boolean = false;
  // 当在移动端环境（支持 touch 事件），disableMouse 会计算为 true，这样就不会监听鼠标相关的事件，而在 PC 环境，disableMouse 会计算为 false，就会监听鼠标相关事件，不建议修改该属性，除非你知道你在做什么。
  @Input() disableMouse: boolean;
  // 当在移动端环境（支持 touch 事件），disableTouch 会计算为 false，这样会监听 touch 相关的事件，而在 PC 环境，disableTouch 会计算为 true，就不会监听 touch 相关事件。不建议修改该属性，除非你知道你在做什么。
  @Input() disableTouch: boolean;
  // 会检测 scroller 内部 DOM 变化，自动调用 refresh 方法重新计算来保证滚动的正确性。它会额外增加一些性能开销，如果你能明确地知道 scroller 内部 DOM 的变化时机并手动调用 refresh 重新计算，你可以把该选项设置为 false。
  @Input() observeDOM: boolean = false;
  // 在滚动之前会让当前激活的元素（input、textarea）自动失去焦点
  @Input() autoBlur: boolean = true;
  // 是否阻止事件冒泡。
  @Input() stopPropagation: boolean = false;

  // ----高级 ----- //
  @Input() wheel: BetterScrollWhellInterface | boolean = false;
  @Input() snap: BetterScrollSnapInterface | boolean = false;
  @Input() scrollbar: BetterScrollScrollbarInterface | boolean = false;
  @Input()
  pullDownRefresh: BetterScrollPullDownRefreshInterface | boolean = {
    threshold: 50,
    stop: 20
  };
  @Input()
  pullUpLoad: BetterScrollPullUpLoadInterface | boolean = { threshold: 50 };
  @Input()
  mouseWheel: BetterScrollMouseWheelInterface | boolean = {
    speed: 20,
    invert: false
  };

  // outputs
  @Output() onBeforeScrollStart: EventEmitter<this> = new EventEmitter();
  @Output() onScroll: EventEmitter<BScroll.Position> = new EventEmitter();

  // 组件内部
  // 是否已经创建了
  isCreated: boolean = false;

  @Output() onScrollCancel: EventEmitter<any> = new EventEmitter();
  @Output() onScrollEnd: EventEmitter<BScroll.Position> = new EventEmitter();
  @Output() onTouchEnd: EventEmitter<BScroll.Position> = new EventEmitter();
  @Output() onFlick: EventEmitter<any> = new EventEmitter();
  @Output() onRefresh: EventEmitter<any> = new EventEmitter();
  @Output() onDestroy: EventEmitter<any> = new EventEmitter();

  @Output() onPullingDown: EventEmitter<this> = new EventEmitter();
  @Output() onPullingUp: EventEmitter<this> = new EventEmitter();

  constructor(
    // 通过注入的ElementRef访问dom
    public ele: ElementRef,
    // 通过注入 配置我们的默认参数
    @Inject(BETTER_SCROLL_CONFIG) public _default: any
  ) {}
  /**
   * 如果配置改变并且已经创建了 那么销毁重新创建
   */
  ngOnChanges(changes: SimpleChanges) {
    let hasChanged: boolean = false;
    for (let key in changes) {
      this._default[key] = changes[key].currentValue;
      hasChanged = true;
    }
    if (hasChanged && this.isCreated) {
      this.destroy();
      this.createScroll();
    }
  }
  /**
   * 注销移除
   */
  ngOnDestroy() {
    this.destroy();
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.createScroll();
  }

  /**
   * 监控dom内容变更
   * 刷新better scroll
   */
  changeContent(e: any) {
    this.refresh();
  }
  /**
   * 初始化better scroll
   */
  createScroll() {
    this.scroll = new BScroll(this.ele.nativeElement, this._default);
    // 已经创建了
    this.isCreated = true;
    this.scroll.on("beforeScrollStart", () => {
      this.onBeforeScrollStart.emit(this);
    });
    this.scroll.on("scroll", (pos: BScroll.Position) => {
      this.onScroll.emit(pos);
    });
    this.scroll.on("scrollCancel", () => {
      this.onScrollCancel.emit();
    });
    this.scroll.on("scrollEnd", (pos: BScroll.Position) => {
      this.onScrollEnd.emit(pos);
    });
    this.scroll.on("touchEnd", (pos: BScroll.Position) => {
      this.onTouchEnd.emit(pos);
    });
    this.scroll.on("flick", () => {
      this.onFlick.emit();
    });
    this.scroll.on("refresh", () => {
      this.onRefresh.emit();
    });
    this.scroll.on("destroy", () => {
      this.onDestroy.emit();
    });
    this.scroll.on("pullingDown", () => {
      this.onPullingDown.emit(this);
    });
    this.scroll.on("pullingUp", () => {
      this.onPullingUp.emit(this);
    });
  }

  // 刷新状态
  refresh(): this {
    this.scroll.refresh();
    return this;
  }
  // 启用 better-scroll, 默认 开启
  enable(): this {
    this.scroll.enable();
    return this;
  }
  // 禁用 better-scroll，DOM 事件（如 touchstart、touchmove、touchend）的回调函数不再响应
  disable(): this {
    this.scroll.disable();
    return this;
  }
  // 相对于当前位置偏移滚动 x,y 的距离
  scrollBy(x: number, y: number, time?: number, easing?: object): this {
    this.scroll.scrollBy(x, y, time, easing);
    return this;
  }
  // 滚动到指定的位置
  scrollTo(x: number, y: number, time?: number, easing?: object): this {
    this.scroll.scrollTo(x, y, time, easing);
    return this;
  }
  // 滚动到指定的目标元素
  scrollToElement(
    el: HTMLElement | string,
    time?: number,
    offsetX?: number | boolean,
    offsetY?: number | boolean,
    easing?: object
  ): this {
    this.scroll.scrollToElement(el, time, offsetX, offsetY, easing);
    return this;
  }
  // 立即停止当前运行的滚动动画
  stop(): this {
    this.scroll.stop();
    return this;
  }
  // 销毁 better-scroll，解绑事件
  destroy(): this {
    this.scroll.destroy();
    return this;
  }

  // 当我们做 slide 组件的时候，slide 通常会分成多个页面。调用此方法可以滚动到指定的页面。
  goToPage(x: number, y: number, time?: number, easing?: object): this {
    this.scroll.goToPage(x, y, time, easing);
    return this;
  }
  // 滚动到下一个页面
  next(time?: number, easing?: object): this {
    this.next(time, easing);
    return this;
  }
  // 滚动到上一个页面
  prev(time?: number, easing?: object): this {
    this.scroll.prev(time, easing);
    return this;
  }
  // 获取当前页面的信息
  getCurrentPage(): {
    x: number;
    y: number;
    pageX: number;
    pageY: number;
  } {
    return this.scroll.getCurrentPage();
  }
  // 当我们做 picker 组件的时候，调用该方法可以滚动到索引对应的位置
  wheelTo(index: number): this {
    this.scroll.wheelTo(index);
    return this;
  }
  // 获取当前选中的索引值
  getSelectedIndex(): number {
    return this.scroll.getSelectedIndex();
  }
  // 当下拉刷新数据加载完毕后，需要调用此方法告诉 better-scroll 数据已加载
  finishPullDown(): this {
    this.scroll.finishPullDown();
    return this;
  }
  // 当上拉加载数据加载完毕后，需要调用此方法告诉 better-scroll 数据已加载
  finishPullUp(): this {
    this.scroll.finishPullUp();
    return this;
  }
  trigger(type: string): this {
    this.scroll.trigger();
    return this;
  }
}
```
