interface ApigeeGenInput {
  name: string;
  proxyType: proxyTypes;
  proxyEndpoints: proxyEndpoint[];
}

interface proxyEndpoint {
  name: string;
  basePath: string;
  targetName?: string;
  targetUrl: string;
  auth?: authConfig[];
  quotas?: quotaConfig[];
  spikeArrest?: spikeArrestConfig;
}

interface authConfig {
  type: authTypes;
  parameters: {[key: string]: string};
}

interface quotaConfig {
  count: number;
  timeUnit: string;
  condition?: string;
}

interface spikeArrestConfig {
  rate: string;
}

enum proxyTypes {
  programmable = "programmable",
  configurable = "configurable"
}

enum authTypes {
  apikey = "apikey",
  jwt = "jwt",
  sharedflow = "sharedflow"
}

export interface ApigeeGenService {
  generateProxy(inputConfig: ApigeeGenInput, outputDir: string): Promise<boolean>
}

export interface ApigeeGenProxyPlugin {
  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, any>, outputDir: string): Promise<boolean>
}

export {
  ApigeeGenInput,
  proxyEndpoint,
  authTypes,
  proxyTypes,
  quotaConfig,
  spikeArrestConfig
}