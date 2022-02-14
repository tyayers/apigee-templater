import Handlebars from 'handlebars';
import { ApigeeTemplatePlugin, PlugInResult, proxyEndpoint } from "../interfaces";

/**
 * Plugin for generating targets
 * @date 2/14/2022 - 8:15:26 AM
 *
 * @export
 * @class TargetsPlugin
 * @typedef {TargetsPlugin}
 * @implements {ApigeeTemplatePlugin}
 */
export class TargetsPlugin implements ApigeeTemplatePlugin {

  snippet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <TargetEndpoint name="{{targetName}}">
      <PreFlow name="PreFlow">
          <Request/>
          <Response/>
      </PreFlow>
      <Flows/>
      <PostFlow name="PostFlow">
          <Request/>
          <Response/>
      </PostFlow>
      <HTTPTargetConnection>
          <URL>{{targetUrl}}</URL>
      </HTTPTargetConnection>
  </TargetEndpoint>`;

  template = Handlebars.compile(this.snippet);

  /**
   * Templates the targets configurations
   * @date 2/14/2022 - 8:15:57 AM
   *
   * @param {proxyEndpoint} inputConfig
   * @param {Map<string, object>} processingVars
   * @return {Promise<PlugInResult>}
   */
  applyTemplate(inputConfig: proxyEndpoint): Promise<PlugInResult> {
    return new Promise((resolve) => {
      const fileResult: PlugInResult = new PlugInResult();

      fileResult.files = [
        {
          path: "/targets/" + inputConfig.targetName + ".xml",
          contents: this.template({ targetName: inputConfig.targetName, targetUrl: inputConfig.targetUrl })
        }
      ];

      resolve(fileResult);
    });
  }
}