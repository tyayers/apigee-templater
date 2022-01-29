export interface ApigeeTemplateInput {
  name: string;
  proxyType?: proxyTypes;
  proxyEndpoints: proxyEndpoint[];
}

export interface proxyEndpoint {
  name: string;
  basePath: string;
  targetName?: string;
  targetUrl: string;
  auth?: authConfig[];
  quotas?: quotaConfig[];
  spikeArrest?: spikeArrestConfig;
}

export interface authConfig {
  type: authTypes;
  parameters: {[key: string]: string};
}

export interface quotaConfig {
  count: number;
  timeUnit: string;
  condition?: string;
}

export interface spikeArrestConfig {
  rate: string;
}

export enum proxyTypes {
  programmable = "programmable",
  configurable = "configurable"
}

export enum authTypes {
  apikey = "apikey",
  jwt = "jwt",
  sharedflow = "sharedflow"
}

export interface ApigeeTemplateService {
  generateProxyFromString(inputString: string, outputDir: string): Promise<GenerateResult>
  generateProxy(inputConfig: ApigeeTemplateInput, outputDir: string): Promise<GenerateResult>
}

export class GenerateResult {
  success: boolean = false;
  duration: number = 0;
  message: string = "";
  localPath: string = "";
  template?: ApigeeTemplateInput;
}

export class PlugInResult {
  files: PlugInFile[] = [];
}

export class PlugInFile {
  path: string = "";
  contents: string = "";
}

export interface ApigeeTemplatePlugin {
  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, any>): Promise<PlugInResult>
}

export interface ApigeeConverterPlugin {
  convertInput(input: string): Promise<ApigeeTemplateInput>
}