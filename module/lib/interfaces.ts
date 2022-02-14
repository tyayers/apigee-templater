export interface ApigeeTemplateInput {
  name: string;
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
  parameters: { [key: string]: string };
}

export interface quotaConfig {
  count: number;
  timeUnit: string;
  condition?: string;
}

export interface spikeArrestConfig {
  rate: string;
}

export enum authTypes {
  // eslint-disable-next-line no-unused-vars
  apikey = "apikey",
  // eslint-disable-next-line no-unused-vars
  jwt = "jwt",
  // eslint-disable-next-line no-unused-vars
  sharedflow = "sharedflow"
}

export interface ApigeeTemplateService {
  generateProxyFromString(inputString: string, outputDir: string): Promise<GenerateResult>
  generateProxy(inputConfig: ApigeeTemplateInput, outputDir: string): Promise<GenerateResult>
}

/**
 * Result of the template generation
 * @date 2/14/2022 - 8:04:45 AM
 *
 * @export
 * @class GenerateResult
 * @typedef {GenerateResult}
 */
export class GenerateResult {
  success = false;
  duration = 0;
  message = "";
  localPath = "";
  template?: ApigeeTemplateInput;
}

/**
 * Result of plugin processing
 * @date 2/14/2022 - 8:05:47 AM
 *
 * @export
 * @class PlugInResult
 * @typedef {PlugInResult}
 */
export class PlugInResult {
  files: PlugInFile[] = [];
}

/**
 * A file definition that should be created from a plugin
 * @date 2/14/2022 - 8:06:01 AM
 *
 * @export
 * @class PlugInFile
 * @typedef {PlugInFile}
 */
export class PlugInFile {
  path = "";
  contents = "";
}

export interface ApigeeTemplatePlugin {
  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, object>): Promise<PlugInResult>
}

export interface ApigeeConverterPlugin {
  convertInput(input: string): Promise<ApigeeTemplateInput>
}