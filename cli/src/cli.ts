import arg from 'arg';
import fs from 'fs';
import vm from 'vm';
import inquirer from 'inquirer';
import { ApigeeTemplateInput, ProxiesPlugin, TargetsPlugin, AuthSfPlugin, 
  AuthApiKeyPlugin, QuotaPlugin, SpikeArrestPlugin, ApigeeTemplateService, 
  ApigeeGenerator, proxyTypes, authTypes } from 'apigee-templater-module'
import { ApigeeService, ApiManagementInterface, ProxyRevision, ProxyDeployment} from 'apigee-x-module'

export default class cli {
  apigeeService: ApiManagementInterface = new ApigeeService();

  apigeeGenerator: ApigeeTemplateService = new ApigeeGenerator([
    new SpikeArrestPlugin(),
    new AuthApiKeyPlugin(),
    new AuthSfPlugin(),
    new QuotaPlugin(),
    new TargetsPlugin(),
    new ProxiesPlugin(),
  ]);

  parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
      {
        '--file': String,
        '--input': String,
        '--deploy': Boolean,
        '--environment': String,
        '--filter': String,
        '-f': '--file',
        '-i': '--input',
        '-d': '--deploy',
        '-e': '--environment',
        '-l': '--filter',
      },
      {
        argv: rawArgs.slice(2),
      }
    );
    return {
      file: args['--file'] || "",
      input: args['--input'] || "",
      deploy: args['--deploy'] || false,
      environment: args['--environment'] || "",
      filter: args['--filter'] || ""
    };
   }

   buildGenInput(input): ApigeeTemplateInput {
    var genInput: ApigeeTemplateInput;
  
    if (input.api) {
      try {
        var newInput: ApigeeTemplateInput = {
          name: input.product.apiTestBackendProduct.productName,
          proxyType: proxyTypes.programmable,
          proxyEndpoints: [
            {
              name: "default",
              basePath: input.product.apiTestBackendProduct.productName,
              targetName: "default",
              targetUrl: input.environments[0].backendBaseUrl,
              auth: [
                {
                  type: authTypes.sharedflow,
                  parameters: {}
                }
              ]
            }
          ]
        };
  
        if (input.api.policies && input.api.policies.inbound && input.api.policies.inbound.totalThrottlingEnabled) {
          newInput.proxyEndpoints[0].quotas = [{
            count: 200,
            timeUnit: "day"
          }]
        }
  
        if (input.environments && input.environments.length > 0 && input.environments[0].backendAudienceConfiguration) {
          newInput.proxyEndpoints[0].auth[0].parameters["audience"] = input.environments[0].backendAudienceConfiguration.backendAudience;
        }      
        if (input.api.policies && input.api.policies.inbound && input.api.policies.inbound.validateJwtTokenAzureAdV1) {
          newInput.proxyEndpoints[0].auth[0].parameters["issuerVer1"] = "https://sts.windows.net/30f52344-4663-4c2e-bab3-61bf24ebbed8/";
        }
        if (input.api.policies && input.api.policies.inbound && input.api.policies.inbound.validateJwtTokenAzureAdV2) {
          newInput.proxyEndpoints[0].auth[0].parameters["issuerVer2"] = "https://login.microsoftonline.com/30f52344-4663-4c2e-bab3-61bf24ebbed8/v2.0";
        }
  
        genInput = newInput;
      }
      catch(error) {
        console.log(error);
      }
    }
    else {
      genInput = input as ApigeeTemplateInput;
    }
  
    return genInput;
  }

  process(args) {
    let options = this.parseArgumentsIntoOptions(args);
  
    if (options.filter) {
      // users can add their own preprocessing filter scripts here
      eval(fs.readFileSync(options.filter, "utf-8"));
    }
    
    //options = await promptForMissingOptions(options);
    //console.log(options);
    var genInput: ApigeeTemplateInput;
    if (fs.existsSync(options.file)) {
      var tempInput = JSON.parse(fs.readFileSync(options.file, "utf-8"));
      genInput = this.buildGenInput(tempInput) as ApigeeTemplateInput;
    }
    else if (options.input) {
      var tempInput = JSON.parse(options.input);
      genInput = this.buildGenInput(tempInput) as ApigeeTemplateInput;
    }
    
    var _proxyDir = ".";
    
    this.apigeeGenerator.generateProxy(genInput, _proxyDir).then((result) => {
      console.log("Proxy generation complete!");
  
      if (options.deploy && !options.environment) {
        console.error("Please enter an environment to deploy to with the --environment parameter.");
      }
      else if (options.deploy) {
        this.apigeeService.updateProxy(genInput.name, _proxyDir + "/" + genInput.name + ".zip").then((updateResult: ProxyRevision) => {
          if (updateResult && updateResult.revision) {
            this.apigeeService.deployProxyRevision(options.environment, genInput.name, updateResult.revision).then((deploymentResult) => {
              console.log("Proxy deployment complete!");
            }).catch((error) => {
              console.error("Error deploying proxy. " + error);
            })
          }
        }).catch((error) => {
          if (error && error.response && error.response.status && error.response.status == 400)
            console.error(`Error deploying ${genInput.name}, bundle has errors.`);
          else
            console.error(`Error deploying ${genInput.name}.`);
        });
      }
    }).catch((error) => {
      console.error("Error generating proxy. " + error);
    });
  
  }  
}


// async function promptForMissingOptions(options) {
//   const defaultTemplate = 'JavaScript';
//   if (options.skipPrompts) {
//     return {
//       ...options,
//       template: options.template || defaultTemplate,
//     };
//   }
 
//   const questions = [];
//   if (!options.template) {
//     questions.push({
//       type: 'list',
//       name: 'template',
//       message: 'Please choose which project template to use',
//       choices: ['JavaScript', 'TypeScript'],
//       default: defaultTemplate,
//     });
//   }
 
//   if (!options.git) {
//     questions.push({
//       type: 'confirm',
//       name: 'git',
//       message: 'Initialize a git repository?',
//       default: false,
//     });
//   }
 
//   const answers = await inquirer.prompt(questions);
//   return {
//     ...options,
//     template: options.template || answers.template,
//     git: options.git || answers.git,
//   };
//  }



