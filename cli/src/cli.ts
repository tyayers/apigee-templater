import arg from 'arg';
import fs from 'fs';
import inquirer from 'inquirer';
import { ApigeeGenerator, ApigeeGenService, ApigeeGenInput, proxyTypes, authTypes } from 'apigee-templater-module'
import { ApigeeService, ApiManagementInterface, ProxyRevision, ProxyDeployment} from 'apigee-x-module'

const apigeeGenerator: ApigeeGenService = new ApigeeGenerator();
const apigeeService: ApiManagementInterface = new ApigeeService();

function parseArgumentsIntoOptions(rawArgs) {
 const args = arg(
   {
     '--file': String,
     '--input': String,
     '--deploy': Boolean,
     '--environment': String,
     '-f': '--file',
     '-i': '--input',
     '-d': '--deploy',
     '-e': '--environment'
   },
   {
     argv: rawArgs.slice(2),
   }
 );
 return {
   file: args['--file'] || "",
   input: args['--input'] || "",
   deploy: args['--deploy'] || false,
   environment: args['--environment' || ""]
 };
}

async function promptForMissingOptions(options) {
  const defaultTemplate = 'JavaScript';
  if (options.skipPrompts) {
    return {
      ...options,
      template: options.template || defaultTemplate,
    };
  }
 
  const questions = [];
  if (!options.template) {
    questions.push({
      type: 'list',
      name: 'template',
      message: 'Please choose which project template to use',
      choices: ['JavaScript', 'TypeScript'],
      default: defaultTemplate,
    });
  }
 
  if (!options.git) {
    questions.push({
      type: 'confirm',
      name: 'git',
      message: 'Initialize a git repository?',
      default: false,
    });
  }
 
  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    template: options.template || answers.template,
    git: options.git || answers.git,
  };
 }

async function buildGenInput(input): ApigeeGenInput {
  var genInput: ApigeeGenInput;

  if (input.api) {
    try {
      var newInput: ApigeeGenInput = {
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
    genInput = input as ApigeeGenInput;
  }

  return genInput;
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  //options = await promptForMissingOptions(options);
  //console.log(options);
  var genInput: ApigeeGenInput;
  if (fs.existsSync(options.file)) {
    var tempInput = JSON.parse(fs.readFileSync(options.file, "utf-8"));
    genInput = await buildGenInput(tempInput) as ApigeeGenInput;
  }
  else if (options.input) {
    var tempInput = JSON.parse(options.input);
    genInput = await buildGenInput(tempInput) as ApigeeGenInput;
  }
  
  var _proxyDir = ".";
  
  apigeeGenerator.generateProxy(genInput, _proxyDir).then((result) => {
    console.log("Proxy generation complete!");

    if (options.deploy && !options.environment) {
      console.error("Please enter an environment to deploy to with the --environment parameter.");
    }
    else if (options.deploy) {
      apigeeService.updateProxy(genInput.name, _proxyDir + "/" + genInput.name + ".zip").then((updateResult: ProxyRevision) => {
        if (updateResult && updateResult.revision) {
          apigeeService.deployProxyRevision(options.input, genInput.name, updateResult.revision).then((deploymentResult) => {
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