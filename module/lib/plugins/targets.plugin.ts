import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeTemplatePlugin, PlugInResult, proxyEndpoint } from "../interfaces";

export class TargetsPlugin implements ApigeeTemplatePlugin {

  snippet: string = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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

  template: any = Handlebars.compile(this.snippet);

  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, any>): Promise<PlugInResult> {
    return new Promise((resolve, reject) => {
      let fileResult: PlugInResult = new PlugInResult();

      fileResult.files = [
        {
          path: "/targets/" + inputConfig.targetName + ".xml",
          contents: this.template({targetName: inputConfig.targetName, targetUrl: inputConfig.targetUrl})
        }
      ];

      resolve(fileResult);
    });
  }
}