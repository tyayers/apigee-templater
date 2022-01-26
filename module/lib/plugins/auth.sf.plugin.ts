import fs from 'fs';
import Handlebars from 'handlebars';
import { ApigeeTemplatePlugin, ApigeeTemplateInput, proxyEndpoint, authTypes, PlugInResult } from "../interfaces";

export class AuthSfPlugin implements ApigeeTemplatePlugin {

  snippet: string = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <FlowCallout continueOnError="false" enabled="true" name="VerifyJWT">
      <DisplayName>VerifyJWT</DisplayName>
      <FaultRules/>
      <Properties/>
      <Parameters>
          {{#if audience}}
          <Parameter name="audience">{{audience}}</Parameter>
          {{/if}}
          {{#if roles}}
          <Parameter name="roles">{{roles}}</Parameter>
          {{/if}}
          {{#if issuerVer1}}
          <Parameter name="issuerVer1">{{issuerVer1}}</Parameter>
          {{/if}}
          {{#if issuerVer2}}
          <Parameter name="issuerVer2">{{issuerVer2}}</Parameter>
          {{/if}}
      </Parameters>
      <SharedFlowBundle>Shared-Flow_GCP_API</SharedFlowBundle>
  </FlowCallout>`;

  template: any = Handlebars.compile(this.snippet);

  applyTemplate(inputConfig: proxyEndpoint, processingVars: Map<string, any>): Promise<PlugInResult> {
    return new Promise((resolve, reject) => {
      
      let fileResult: PlugInResult = new PlugInResult();

      if (inputConfig.auth && inputConfig.auth.filter(e => e.type === authTypes.sharedflow).length > 0) {
        
        var authConfig = inputConfig.auth.filter(e => e.type === authTypes.sharedflow)[0];

        fileResult.files = [
          {
            path: "/policies/remove-query-param-apikey.xml",
            contents: this.template({
              audience: authConfig.parameters["audience"],
              roles: authConfig.parameters["roles"],
              issuerVer1: authConfig.parameters["issuerVer1"],
              issuerVer2: authConfig.parameters["issuerVer2"]
            })
          }
        ];

        processingVars["preflow_request_policies"].push({name: "VerifyJWT"});
      }

      resolve(fileResult);
    });
  }
}