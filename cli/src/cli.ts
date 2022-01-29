import arg from 'arg';
import fs from 'fs';
import vm from 'vm';
import { performance } from 'perf_hooks';
import inquirer from 'inquirer';
import chalk from 'chalk';
import 'dotenv/config'

import {
  ApigeeTemplateInput, ProxiesPlugin, TargetsPlugin, AuthSfPlugin,
  AuthApiKeyPlugin, QuotaPlugin, SpikeArrestPlugin, ApigeeTemplateService,
  ApigeeGenerator, proxyTypes, authTypes, Json1Converter, Json2Converter, OpenApiV3Converter
} from 'apigee-templater-module'
import { ApigeeService, ApiManagementInterface, ProxyRevision, ProxyDeployment } from 'apigee-x-module'

export default class cli {
  apigeeService: ApiManagementInterface = new ApigeeService();

  apigeeGenerator: ApigeeTemplateService = new ApigeeGenerator([
    new SpikeArrestPlugin(),
    new AuthApiKeyPlugin(),
    new AuthSfPlugin(),
    new QuotaPlugin(),
    new TargetsPlugin(),
    new ProxiesPlugin(),
  ], [
    new Json1Converter(),
    new Json2Converter(),
    new OpenApiV3Converter()
  ]);

  parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
      {
        '--file': String,
        '--input': String,
        '--deploy': Boolean,
        '--environment': String,
        '--filter': String,
        '--name': String,
        '--basePath': String,
        '--targetUrl': String,
        '--verbose': Boolean,
        '--keyPath': String,
        '--help': Boolean,
        '-f': '--file',
        '-i': '--input',
        '-d': '--deploy',
        '-e': '--environment',
        '-l': '--filter',
        '-n': '--name',
        '-b': '--basePath',
        '-t': '--targetUrl',
        '-v': '--verbose',
        '-k': '--keyPath',
        '-h': '--help'
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
      filter: args['--filter'] || "",
      name: args['--name'] || "",
      basePath: args['--basePath'] || "",
      targetUrl: args['--targetUrl'] || "",
      verbose: args['--verbose'] || false,
      keyPath: args['--keyPath'] || "",
      help: args['--help'] || false
    };
  }

  async promptForMissingOptions(options: cliArgs): Promise<cliArgs> {

    const questions = [];
    if (!options.name) {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'What should the proxy be called?',
        default: 'MyProxy',
        transformer: (input, answer) => {
          return input.replace(/ /g, "-");
        }
      });
    }

    if (!options.basePath) {
      questions.push({
        type: 'input',
        name: 'basePath',
        message: 'Which base path should be used?',
        transformer: (input, answer) => {
          return `/${input}`;
        }
      });
    }

    if (!options.targetUrl) {
      questions.push({
        type: 'input',
        name: 'targetUrl',
        message: 'Which backend target should be called?',
        transformer: (input, answer) => {
          return `https://${input}`;
        }
      });
    }

    if (!options.deploy) {
      questions.push({
        type: 'confirm',
        name: 'deploy',
        message: 'Do you want to deploy the proxy to an Apigee X environment?'
      });
    }

    if (!options.keyPath) {
      questions.push({
        type: 'input',
        name: 'keyPath',
        message: 'No GOOGLE_APPLICATION_CREDENTIALS found, please enter a path to a GCP project JSON key:',
        when: (answers) => {
          return answers.deploy
        }
      });
    }

    if (!options.environment) {
      questions.push({
        type: 'list',
        name: 'environment',
        message: 'Which Apigee X environment to you want to deploy to?',
        when: (answers) => {
          return answers.deploy
        },
        choices: (answers) => {
          if (answers.keyPath) process.env.GOOGLE_APPLICATION_CREDENTIALS = answers.keyPath;
          return this.apigeeService.getEnvironments()
        }
      });
    }

    const answers = await inquirer.prompt(questions);
    if (answers.basePath && !answers.basePath.startsWith("/"))
      answers.basePath = "/" + answers.basePath;

    if (answers.targetUrl && !answers.targetUrl.startsWith("https://"))
      answers.targetUrl = "https://" + answers.targetUrl;

    return {
      ...options,
      name: options.name || answers.name,
      basePath: options.basePath || answers.basePath,
      targetUrl: options.targetUrl || answers.targetUrl,
      deploy: options.deploy || answers.deploy,
      environment: options.environment || answers.environment,
      keyPath: options.keyPath || answers.keyPath,
    };
  }

  printHelp() {
    console.log("")
    console.log(`${chalk.bold(chalk.greenBright("Simple examples:"))}`);
    console.log(`apigee-template ${chalk.grey("# Start interactive mode to enter the parameters.")}`)
    console.log(`apigee-template -n TestProxy -b /httpbin -t https://httpbin.org ${chalk.grey("# Create a proxy called TestProxy under the base path /test to https://httpbin.org > will produce a TestProxy.zip bundle.")}`)
    console.log(`apigee-template -n TestProxy -b /httpbin -t https://httpbin.org -d -e test1 ${chalk.grey("# Create a proxy called TestProxy and deploy to the Apigee X environment 'test1'.")}`)
    console.log(`apigee-template -f ./PetStore.yaml -d -e test1 ${chalk.grey("# Create a proxy based on the PetStore.yaml file and deploy to environment 'test1'")}`)

    console.log("");
    console.log(`${chalk.bold(chalk.greenBright("All commands:"))}`);
    for (let line of helpCommands) {
      console.log(`${chalk.bold(chalk.green(line.name))}: ${chalk.grey(line.description)} `)
    }
    console.log("");
  }

  async process(args) {
    let options: cliArgs = this.parseArgumentsIntoOptions(args);
    if (options.keyPath) process.env.GOOGLE_APPLICATION_CREDENTIALS = options.keyPath;
    if (options.verbose) this.logVerbose(JSON.stringify(options), "options:");

    if (options.help) {
      this.printHelp();
      return;
    }
    else {
      console.log(`${chalk.green(">")} ${chalk.bold(chalk.greenBright("Welcome to apigee-template"))}, use -h for more command line options. `);
    }

    if (fs.existsSync(options.file)) {
      options.input = fs.readFileSync(options.file, "utf-8");
    }

    if (!options.input && !options.file) {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) options.keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      options = await this.promptForMissingOptions(options);
      let newInput: ApigeeTemplateInput = {
        name: options.name,
        proxyEndpoints: [
          {
            name: "default",
            basePath: options.basePath,
            targetName: "default",
            targetUrl: options.targetUrl
          }
        ]
      }
      options.input = JSON.stringify(newInput);
    }

    var _proxyDir = ".";

    if (options.filter) {
      // users can add their own preprocessing filter scripts here
      eval(fs.readFileSync(options.filter, "utf-8"));
    }

    if (options.verbose) this.logVerbose(options.input, "template:");

    this.apigeeGenerator.generateProxyFromString(options.input, _proxyDir).then((result) => {
      console.log(`${chalk.green(">")} Proxy ${chalk.bold(chalk.blue(result.template.name))} generated to ${chalk.magentaBright(chalk.bold(result.localPath))} in ${chalk.bold(chalk.green(Math.round(result.duration) + " milliseconds"))}.`);

      if (options.deploy && !options.environment) {
        console.error(`${chalk.redBright("> Error:")} No environment found to deploy to, please pass the -e parameter with an Apigee X environment.`);
      }
      else if (options.deploy && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error(`${chalk.redBright("> Error:")} No GCP credentials found, please set the GOOGLE_APPLICATION_CREDENTIALS environment variable or use the -k parameter, see https://cloud.google.com/docs/authentication/getting-started for more information.`);
      }
      else if (options.deploy) {
        var startTime = performance.now();
        this.apigeeService.updateProxy(result.template.name, _proxyDir + "/" + result.template.name + ".zip").then((updateResult: ProxyRevision) => {
          if (updateResult && updateResult.revision) {
            this.apigeeService.deployProxyRevision(options.environment, result.template.name, updateResult.revision).then((deploymentResult) => {
              var endTime = performance.now();
              var duration = endTime - startTime;
              console.log(`${chalk.green(">")} Proxy ${chalk.bold(chalk.blue(result.template.name + " version " + updateResult.revision))} deployed to environment ${chalk.bold(chalk.magentaBright(options.environment))} in ${chalk.bold(chalk.green(Math.round(duration) + " milliseconds"))}.`);
            }).catch((error) => {
              console.error("Error deploying proxy. " + error);
            })
          }
        }).catch((error) => {
          if (error && error.response && error.response.status && error.response.status == 400)
            console.error(`Error deploying ${result.template.name}, bundle has errors.`);
          else
            console.error(`Error deploying ${result.template.name}.`);
        });
      }
    }).catch((error) => {
      console.error("Error generating proxy. " + error);
    });

  }

  logVerbose(input, label) {
    //console.log("");
    if (label) console.log(`${chalk.grey("> " + label)}`)
    console.log(`${chalk.grey("> " + input)}`)
    //console.log("");
  }
}

class cliArgs {
  file: string = "";
  input: string = "";
  deploy: boolean = false;
  environment: string = "";
  filter: string = "";
  name: string = "";
  basePath: string = "";
  targetUrl: string = "";
  verbose: boolean = false;
  keyPath: string = "";
  help: boolean = false;
}

const helpCommands = [
  {
    name: "--file, -f",
    description: "Path to a JSON or OpenAPIv3 YAML file with a proxy definition."
  },
  {
    name: "--input, -i",
    description: "Same as --file, but with the input directly as a string in this parameter."
  },
  {
    name: "--deploy, -d",
    description: "Boolean true or false if the generated proxy should also be deployed to an Apigee X environment."
  },
  {
    name: "--environment, -e",
    description: "If --deploy is true, the environment to deploy the proxy to."
  },
  {
    name: "--filter, -l",
    description: "Path to an optional javascript file that will be evaluated before any processing is done, can be used to add conversion plugins or inject other logic into the conversion."
  },
  {
    name: "--name, -n",
    description:  "If no --file or --input parameters are specified, this can set the proxy name directly for a simple proxy."
  },
  {
    name: "--basePath, -b",
    description: "If no --file or --input parameters are specified, this can set the basePath directly."
  },
  {
    name: "--targetUrl, t",
    description: "If no --file or --input parameters are specified, this can set the target URL directly."
  },
  {
    name: "--verbose, -v",
    description: "If extra logging information should be printed during the conversion and deployment."
  },
  {
    name: "--keyPath, -k",
    description: "If no GOOGLE_APPLICATION_CREDENTIALS are set to authorize the proxy deployment, this can point to a GCP service account JSON key file to use for authorization."
  }
];






