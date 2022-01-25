import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeGenProxyPlugin, ApigeeGenInput, proxyEndpoint, authTypes } from "../interfaces";

export class AuthApiKeyPlugin implements ApigeeGenProxyPlugin {

  apikey_snippet: string = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <VerifyAPIKey async="false" continueOnError="false" enabled="true" name="verify-api-key">
      <DisplayName>Verify API Key</DisplayName>
      <APIKey ref="request.queryparam.apikey"/>
  </VerifyAPIKey>`;

  removekey_snippet: string = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <AssignMessage async="false" continueOnError="false" enabled="true" name="remove-query-param-apikey">
      <DisplayName>Remove Query Param apikey</DisplayName>
      <Remove>
          <QueryParams>
              <QueryParam name="apikey"/>
          </QueryParams>
      </Remove>
      <IgnoreUnresolvedVariables>true</IgnoreUnresolvedVariables>
      <AssignTo createNew="false" transport="http" type="request"/>
  </AssignMessage>`;

  apikey_template: any = Handlebars.compile(this.apikey_snippet);
  removekey_template: any = Handlebars.compile(this.removekey_snippet);

  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, any>, outputDir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {

      if (inputConfig.auth && inputConfig.auth.filter(e => e.type === authTypes.apikey).length > 0) {

        var authConfig = inputConfig.auth.filter(e => e.type === authTypes.apikey)[0];

        fs.writeFileSync(outputDir + "/policies/verify-api-key" + ".xml",
          this.apikey_template({}));

        fs.writeFileSync(outputDir + "/policies/remove-query-param-apikey" + ".xml",
          this.removekey_template({}));

        processingVars["preflow_request_policies"].push("verify-api-key");
        processingVars["preflow_request_policies"].push("remove-query-param-apikey");
      }

      resolve(true);
    });
  }
}