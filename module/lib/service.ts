import archiver from 'archiver';
import fs from 'fs';
import { performance } from 'perf_hooks';
import { ApigeeTemplateService, ApigeeTemplatePlugin, ApigeeTemplateInput, PlugInResult, PlugInFile, ApigeeConverterPlugin, GenerateResult } from "./interfaces";
import { ProxiesPlugin } from "./plugins/proxies.plugin";
import { TargetsPlugin } from "./plugins/targets.plugin";
import { AuthSfPlugin } from "./plugins/auth.sf.plugin";
import { AuthApiKeyPlugin } from "./plugins/auth.apikey.plugin";
import { QuotaPlugin } from "./plugins/traffic.quota.plugin";
import { SpikeArrestPlugin } from "./plugins/traffic.spikearrest.plugin";
import { Json1Converter } from "./converters/json1.plugin";
import { Json2Converter } from "./converters/json2.plugin";
import { OpenApiV3Converter } from "./converters/openapiv3.yaml.plugin";

/**
 * ApigeeGenerator runs the complete templating operation with all injected plugins
 * @date 2/14/2022 - 8:22:47 AM
 *
 * @export
 * @class ApigeeGenerator
 * @typedef {ApigeeGenerator}
 * @implements {ApigeeTemplateService}
 */
export class ApigeeGenerator implements ApigeeTemplateService {

  // Default Plugins
  plugins: ApigeeTemplatePlugin[] = [
    new SpikeArrestPlugin(),
    new AuthApiKeyPlugin(),
    new AuthSfPlugin(),
    new QuotaPlugin(),
    new TargetsPlugin(),
    new ProxiesPlugin(),
  ];
  converterPlugins: ApigeeConverterPlugin[] = [
    new Json1Converter(),
    new Json2Converter(),
    new OpenApiV3Converter()
  ];

  /**
   * Creates an instance of ApigeeGenerator.
   * @date 2/14/2022 - 8:23:53 AM
   *
   * @constructor
   * @param {ApigeeTemplatePlugin[]} plugins
   * @param {ApigeeConverterPlugin[]} converterPlugins
   */
  constructor(plugins: ApigeeTemplatePlugin[], converterPlugins: ApigeeConverterPlugin[]) {
    if (plugins && plugins.length > 0)
      this.plugins = plugins;

    if (converterPlugins && converterPlugins.length > 0)
      this.converterPlugins = converterPlugins;
  }

  /**
   * Converts an input string into a template input object
   * @date 2/14/2022 - 8:24:03 AM
   *
   * @param {string} inputString
   * @return {Promise<ApigeeTemplateInput>}
   */
  convertStringToTemplate(inputString: string): Promise<ApigeeTemplateInput> {
    return new Promise((resolve, reject) => {
      let result: ApigeeTemplateInput = undefined;
      const conversions: Promise<ApigeeTemplateInput>[] = [];
      for (const plugin of this.converterPlugins) {
        conversions.push(plugin.convertInput(inputString));
      }

      Promise.all(conversions).then((values) => {
        for (const value of values) {
          if (value) {
            result = value;
            break;
          }
        }
      }).finally(() => {
        if (result)
          resolve(result);
        else
          reject(new Error("Input string could not be converted to a valid template."))
      });
    });
  }

  /**
   * Generates a proxy bundle based on an input string
   * @date 2/14/2022 - 8:25:31 AM
   *
   * @param {string} inputString
   * @param {string} outputDir
   * @return {Promise<GenerateResult>} Result including path to generated proxy bundle
   */
  generateProxyFromString(inputString: string, outputDir: string): Promise<GenerateResult> {
    return new Promise((resolve, reject) => {
      this.convertStringToTemplate(inputString).then((result) => {
        this.generateProxy(result, outputDir).then((generateResult) => {
          resolve(generateResult);
        })
      }).catch((error) => {
        console.error(error);
        reject(error);
      })
    });
  }

  /**
   * Main generate proxy method with correct input object
   * @date 2/14/2022 - 8:26:00 AM
   *
   * @param {ApigeeTemplateInput} genInput
   * @param {string} outputDir
   * @return {Promise<GenerateResult>} GenerateResult object including path to generated proxy bundle
   */
  generateProxy(genInput: ApigeeTemplateInput, outputDir: string): Promise<GenerateResult> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();

      const result: GenerateResult = {
        success: true,
        duration: 0,
        message: "",
        localPath: ""
      }

      const processingVars: Map<string, object> = new Map<string, object>();
      const newOutputDir = outputDir + "/" + genInput.name + "/apiproxy";
      fs.mkdirSync(newOutputDir, { recursive: true });

      fs.mkdirSync(newOutputDir + "/proxies", { recursive: true });
      fs.mkdirSync(newOutputDir + "/targets", { recursive: true });
      fs.mkdirSync(newOutputDir + "/policies", { recursive: true });
      fs.mkdirSync(newOutputDir + "/resources", { recursive: true });

      for (const endpoint of genInput.proxyEndpoints) {
        // Initialize variables for endpoint
        processingVars["preflow_request_policies"] = [];
        processingVars["preflow_response_policies"] = [];
        processingVars["postflow_request_policies"] = [];
        processingVars["postflow_response_policies"] = [];

        for (const plugin of this.plugins) {
          plugin.applyTemplate(endpoint, processingVars).then((result: PlugInResult) => {
            result.files.forEach((file: PlugInFile) => {
              fs.writeFileSync(newOutputDir + file.path, file.contents);
            });
          });
        }
      }

      const archive = archiver('zip');
      archive.on('error', function (err) {
        reject(err);
      });

      archive.directory(outputDir + "/" + genInput.name, false);

      const output = fs.createWriteStream(outputDir + "/" + genInput.name + ".zip");

      archive.on('end', () => {
        // Zip is finished, cleanup files
        fs.rmdirSync(outputDir + "/" + genInput.name, { recursive: true });
        const endTime = performance.now();
        result.duration = endTime - startTime;
        result.message = `Proxy generation completed in ${Math.round(result.duration)} milliseconds.`
        result.localPath = outputDir + "/" + genInput.name + ".zip";
        result.template = genInput;

        resolve(result);
      });

      archive.pipe(output);
      archive.finalize();
    });
  }
}