import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenPlugin, ApigeeGenInput, authTypes, quotaConfig } from "../interfaces";

export class QuotaPlugin implements ApigeeGenPlugin {

    template: any = Handlebars.compile(fs.readFileSync("templates/traffic-quota.xml", "utf8"));

    applyTemplate(inputConfig: ApigeeGenInput, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
        return new Promise((resolve, reject) => {

            if (inputConfig.quotas && inputConfig.quotas.length > 0) {

                if (!fs.existsSync(outputDir + "policies"))
                    fs.mkdirSync(outputDir + "policies");

                for (var i in inputConfig.quotas) {
                    fs.writeFileSync(outputDir + "/policies/Quota-" + (Number(i)+1).toString() + ".xml",
                        this.template({
                            index: (Number(i)+1),
                            count: inputConfig.quotas[i].count,
                            timeUnit: inputConfig.quotas[i].timeUnit
                        }));

                    if (!processingVars["pf_rq_policies"]) processingVars["pf_rq_policies"] = [];

                    processingVars["pf_rq_policies"].push("Quota-" + (Number(i)+1).toString());
                }
            }

            resolve(true);
        });
    }
}