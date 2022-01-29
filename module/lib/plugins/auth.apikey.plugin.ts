import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeTemplatePlugin, ApigeeTemplateInput, PlugInResult, proxyEndpoint, authTypes, PlugInFile } from "../interfaces";

export class AuthApiKeyPlugin implements ApigeeTemplatePlugin {

  apikey_snippet: string = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <VerifyAPIKey async="false" continueOnError="false" enabled="true" name="VerifyApiKey">
      <DisplayName>Verify API Key</DisplayName>
      <APIKey ref="request.queryparam.apikey"/>
  </VerifyAPIKey>`;

  removekey_snippet: string = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <AssignMessage async="false" continueOnError="false" enabled="true" name="RemoveApiKey">
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

  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, any>): Promise<PlugInResult> {
    return new Promise((resolve, reject) => {

      let fileResult: PlugInResult = new PlugInResult();

      if (inputConfig.auth && inputConfig.auth.filter(e => e.type === authTypes.apikey).length > 0) {

        var authConfig = inputConfig.auth.filter(e => e.type === authTypes.apikey)[0];

        fileResult.files = [
          {
            path: "/policies/VerifyApiKey.xml",
            contents: this.apikey_template({})
          },
          {
            path: "/policies/RemoveApiKey.xml",
            contents: this.removekey_template({})
          }
        ];

        processingVars["preflow_request_policies"].push({name: "VerifyApiKey"});
        processingVars["preflow_request_policies"].push({name: "RemoveApiKey"});
      }

      resolve(fileResult);
    });
  }
}