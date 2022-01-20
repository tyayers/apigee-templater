import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenPlugin, ApigeeGenInput } from "../interfaces";

export class EndpointsPlugin implements ApigeeGenPlugin {

  template: any = Handlebars.compile(fs.readFileSync("templates/endpoint.xml", "utf8"));

  applyTemplate(inputConfig: ApigeeGenInput, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {

      if (!fs.existsSync(outputDir + "proxies"))
        fs.mkdirSync(outputDir + "proxies");

      fs.writeFileSync(outputDir + "/proxies/default" + ".xml",
        this.template({basePath: inputConfig.basePath, pf_rq_policies: processingVars["pf_rq_policies"]}));

      resolve(true);
    });
  }
}