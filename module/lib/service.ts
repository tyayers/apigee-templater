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
import { start } from 'repl';

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

  constructor(plugins: ApigeeTemplatePlugin[], converterPlugins: ApigeeConverterPlugin[]) {
    if (plugins && plugins.length > 0)
      this.plugins = plugins;

    if (converterPlugins && converterPlugins.length > 0)
      this.converterPlugins = converterPlugins;
  }

  convertStringToTemplate(inputString: string): Promise<ApigeeTemplateInput> {
    return new Promise((resolve, reject) => {
      let result: ApigeeTemplateInput = undefined;
      let conversions: Promise<ApigeeTemplateInput>[] = [];
      for (let plugin of this.converterPlugins) {
        conversions.push(plugin.convertInput(inputString));
      }

      Promise.all(conversions).then((values) => {
        for(let value of values) {
          if (value) {
            result = value;
            break;
          }
        }
      }).finally(() => {
        if (result)
          resolve(result);
        else
          reject("Input string could not be converted to a valid template.")
      });
    });
  }

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

  generateProxy(genInput: ApigeeTemplateInput, outputDir: string): Promise<GenerateResult> {
    return new Promise((resolve, reject) => {
      var startTime = performance.now();

      let result: GenerateResult = {
        success: true,
        duration: 0,
        message: ""
      }

      let processingVars: Map<string, any> = new Map<string, any>();
      let newOutputDir = outputDir + "/" + genInput.name + "/apiproxy";
      fs.mkdirSync(newOutputDir, { recursive: true });

      fs.mkdirSync(newOutputDir + "/proxies", { recursive: true });
      fs.mkdirSync(newOutputDir + "/targets", { recursive: true });
      fs.mkdirSync(newOutputDir + "/policies", { recursive: true });
      fs.mkdirSync(newOutputDir + "/resources", { recursive: true });

      for (let endpoint of genInput.proxyEndpoints) {
        // Initialize variables for endpoint
        processingVars["preflow_request_policies"] = [];
        processingVars["preflow_response_policies"] = [];
        processingVars["postflow_request_policies"] = [];
        processingVars["postflow_response_policies"] = [];

        for (let plugin of this.plugins) {
          plugin.applyTemplate(endpoint, processingVars).then((result: PlugInResult) => {
            result.files.forEach((file: PlugInFile) => {
              fs.writeFileSync(newOutputDir + file.path, file.contents);
            });
          });
        }
      }
    
      var archive = archiver('zip');
      archive.on('error', function(err) {
        reject(err);
      });
    
      archive.directory(outputDir + "/" + genInput.name, false);
    
      var output = fs.createWriteStream(outputDir + "/" + genInput.name + ".zip");
    
      archive.on('end', () => {
        // Zip is finished, cleanup files
        fs.rmdirSync(outputDir + "/" + genInput.name, {recursive: true});
        var endTime = performance.now();
        result.duration = endTime - startTime;
        result.message = `Proxy generation completed in ${result.duration} milliseconds.`

        resolve(result);
      });
    
      archive.pipe(output);
      archive.finalize();
    });
  }
}