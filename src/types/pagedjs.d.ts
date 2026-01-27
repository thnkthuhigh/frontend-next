declare module 'pagedjs' {
  export class Previewer {
    preview(
      content: string,
      stylesheets?: string[],
      renderTo?: HTMLElement
    ): Promise<{
      total: number;
      pages: HTMLElement[];
    }>;
  }

  export class Chunker {
    constructor(content: HTMLElement, renderTo: HTMLElement);
    flow(): Promise<void>;
  }

  export class Polisher {
    add(...stylesheets: CSSStyleSheet[]): void;
  }

  export function registerHandlers(...handlers: any[]): void;
}
