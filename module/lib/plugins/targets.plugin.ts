import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenProxyPlugin, proxyEndpoint } from "../interfaces";

export class TargetsPlugin implements ApigeeGenProxyPlugin {

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

  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {

      fs.writeFileSync(outputDir + "/targets/" + inputConfig.targetName + ".xml",
        this.template({targetName: inputConfig.targetName, targetUrl: inputConfig.targetUrl}));

      resolve(true);
    });
  }
}