import { ApigeeConverterPlugin, ApigeeTemplateInput } from "../interfaces";

export class Json1Converter implements ApigeeConverterPlugin {
  convertInput(input: string): Promise<ApigeeTemplateInput> {
    return new Promise((resolve, reject) => {
      let result: ApigeeTemplateInput = undefined;

      try {
        result = JSON.parse(input) as ApigeeTemplateInput;
      }
      catch(error) {
        console.error(error);
      }

      resolve(result);
    });
  }
}