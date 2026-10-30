// Robust Proxy-based Mock Canvas 2D context for happy-dom testing environment
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (contextType: string) {
    if (contextType === '2d') {
      const self = this;
      return new Proxy({} as CanvasRenderingContext2D, {
        get(_target, prop) {
          if (prop === 'canvas') return self;
          if (prop === 'measureText') return () => ({ width: 0 });
          return () => {};
        },
        set() {
          return true;
        },
      });
    }
    return null;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
