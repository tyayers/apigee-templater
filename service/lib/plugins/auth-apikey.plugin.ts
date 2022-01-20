import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenPlugin, ApigeeGenInput, authTypes } from "../interfaces";

export class AuthApiKeyPlugin implements ApigeeGenPlugin {

  template: any = Handlebars.compile(fs.readFileSync("templates/auth-apikey.xml", "utf8"));
  template_removekey: any = Handlebars.compile(fs.readFileSync("templates/auth-apikey-remove.xml", "utf8"));

  applyTemplate(inputConfig: ApigeeGenInput, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {

      if (inputConfig.auth && inputConfig.auth.filter(e => e.type === authTypes.apikey).length > 0) {

        if (!fs.existsSync(outputDir + "policies"))
          fs.mkdirSync(outputDir + "policies");
        
        var authConfig = inputConfig.auth.filter(e => e.type === authTypes.apikey)[0];

        fs.writeFileSync(outputDir + "/policies/verify-api-key" + ".xml",
          this.template({}));

        fs.writeFileSync(outputDir + "/policies/remove-query-param-apikey" + ".xml",
          this.template_removekey({}));

        if (!processingVars["pf_rq_policies"]) processingVars["pf_rq_policies"] = [];

        processingVars["pf_rq_policies"].push("verify-api-key");
        processingVars["pf_rq_policies"].push("remove-query-param-apikey");
      }

      resolve(true);
    });
  }
}