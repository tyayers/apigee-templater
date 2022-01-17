import { apigeegen } from "./apigeegen-types";

export interface ApigeeGenService {
  generateProxy(inputConfig: apigeegen, outputDir: string): Promise<boolean>
}

export interface ApigeeGenPlugin {
  applyTemplate(inputConfig: apigeegen, processingVars: Map<string, any>, outputDir: string): Promise<boolean>
}