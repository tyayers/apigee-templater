import { jsyaml } from "js-yaml";
import { ApigeeConverterPlugin, ApigeeTemplateInput, authTypes, proxyTypes } from "../interfaces";

export class OpenApiV3Converter implements ApigeeConverterPlugin {
  convertInput(input: string): Promise<ApigeeTemplateInput> {
    return new Promise((resolve, reject) => {
      let result: ApigeeTemplateInput = undefined;

      try {
        const specObj = jsyaml.load(input);

        if (specObj && specObj.servers && specObj.servers.length > 0) {

          result = {
            name: specObj.info.title.replace(" ", "-"),
            proxyType: proxyTypes.programmable,
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
      catch(error) {
        console.error(error);
      }

      resolve(result);
    });
  }
}