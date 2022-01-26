import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeTemplatePlugin, PlugInResult, proxyEndpoint } from "../interfaces";

export class ProxiesPlugin implements ApigeeTemplatePlugin {

  snippet: string = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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

  template: any = Handlebars.compile(this.snippet);

  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, any>): Promise<PlugInResult> {
    return new Promise((resolve, reject) => {
      let fileResult: PlugInResult = new PlugInResult();
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