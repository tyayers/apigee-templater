import { ApigeeGenService, ApigeeGenProxyPlugin } from "./interfaces";
import { ProxiesPlugin } from "./plugins/proxies.plugin";
import { TargetsPlugin } from "./plugins/targets.plugin";
import { AuthSfPlugin } from "./plugins/auth.sf.plugin";
import { AuthApiKeyPlugin } from "./plugins/auth.apikey.plugin";
import { QuotaPlugin } from "./plugins/traffic.quota.plugin";
import { SpikeArrestPlugin } from "./plugins/traffic.spikearrest.plugin";

import archiver from 'archiver';
import fs from 'fs';

import { ApigeeGenInput } from "./interfaces";

export class ApigeeGenerator implements ApigeeGenService {

  // Default Plugins
  plugins: ApigeeGenProxyPlugin[] = [
    new SpikeArrestPlugin(),
    new AuthApiKeyPlugin(),
    new AuthSfPlugin(),
    new QuotaPlugin(),
    new TargetsPlugin(),
    new ProxiesPlugin(),
  ];

  constructor(plugins: ApigeeGenProxyPlugin[]) {
    if (plugins)
      this.plugins = plugins;
  }

  generateProxy(genInput: ApigeeGenInput, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let processingVars: Map<string, any> = new Map<string, any>();
      let newOutputDir = outputDir + "/" + genInput.name + "/apiproxy";
      fs.mkdirSync(newOutputDir, { recursive: true });

      fs.mkdirSync(newOutputDir + "/proxies", { recursive: true });
      fs.mkdirSync(newOutputDir + "/targets", { recursive: true });
      fs.mkdirSync(newOutputDir + "/policies", { recursive: true });
      fs.mkdirSync(newOutputDir + "/resources", { recursive: true });

      for (let endpoint of genInput.proxyEndpoints) {
        // Initialize variables for endpoint
        processingVars["preflow_request_policies"] = [];
        processingVars["preflow_response_policies"] = [];
        processingVars["postflow_request_policies"] = [];
        processingVars["postflow_response_policies"] = [];

        for (let plugin of this.plugins) {
          let result = plugin.applyTemplate(endpoint, processingVars, newOutputDir);
        }
      }
    
      var archive = archiver('zip');
      archive.on('error', function(err) {
        reject(err);
      });
    
      archive.directory(outputDir + "/" + genInput.name, false);
    
      var output = fs.createWriteStream(outputDir + "/" + genInput.name + ".zip");
    
      archive.on('end', () => {
        // Zip is finished, cleanup files
        fs.rmdirSync(outputDir + "/" + genInput.name, {recursive: true});
        resolve(true);
      });
    
      archive.pipe(output);
      archive.finalize();
    });
  }
}