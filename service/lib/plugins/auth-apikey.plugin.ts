import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenPlugin } from "../apigeegen-interface";
import { apigeegen, authTypes } from "../apigeegen-types";

export class AuthApiKeyPlugin implements ApigeeGenPlugin {

  template: any = Handlebars.compile(fs.readFileSync("templates/auth-apikey.xml", "utf8"));
  template_removekey: any = Handlebars.compile(fs.readFileSync("templates/auth-apikey-remove.xml", "utf8"));

  applyTemplate(inputConfig: apigeegen, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {

      if (inputConfig.auth && inputConfig.auth.includes(authTypes.apikey)) {
        fs.mkdirSync(outputDir + "/policies");

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