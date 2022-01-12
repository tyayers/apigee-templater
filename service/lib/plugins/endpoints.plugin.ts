import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenPlugin } from "../apigeegen-interface";
import { apigeegen } from "../apigeegen-types";

export class EndpointsPlugin implements ApigeeGenPlugin {

  template: any = Handlebars.compile(fs.readFileSync("templates/endpoint.xml", "utf8"));

  applyTemplate(inputConfig: apigeegen, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {

      fs.mkdirSync(outputDir + "/proxies");

      fs.writeFileSync(outputDir + "/proxies/default" + ".xml",
        this.template({basePath: inputConfig.basePath}));

      resolve(true);
    });
  }
}