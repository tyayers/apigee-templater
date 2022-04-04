/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import arg from 'arg'
import fs from 'fs'
import { performance } from 'perf_hooks'
import inquirer from 'inquirer'
import chalk from 'chalk'
import 'dotenv/config'

import { ApigeeTemplateInput, ApigeeTemplateService, ApigeeGenerator } from 'apigee-templater-module'
import { ApigeeService, ApiManagementInterface, ProxyRevision } from 'apigee-x-module'

/**
 * The CLI class parses and collects the user inputs, and generates / depoys the proxy on-demand.
 * @date 1/31/2022 - 8:47:32 AM
 *
 * @export
 * @class cli
 * @typedef {cli}
 */
export default class cli {
  /**
   * The ApigeeService object, using default application credentials
   * @date 3/16/2022 - 11:20:23 AM
   *
   * @type {ApiManagementInterface}
   */
  apigeeService: ApiManagementInterface = new ApigeeService();

  /**
   * The ApigeeGenerator object using the default profile of plugins
   * @date 3/16/2022 - 11:20:50 AM
   *
   * @type {ApigeeTemplateService}
   */
  apigeeGenerator: ApigeeTemplateService = new ApigeeGenerator();

  /**
   * Parses the user inputs
   * @date 1/31/2022 - 8:47:02 AM
   *
   * @param {cliArgs} rawArgs The command line arguments
   * @return {cliArgs}} Processed arguments
   */
  parseArgumentsIntoOptions (rawArgs: string[]): cliArgs {
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
        argv: rawArgs.slice(2)
      }
    )
    return {
      file: args['--file'] || '',
      input: args['--input'] || '',
      deploy: args['--deploy'] || false,
      environment: args['--environment'] || '',
      filter: args['--filter'] || '',
      name: args['--name'] || '',
      basePath: args['--basePath'] || '',
      targetUrl: args['--targetUrl'] || '',
      verbose: args['--verbose'] || false,
      keyPath: args['--keyPath'] || '',
      help: args['--help'] || false
    }
  }

  /**
   * Prompts the user for any missing inputs
   * @param {cliArgs} options The options collection of user inputs
   * @return {cliArgs} Updated cliArgs options collection
   */
  async promptForMissingOptions (options: cliArgs): Promise<cliArgs> {
    const questions = []
    if (!options.name) {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'What should the proxy be called?',
        default: 'MyProxy',
        transformer: (input: string) => {
          return input.replace(/ /g, '-')
        }
      })
    }

    if (!options.basePath) {
      questions.push({
        type: 'input',
        name: 'basePath',
        message: 'Which base path should be used?',
        transformer: (input: string) => {
          return `/${input}`
        }
      })
    }

    if (!options.targetUrl) {
      questions.push({
        type: 'input',
        name: 'targetUrl',
        message: 'Which backend target should be called?',
        transformer: (input: string) => {
          return `https://${input}`
        }
      })
    }

    if (!options.deploy) {
      questions.push({
        type: 'confirm',
        name: 'deploy',
        message: 'Do you want to deploy the proxy to an Apigee X environment?'
      })
    }

    if (!options.keyPath) {
      questions.push({
        type: 'input',
        name: 'keyPath',
        message: 'No GOOGLE_APPLICATION_CREDENTIALS found, please enter a path to a GCP project JSON key:',
        when: (answers: cliArgs) => {
          return answers.deploy
        }
      })
    }

    if (!options.environment) {
      questions.push({
        type: 'list',
        name: 'environment',
        message: 'Which Apigee X environment to you want to deploy to?',
        when: (answers: cliArgs) => {
          return answers.deploy
        },
        choices: (answers: cliArgs) => {
          if (answers.keyPath) process.env.GOOGLE_APPLICATION_CREDENTIALS = answers.keyPath

          this.apigeeService.getEnvironments().then((result) => {
            return result
          }).catch(() => {
            console.error(`${chalk.redBright('! Error:')} Invalid GCP service account key file passed, please pass a service account with Apigee deployment roles attached.`)
            return []
          })
        }
      })
    }

    const answers = await inquirer.prompt(questions)
    if (answers.basePath && !answers.basePath.startsWith('/')) { answers.basePath = '/' + answers.basePath }

    if (answers.targetUrl && !answers.targetUrl.startsWith('https://')) { answers.targetUrl = 'https://' + answers.targetUrl }

    return {
      ...options,
      name: options.name || answers.name,
      basePath: options.basePath || answers.basePath,
      targetUrl: options.targetUrl || answers.targetUrl,
      deploy: options.deploy || answers.deploy,
      environment: options.environment || answers.environment,
      keyPath: options.keyPath || answers.keyPath
    }
  }

  /**
   * Prints example and full commands
   **/
  printHelp () {
    console.log('')
    console.log(`${chalk.bold(chalk.blueBright('Simple examples:'))}`)
    console.log(`apigee-template ${chalk.grey('# Start interactive mode to enter the parameters.')}`)
    console.log(`apigee-template -n TestProxy -b /httpbin -t https://httpbin.org ${chalk.grey('# Create a proxy called TestProxy under the base path /test to https://httpbin.org > will produce a TestProxy.zip bundle.')}`)
    console.log(`apigee-template -n TestProxy -b /httpbin -t https://httpbin.org -d -e test1 ${chalk.grey("# Create a proxy called TestProxy and deploy to the Apigee X environment 'test1'.")}`)
    console.log(`apigee-template -f ./PetStore.yaml -d -e test1 ${chalk.grey("# Create a proxy based on the PetStore.yaml file and deploy to environment 'test1'")}`)

    console.log('')
    console.log(`${chalk.bold(chalk.blueBright('All parameters:'))}`)
    for (const line of helpCommands) {
      console.log(`${chalk.bold(chalk.green(line.name))}: ${chalk.grey(line.description)} `)
    }
  }

  /**
   * Process the user inputs and generates / deploys the proxy
   * @date 1/31/2022 - 8:42:28 AM
   *
   * @async
   * @param {cliArgs} args The user input args to the process
   */
  async process (args: string[]) {
    let options: cliArgs = this.parseArgumentsIntoOptions(args)
    if (options.keyPath) process.env.GOOGLE_APPLICATION_CREDENTIALS = options.keyPath
    if (options.verbose) this.logVerbose(JSON.stringify(options), 'options:')

    console.log(`${chalk.green('>')} ${chalk.bold(chalk.greenBright('Welcome to apigee-template'))}, use -h for more command line options. `)

    if (options.help) {
      this.printHelp()
      return
    }

    if (fs.existsSync(options.file)) {
      options.input = fs.readFileSync(options.file, 'utf-8')
    }

    if (!options.input && !options.file) {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) options.keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
      try {
        options = await this.promptForMissingOptions(options)
      } catch (error) {
        console.error(`${chalk.redBright('! Error:')} Invalid GCP service account key file passed, please pass a service account with Apigee deployment roles attached.`)
      }

      const newInput: ApigeeTemplateInput = new ApigeeTemplateInput({
        name: options.name,
        proxyEndpoints: [
          {
            name: 'default',
            basePath: options.basePath,
            targetName: 'default',
            targetUrl: options.targetUrl
          }
        ]
      })

      options.input = JSON.stringify(newInput)
    }

    const _proxyDir = '.'

    if (options.filter) {
      // users can add their own preprocessing filter scripts here
      // eslint-disable-next-line
      eval(fs.readFileSync(options.filter, 'utf-8'))
    }

    if (options.verbose) this.logVerbose(options.input, 'template:')

    this.apigeeGenerator.generateProxyFromString(options.input, _proxyDir).then((result) => {
      if (result && result.template) { console.log(`${chalk.green('>')} Proxy ${chalk.bold(chalk.blue(result.template.name))} generated to ${chalk.magentaBright(chalk.bold(result.localPath))} in ${chalk.bold(chalk.green(Math.round(result.duration) + ' milliseconds'))}.`) }

      if (options.deploy && !options.environment) {
        console.error(`${chalk.redBright('! Error:')} No environment found to deploy to, please pass the -e parameter with an Apigee X environment.`)
      } else if (options.deploy && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error(`${chalk.redBright('! Error:')} No GCP credentials found, please set the GOOGLE_APPLICATION_CREDENTIALS environment variable or use the -k parameter, see https://cloud.google.com/docs/authentication/getting-started for more information.`)
      } else if (options.deploy) {
        const startTime = performance.now()
        if (result && result.template) {
          this.apigeeService.updateProxy(result.template.name, _proxyDir + '/' + result.template.name + '.zip').then((updateResult: ProxyRevision) => {
            if (updateResult && updateResult.revision) {
              if (result && result.template) {
                this.apigeeService.deployProxyRevision(options.environment, result.template.name, updateResult.revision).then(() => {
                  const endTime = performance.now()
                  const duration = endTime - startTime
                  if (result && result.template) { console.log(`${chalk.green('>')} Proxy ${chalk.bold(chalk.blue(result.template.name + ' version ' + updateResult.revision))} deployed to environment ${chalk.bold(chalk.magentaBright(options.environment))} in ${chalk.bold(chalk.green(Math.round(duration) + ' milliseconds'))}.`) }
                }).catch(() => {
                  console.error(`${chalk.redBright('! Error:')} Error deploying proxy revision.`)
                })
              }
            }
          }).catch((error) => {
            if (error && error.response && error.response.status && error.response.status === 400) { console.error(`${chalk.redBright('! Error:')} Error in proxy bundle definition, try importing manually for more detailed error information.`) } else { console.error(`${chalk.redBright('! Error:')} Error deploying proxy revision.`) }
          })
        }
      }
    }).catch(() => {
      console.error(`${chalk.redBright('! Error:')} Error templating proxy, invalid inputs given.`)
      process.exit()
    })
  }

  /**
   * Logs a verbose message to the console
   * @date 1/31/2022 - 8:45:46 AM
   *
   * @param {string} input The text message to log
   * @param {string} label An optional label as prefix label
   */
  logVerbose (input: string, label: string) {
    if (label) console.log(`${chalk.grey('> ' + label)}`)
    console.log(`${chalk.grey('> ' + input)}`)
  }
}

/**
 * Class to model the user input collection
 * @date 1/31/2022 - 8:46:19 AM
 *
 * @class cliArgs
 * @typedef {cliArgs}
 */
class cliArgs {
  file = '';
  input = '';
  deploy = false;
  environment = '';
  filter = '';
  name = '';
  basePath = '';
  targetUrl = '';
  verbose = false;
  keyPath = '';
  help = false;
}

/**
 * Collection of the help commands to print on-demand
 * @date 1/31/2022 - 8:46:40 AM
 *
 * @type {{}}
 */
const helpCommands = [
  {
    name: '--file, -f',
    description: 'Path to a JSON or OpenAPIv3 YAML file with a proxy definition.'
  },
  {
    name: '--input, -i',
    description: 'Same as --file, but with the input directly as a string in this parameter.'
  },
  {
    name: '--deploy, -d',
    description: 'Boolean true or false if the generated proxy should also be deployed to an Apigee X environment.'
  },
  {
    name: '--environment, -e',
    description: 'If --deploy is true, the environment to deploy the proxy to.'
  },
  {
    name: '--filter, -l',
    description: 'Path to an optional javascript file that will be evaluated before any processing is done, can be used to add conversion plugins or inject other logic into the conversion.'
  },
  {
    name: '--name, -n',
    description: 'If no --file or --input parameters are specified, this can set the proxy name directly for a simple proxy.'
  },
  {
    name: '--basePath, -b',
    description: 'If no --file or --input parameters are specified, this can set the basePath directly.'
  },
  {
    name: '--targetUrl, t',
    description: 'If no --file or --input parameters are specified, this can set the target URL directly.'
  },
  {
    name: '--verbose, -v',
    description: 'If extra logging information should be printed during the conversion and deployment.'
  },
  {
    name: '--keyPath, -k',
    description: 'If no GOOGLE_APPLICATION_CREDENTIALS are set to authorize the proxy deployment, this can point to a GCP service account JSON key file to use for authorization.'
  }
]
