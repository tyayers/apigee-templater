import { ApigeeConverterPlugin, ApigeeTemplateInput } from "../interfaces";


/**
 * Converter from input string JSON format to ApigeeConverterPlugin
 * @date 2/11/2022 - 10:30:33 AM
 *
 * @export
 * @class Json1Converter
 * @typedef {Json1Converter}
 * @implements {ApigeeConverterPlugin}
 */
export class Json1Converter implements ApigeeConverterPlugin {

  /**
   * Converts input string in JSON format to the ApigeeTemplateInput object (if possible)
   * @date 2/11/2022 - 10:31:04 AM
   *
   * @param {string} input Input string in JSON format
   * @return {Promise<ApigeeTemplateInput>} ApigeeTemplateInput object or undefined if wrong input format
   */
  convertInput(input: string): Promise<ApigeeTemplateInput> {
    return new Promise((resolve) => {
      let result: ApigeeTemplateInput = undefined;

      try {
        const inputData = JSON.parse(input);
        if (inputData.name && inputData.proxyEndpoints)
          result = inputData as ApigeeTemplateInput;
      }
      catch(error) {
        console.error(error);
      }

      resolve(result);
    });
  }
}