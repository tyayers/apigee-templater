import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenProxyPlugin, ApigeeGenInput, proxyEndpoint, authTypes, quotaConfig } from "../interfaces";

export class QuotaPlugin implements ApigeeGenProxyPlugin {

  snippet: string = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Quota continueOnError="false" enabled="true" name="Quota-{{index}}" type="calendar">
      <DisplayName>Quota-{{index}}</DisplayName>
      <Properties/>
      <Allow count="{{count}}" countRef="request.header.allowed_quota"/>
      <Interval ref="request.header.quota_count">1</Interval>
      <Distributed>false</Distributed>
      <Synchronous>false</Synchronous>
      <TimeUnit ref="request.header.quota_timeout">{{timeUnit}}</TimeUnit>
      <StartTime>2022-1-20 12:00:00</StartTime>
      <AsynchronousConfiguration>
          <SyncIntervalInSeconds>20</SyncIntervalInSeconds>
          <SyncMessageCount>5</SyncMessageCount>
      </AsynchronousConfiguration>
  </Quota>`;

  template: any = Handlebars.compile(this.snippet);

  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {

      if (inputConfig.quotas && inputConfig.quotas.length > 0) {

        for (var i in inputConfig.quotas) {
          fs.writeFileSync(outputDir + "/policies/Quota-" + (Number(i) + 1).toString() + ".xml",
            this.template({
              index: (Number(i) + 1),
              count: inputConfig.quotas[i].count,
              timeUnit: inputConfig.quotas[i].timeUnit
          }));

          processingVars["preflow_request_policies"].push("Quota-" + (Number(i) + 1).toString());
        }
      }

      resolve(true);
    });
  }
}