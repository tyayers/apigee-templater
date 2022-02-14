import Handlebars from 'handlebars';
import { ApigeeTemplatePlugin, proxyEndpoint, PlugInResult } from "../interfaces";

/**
 * Plugin for templating spike arrests
 * @date 2/14/2022 - 8:21:02 AM
 *
 * @export
 * @class SpikeArrestPlugin
 * @typedef {SpikeArrestPlugin}
 * @implements {ApigeeTemplatePlugin}
 */
export class SpikeArrestPlugin implements ApigeeTemplatePlugin {

  snippet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <SpikeArrest continueOnError="false" enabled="true" name="Spike-Arrest-1">
      <DisplayName>Spike Arrest-1</DisplayName>
      <Properties/>
      <Identifier ref="request.header.some-header-name"/>
      <MessageWeight ref="request.header.weight"/>
      <Rate>{{rate}}</Rate>
  </SpikeArrest>`;

  template = Handlebars.compile(this.snippet);

  /**
   * Applies the template logic for spike arrests
   * @date 2/14/2022 - 8:21:23 AM
   *
   * @param {proxyEndpoint} inputConfig
   * @param {Map<string, object>} processingVars
   * @return {Promise<PlugInResult>}
   */
  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, object>): Promise<PlugInResult> {
    return new Promise((resolve) => {

      const fileResult: PlugInResult = new PlugInResult();

      if (inputConfig.spikeArrest) {
        fileResult.files = [
          {
            path: "/policies/Spike-Arrest-1.xml",
            contents: this.template({
              rate: inputConfig.spikeArrest.rate
            })
          }
        ];

        processingVars["preflow_request_policies"].push({ name: "Spike-Arrest-1" });
      }

      resolve(fileResult);
    });
  }
}