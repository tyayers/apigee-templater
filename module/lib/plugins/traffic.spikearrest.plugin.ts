import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenProxyPlugin, ApigeeGenInput, proxyEndpoint, authTypes, quotaConfig } from "../interfaces";

export class SpikeArrestPlugin implements ApigeeGenProxyPlugin {

  snippet: string = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <SpikeArrest continueOnError="false" enabled="true" name="Spike-Arrest-1">
      <DisplayName>Spike Arrest-1</DisplayName>
      <Properties/>
      <Identifier ref="request.header.some-header-name"/>
      <MessageWeight ref="request.header.weight"/>
      <Rate>{{rate}}</Rate>
  </SpikeArrest>`;

  template: any = Handlebars.compile(this.snippet);

  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {

      if (inputConfig.spikeArrest) {
        fs.writeFileSync(outputDir + "/policies/Spike-Arrest-1.xml",
          this.template({
            rate: inputConfig.spikeArrest.rate
          }));

        processingVars["preflow_request_policies"].push("Spike-Arrest-1");
      }

      resolve(true);
    });
  }
}