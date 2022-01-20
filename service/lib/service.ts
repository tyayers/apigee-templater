import { ApigeeGenService, ApigeeGenPlugin } from "./interfaces";
import { ManifestPlugin } from "./plugins/manifest.plugin"
import { TargetsPlugin } from "./plugins/targets.plugin"
import { EndpointsPlugin } from "./plugins/endpoints.plugin"
import { AuthApiKeyPlugin } from "./plugins/auth-apikey.plugin";
import { AuthSfPlugin } from "./plugins/auth-sf.plugin";
import { QuotaPlugin } from "./plugins/traffic-quota.plugin";
import { SpikeArrestPlugin } from "./plugins/traffic-spike-arrest.plugin";

import archiver from 'archiver';
import fs from 'fs';

let plugins: ApigeeGenPlugin[] = [
  // First apply spike arrest, if configured
  new SpikeArrestPlugin(),

  // Then developer identity and quotas
  new AuthApiKeyPlugin(),
  new AuthSfPlugin(),
  new QuotaPlugin(),

  // Then targets, endpoints and manifest
  new TargetsPlugin(),
  new EndpointsPlugin(),
  new ManifestPlugin()
]

import { ApigeeGenInput } from "./interfaces";

export class ApigeeGenerator implements ApigeeGenService {

  generateProxy(genInput: ApigeeGenInput, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let processingVars: Map<string, any> = new Map<string, any>();

      for (let plugin of plugins) {
        let result = plugin.applyTemplate(genInput, processingVars, outputDir);
      }
    
      var archive = archiver('zip');
      archive.on('error', function(err) {
        reject(err);
      });
    
      archive.directory("proxies/" + genInput.name, false);
    
      var output = fs.createWriteStream("proxies/" + genInput.name + ".zip");
    
      archive.on('end', () => {
        // Zip is finished, cleanup files
        fs.rmdirSync("proxies/" + genInput.name, {recursive: true});
        resolve(true);
      });
    
      archive.pipe(output);
      archive.finalize();
    });
  }
}