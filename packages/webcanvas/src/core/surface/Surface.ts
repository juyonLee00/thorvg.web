import { getModule, hasModule } from '../../interop/module';

let nextKey = 0;

export abstract class Surface {
  public readonly key: string;

  protected constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
    this.key = `!thorvg-${++nextKey}`;
    getModule().specialHTMLTargets[this.key] = canvas;
  }

  public dpr(): number {
    return 1;
  }

  public abstract resize(logicalWidth: number, logicalHeight: number, physicalWidth: number, physicalHeight: number): void;

  public abstract present(buffer: ArrayBuffer, width: number, height: number): void;

  public abstract clear(): void;

  public dispose(): void {
    if (hasModule()) {
      delete getModule().specialHTMLTargets[this.key];
    }
  }
}
