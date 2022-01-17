import { ApigeeGenService, ApigeeGenPlugin } from "../lib/apigeegen-interface";
import { ManifestPlugin } from "../lib/plugins/manifest.plugin"
import { TargetsPlugin } from "../lib/plugins/targets.plugin"
import { EndpointsPlugin } from "../lib/plugins/endpoints.plugin"
import archiver from 'archiver';
import fs from 'fs';

let plugins: ApigeeGenPlugin[] = [
  new EndpointsPlugin(),
  new TargetsPlugin(),
  new ManifestPlugin()
]

import { apigeegen } from "./apigeegen-types";

export class ApigeeGenerator implements ApigeeGenService {

  generateProxy(genInput: apigeegen, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let processingVars: Map<string, any> = new Map<string, any>();

      for (let plugin of plugins) {
        let result = plugin.applyTemplate(genInput, processingVars, outputDir);
      }
    
      var archive = archiver('zip');
      archive.on('error', function(err) {
        reject(err);
        //res.status(500).send({error: err.message});
      });
    
      //res.attachment(genInput.name + '.zip').type('zip');
      //archive.pipe(res);
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