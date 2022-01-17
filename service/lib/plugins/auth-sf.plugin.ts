import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenPlugin } from "../apigeegen-interface";
import { apigeegen, authTypes } from "../apigeegen-types";

export class AuthSfPlugin implements ApigeeGenPlugin {

  template: any = Handlebars.compile(fs.readFileSync("templates/auth-sf.xml", "utf8"));

  applyTemplate(inputConfig: apigeegen, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {

      if (inputConfig.auth && inputConfig.auth.includes(authTypes.sharedflow)) {
        fs.mkdirSync(outputDir + "/policies");

        fs.writeFileSync(outputDir + "/policies/validate-token" + ".xml",
          this.template({}));

        if (!processingVars["pf_rq_policies"]) processingVars["pf_rq_policies"] = [];

        processingVars["pf_rq_policies"].push("validate-token");
      }

      resolve(true);
    });
  }
}