
/** Describes a proxy to be templated */
export class ApigeeTemplateInput {
  name = "MyProxy";
  profile = "default";
  proxyEndpoints: proxyEndpoint[] = [];

  /**
   * Creates an instance of ApigeeTemplateInput.
   * @date 3/16/2022 - 10:18:44 AM
   *
   * @constructor
   * @public
   * @param {?Partial<ApigeeTemplateInput>} [init]
   */
  public constructor(init?:Partial<ApigeeTemplateInput>) {
    Object.assign(this, init);
  }
}

/** A proxy endpoint describes a basepath, targets and other proxy features */
export class proxyEndpoint {
  name = "";
  basePath = "";
  targetName?: string;
  targetUrl = "";
  auth?: authConfig[];
  quotas?: quotaConfig[];
  spikeArrest?: spikeArrestConfig;
}

/** Authorization config for an endpoint */
export class authConfig {
  type: authTypes = authTypes.apikey;
  parameters: { [key: string]: string } = {};
}

/** Quota config for an endpoint */
export class quotaConfig {
  count = 5;
  timeUnit = "minute";
  condition?: string;
}

/** Spike arrest config for an endpoint */
export class spikeArrestConfig {
  rate = "30s";
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

/** The result of the template generation */
export class GenerateResult {
  success = false;
  duration = 0;
  message = "";
  localPath = "";
  template?: ApigeeTemplateInput;
}

/** The result of plugin processing */
export class PlugInResult {
  files: PlugInFile[] = [];
}

/** Plugin file results to be written to disk */
export class PlugInFile {
  path = "";
  contents = "";
}

/** Profile definition with plugins to be used for conversion */
export class ApigeeTemplateProfile {
  plugins: ApigeeTemplatePlugin[] = [];
}

export interface ApigeeTemplatePlugin {
  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, object>): Promise<PlugInResult>
}

export interface ApigeeConverterPlugin {
  convertInput(input: string): Promise<ApigeeTemplateInput>
}