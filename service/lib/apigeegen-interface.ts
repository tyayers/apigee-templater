import { apigeegen } from "./apigeegen-types";

export interface ApigeeGenPlugin {
  applyTemplate(inputConfig: apigeegen, processingVars: Map<string, any>, outputDir: string): Promise<boolean>
}