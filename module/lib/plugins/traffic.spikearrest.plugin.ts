import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeTemplatePlugin, ApigeeTemplateInput, proxyEndpoint, authTypes, quotaConfig, PlugInResult } from "../interfaces";

export class SpikeArrestPlugin implements ApigeeTemplatePlugin {

  snippet: string = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <SpikeArrest continueOnError="false" enabled="true" name="Spike-Arrest-1">
      <DisplayName>Spike Arrest-1</DisplayName>
      <Properties/>
      <Identifier ref="request.header.some-header-name"/>
      <MessageWeight ref="request.header.weight"/>
      <Rate>{{rate}}</Rate>
  </SpikeArrest>`;

  template: any = Handlebars.compile(this.snippet);

  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, any>): Promise<PlugInResult> {
    return new Promise((resolve, reject) => {

      let fileResult: PlugInResult = new PlugInResult();

      if (inputConfig.spikeArrest) {
        fileResult.files = [
          {
            path: "/policies/Spike-Arrest-1.xml",
            contents: this.template({
              rate: inputConfig.spikeArrest.rate
            })
          }
        ];

        processingVars["preflow_request_policies"].push({name: "Spike-Arrest-1"});
      }

      resolve(fileResult);
    });
  }
}