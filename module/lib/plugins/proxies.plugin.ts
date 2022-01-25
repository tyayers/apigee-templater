import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenProxyPlugin, proxyEndpoint } from "../interfaces";

export class ProxiesPlugin implements ApigeeGenProxyPlugin {

  snippet: string = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <ProxyEndpoint name="default">
      <PreFlow name="PreFlow">
          <Request>
            {{#each preflow_request_policies}}
              <Step>
                <Name>{{this}}</Name>
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

  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {

      fs.writeFileSync(outputDir + "/proxies/" + inputConfig.name + ".xml",
        this.template(
        {
          basePath: inputConfig.basePath, 
          targetName: inputConfig.targetName, 
          preflow_request_policies: processingVars["preflow_request_policies"],
          preflow_response_policies: processingVars["preflow_response_policies"],
          postflow_request_policies: processingVars["postflow_request_policies"],
          postflow_response_policies: processingVars["postflow_response_policies"],          
        })
      );

      resolve(true);
    });
  }
}