import Handlebars from 'handlebars';
import { ApigeeTemplatePlugin, PlugInResult, proxyEndpoint } from "../interfaces";

/**
 * Creates proxy endpoints for the template
 * @date 2/14/2022 - 8:14:22 AM
 *
 * @export
 * @class ProxiesPlugin
 * @typedef {ProxiesPlugin}
 * @implements {ApigeeTemplatePlugin}
 */
export class ProxiesPlugin implements ApigeeTemplatePlugin {

  snippet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <ProxyEndpoint name="default">
      <PreFlow name="PreFlow">
          <Request>
            {{#each preflow_request_policies}}
              <Step>
                <Name>{{this.name}}</Name>
              </Step>
            {{/each}}
          </Request>
          <Response/>
      </PreFlow>
      <Flows/>
      <PostFlow name="PostFlow">
          <Request/>
          <Response/>
      </PostFlow>
      <HTTPProxyConnection>
          <BasePath>{{basePath}}</BasePath>
      </HTTPProxyConnection>
      <RouteRule name="{{targetName}}">
          <TargetEndpoint>{{targetName}}</TargetEndpoint>
      </RouteRule>
  </ProxyEndpoint>`;

  template = Handlebars.compile(this.snippet);

  /**
   * Apply template for proxy endpoints
   * @date 2/14/2022 - 8:15:04 AM
   *
   * @param {proxyEndpoint} inputConfig
   * @param {Map<string, object>} processingVars
   * @return {Promise<PlugInResult>}
   */
  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, object>): Promise<PlugInResult> {
    return new Promise((resolve) => {
      const fileResult: PlugInResult = new PlugInResult();
      fileResult.files = [
        {
          path: "/proxies/" + inputConfig.name + ".xml",
          contents: this.template(
            {
              basePath: inputConfig.basePath,
              targetName: inputConfig.targetName,
              preflow_request_policies: processingVars["preflow_request_policies"],
              preflow_response_policies: processingVars["preflow_response_policies"],
              postflow_request_policies: processingVars["postflow_request_policies"],
              postflow_response_policies: processingVars["postflow_response_policies"],
            })
        }
      ];

      resolve(fileResult);
    });
  }
}