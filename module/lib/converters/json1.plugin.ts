import { ApigeeConverterPlugin, ApigeeTemplateInput } from "../interfaces";

export class Json1Converter implements ApigeeConverterPlugin {
  convertInput(input: string): Promise<ApigeeTemplateInput> {
    return new Promise((resolve, reject) => {
      let result: ApigeeTemplateInput = undefined;

      try {
        let inputData = JSON.parse(input);
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