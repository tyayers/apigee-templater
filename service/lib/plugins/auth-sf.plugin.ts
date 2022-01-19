import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenPlugin } from "../apigeegen-interface";
import { apigeegen, authTypes } from "../apigeegen-types";

export class AuthSfPlugin implements ApigeeGenPlugin {

  template: any = Handlebars.compile(fs.readFileSync("templates/auth-sf.xml", "utf8"));

  applyTemplate(inputConfig: apigeegen, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {

      if (inputConfig.auth && inputConfig.auth.filter(e => e.type === authTypes.sharedflow).length > 0) {
        
        if (!fs.existsSync(outputDir + "policies"))
          fs.mkdirSync(outputDir + "policies");
        
        var authConfig = inputConfig.auth.filter(e => e.type === authTypes.sharedflow)[0];
        fs.writeFileSync(outputDir + "/policies/VerifyJWT" + ".xml",
          this.template({
            audience: authConfig.parameters["audience"],
            roles: authConfig.parameters["roles"],
            issuerVer1: authConfig.parameters["issuerVer1"],
            issuerVer2: authConfig.parameters["issuerVer2"]
          }));

        if (!processingVars["pf_rq_policies"]) processingVars["pf_rq_policies"] = [];

        processingVars["pf_rq_policies"].push("VerifyJWT");
      }

      resolve(true);
    });
  }
}