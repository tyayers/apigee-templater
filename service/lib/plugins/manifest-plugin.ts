import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenPlugin } from "../apigeegen-interface";
import { apigeegen } from "../apigeegen-types";

export class ManifestPlugin implements ApigeeGenPlugin {

  template: any = Handlebars.compile(fs.readFileSync("templates/manifest.xml", "utf8"));

  applyTemplate(inputConfig: apigeegen, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      var result = true;
      var policies: string[] = [];

      if (processingVars.has("policies"))
        policies = processingVars["policies"] as string[];

      fs.writeFileSync(outputDir + inputConfig.name + ".xml",
        this.template({proxyName: inputConfig.name, basePath: inputConfig.basePath, createdAt: "1111", policies: policies}));
  
    });
  }
}