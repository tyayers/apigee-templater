import { ApigeeConverterPlugin, ApigeeTemplateInput, authTypes, proxyTypes } from "../interfaces";


/**
 * Converter from JSON format 2 to ApigeeTemplateInput
 * @date 2/11/2022 - 10:34:37 AM
 *
 * @export
 * @class Json2Converter
 * @typedef {Json2Converter}
 * @implements {ApigeeConverterPlugin}
 */
export class Json2Converter implements ApigeeConverterPlugin {

  /**
   * Converts input string in JSON format 2 to ApigeeTemplateInput
   * @date 2/11/2022 - 10:35:02 AM
   *
   * @param {string} input Input string in JSON format 2
   * @return {Promise<ApigeeTemplateInput>} ApigeeTemplateInput object or undefined if not possible
   */
  convertInput(input: string): Promise<ApigeeTemplateInput> {
    return new Promise((resolve) => {
      let result: ApigeeTemplateInput = undefined;

      try {
        const obj = JSON.parse(input);

        if (obj.api) {
          try {
            result = {
              name: obj.product.apiTestBackendProduct.productName,
              proxyType: proxyTypes.programmable,
              proxyEndpoints: [
                {
                  name: "default",
                  basePath: obj.product.apiTestBackendProduct.productName,
                  targetName: "default",
                  targetUrl: obj.environments[0].backendBaseUrl,
                  auth: [
                    {
                      type: authTypes.sharedflow,
                      parameters: {}
                    }
                  ]
                }
              ]
            };
      
            if (obj.api.policies && obj.api.policies.inbound && obj.api.policies.inbound.totalThrottlingEnabled) {
              result.proxyEndpoints[0].quotas = [{
                count: 200,
                timeUnit: "day"
              }]
            }
      
            if (obj.environments && obj.environments.length > 0 && obj.environments[0].backendAudienceConfiguration) {
              result.proxyEndpoints[0].auth[0].parameters["audience"] = obj.environments[0].backendAudienceConfiguration.backendAudience;
            }      
            if (obj.api.policies && obj.api.policies.inbound && obj.api.policies.inbound.validateJwtTokenAzureAdV1) {
              result.proxyEndpoints[0].auth[0].parameters["issuerVer1"] = "https://issuerv1.idp.com";
            }
            if (obj.api.policies && obj.api.policies.inbound && obj.api.policies.inbound.validateJwtTokenAzureAdV2) {
              result.proxyEndpoints[0].auth[0].parameters["issuerVer2"] = "https://issuerv2.idp.com";
            }
          }
          catch(error) {
            console.log("Error converting JSON input: " + error);
          }
        }
      }
      catch(error) {
        console.log("Error converting JSON input: " + error);
      }

      resolve(result);
    });
  }
}