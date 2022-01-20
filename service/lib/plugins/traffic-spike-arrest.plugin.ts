import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenPlugin, ApigeeGenInput, spikeArrestConfig } from "../interfaces";

export class SpikeArrestPlugin implements ApigeeGenPlugin {

    template: any = Handlebars.compile(fs.readFileSync("templates/traffic-spike-arrest.xml", "utf8"));

    applyTemplate(inputConfig: ApigeeGenInput, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
        return new Promise((resolve, reject) => {

            if (inputConfig.spikeArrest) {

                if (!fs.existsSync(outputDir + "policies"))
                    fs.mkdirSync(outputDir + "policies");

                fs.writeFileSync(outputDir + "/policies/Spike-Arrest-1.xml",
                    this.template({
                        rate: inputConfig.spikeArrest.rate
                    }));

                if (!processingVars["pf_rq_policies"]) processingVars["pf_rq_policies"] = [];

                processingVars["pf_rq_policies"].push("Spike-Arrest-1");
            }

            resolve(true);
        });
    }
}