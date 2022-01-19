import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenPlugin } from "../apigeegen-interface";
import { apigeegen } from "../apigeegen-types";

export class TargetsPlugin implements ApigeeGenPlugin {

  template: any = Handlebars.compile(fs.readFileSync("templates/target.xml", "utf8"));

  applyTemplate(inputConfig: apigeegen, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {

      if (!fs.existsSync(outputDir + "targets"))
        fs.mkdirSync(outputDir + "targets");

      fs.writeFileSync(outputDir + "/targets/default" + ".xml",
        this.template({targetUrl: inputConfig.targetUrl}));

      resolve(true);
    });
  }
}