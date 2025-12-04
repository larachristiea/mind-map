// ============================================
// DECLARAÇÕES DE MÓDULOS
// ============================================

declare module 'markmap-lib' {
  export class Transformer {
    transform(markdown: string): { root: INode };
  }
  
  export interface INode {
    content: string;
    children?: INode[];
    payload?: {
      fold?: boolean;
    };
    state?: {
      depth: number;
      path: string;
    };
  }
}

declare module 'markmap-view' {
  import type { INode } from 'markmap-lib';
  
  export interface IMarkmapOptions {
    autoFit?: boolean;
    duration?: number;
    maxWidth?: number;
    colorFreezeLevel?: number;
    initialExpandLevel?: number;
    color?: (node: INode) => string;
    paddingX?: number;
    zoom?: boolean;
    pan?: boolean;
  }
  
  export class Markmap {
    static create(
      svg: SVGElement,
      options?: Partial<IMarkmapOptions>
    ): Markmap;
    
    setData(root: INode): void;
    fit(): void;
    rescale(scale: number): void;
    destroy(): void;
  }
}

declare module 'screenfull' {
  interface Screenfull {
    isEnabled: boolean;
    isFullscreen: boolean;
    request(element?: Element): Promise<void>;
    exit(): Promise<void>;
    toggle(element?: Element): Promise<void>;
    on(event: string, callback: () => void): void;
    off(event: string, callback: () => void): void;
  }
  
  const screenfull: Screenfull;
  export default screenfull;
}

declare namespace Tesseract {
  interface Worker {
    recognize(image: string | HTMLImageElement | HTMLCanvasElement | Blob): Promise<{
      data: {
        text: string;
        confidence: number;
      };
    }>;
    terminate(): Promise<void>;
  }
  
  interface LoggerMessage {
    status: string;
    progress?: number;
  }
  
  interface WorkerOptions {
    logger?: (message: LoggerMessage) => void;
  }
  
  function createWorker(
    langs: string,
    oem?: number,
    options?: WorkerOptions
  ): Promise<Worker>;
}
