import yaml from "js-yaml";
import { ApigeeConverterPlugin, ApigeeTemplateInput } from "../interfaces";

/**
 * Converter from OpenAPI spec v3 format to ApigeeTemplateInput
 * @date 2/11/2022 - 10:36:31 AM
 *
 * @export
 * @class OpenApiV3Converter
 * @typedef {OpenApiV3Converter}
 * @implements {ApigeeConverterPlugin}
 */
export class OpenApiV3Converter implements ApigeeConverterPlugin {

  /**
   * Converts input string in OpenAPI v3 YAML format to ApigeeTemplateInput (if possible)
   * @date 2/11/2022 - 10:36:51 AM
   *
   * @param {string} input Input string in OpenAPI v3 YAML format
   * @return {Promise<ApigeeTemplateInput>} ApigeeTemplateInput object (or undefined if not possible to convert)
   */
  convertInput(input: string): Promise<ApigeeTemplateInput> {
    return new Promise((resolve) => {
      let result: ApigeeTemplateInput = undefined;

      try {
        const specObj = yaml.load(input);

        if (specObj && specObj.servers && specObj.servers.length > 0) {

          result = {
            name: specObj.info.title.replace(" ", "-"),
            proxyEndpoints: [
              {
                name: "default",
                basePath: Object.keys(specObj.paths)[0].replace("/", ""),
                targetName: "default",
                targetUrl: specObj.servers[0].url.replace("http://", "").replace("https://", "")
              }
            ]
          };
        }
      }
      catch (error) {
        console.error(error);
      }

      resolve(result);
    });
  }
}