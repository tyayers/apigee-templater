# Apigee Templater
A tool for automating the templating of Apigee API proxies through either a **CLI**, **REST API**, or **Typescript/Javascript** module. The generated proxy can either be downloaded as a bundle, or deployed to an Apigee X environment.  

## Examples
### CLI
Install the CLI like this.
```bash
npm install -g apigee-template
```
Use the CLI either in command or interactive mode.
```bash
#Use the CLI in interactive to supply inputs
apigee-template
> Welcome to apigee-template, use -h for more command line options. 
? What should the proxy be called? MyProxy
? Which base path should be used? /test
? Which backend target should be called? https://test.com
? Do you want to deploy the proxy to an Apigee X environment? No
> Proxy MyProxy generated to ./MyProxy.zip in 60 milliseconds.
```
```bash
#Show all commands
apigee-template -h
```
```bash
#Generate a proxy based on input.json and deploy it to environment test1 with credentials in key.json
apigee-template -f ./samples/input.json -d -e test1 -k ./key.json
```
### REST API
You can run the REST API service locally or deploy to any container runtime environment like [Cloud Run](https://cloud.google.com/run) (default deployment requires unauthenticated access).  

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run)

After deploying you can call the API like this (to generate and download a proxy bundle).

```bash
curl --location --request POST 'http://localhost:8080/apigeegen/file' \
--header 'Content-Type: application/json' \
--data-raw '{
  "name": "testproxy",
  "proxyType": "programmable",
  "proxyEndpoints": [
    {
      "name": "default",
      "basePath": "/httpbin",
      "targetName": "default",
      "targetUrl": "https://httpbin.org",
      "auth": [
        {
          "type": "apikey"
        }
      ],
      "quotas": [
        {
          "count": 30,
          "timeUnit": "minute"
        }
      ],
      "spikeArrest": {
        "rate": "30s"
      }
    }
  ]
}'
```
A **test web frontend of the REST API** can be tested [here](https://apigee-templater-h7pi7igbcq-ew.a.run.app/). 

### Typescript/Javascript
First install and import into your project.
```bash
npm install apigee-templater-module
```
Then use the generator module to build proxies.

```ts
import {ApigeeTemplateInput, ApigeeGenerator, proxyTypes, authTypes} from 'apigee-templater-module'

apigeeTemplater: ApigeeGenerator = new ApigeeGenerator(); // Optionally custom conversion plugins can be passed here, defaults are included.

let input: ApigeeTemplateInput = {
  name: "MyProxy",
  type: proxyTypes.programmable,
  proxyEndpoints: [
    {
      name: "default",
      basePath: "/myproxy",
      targetName: "default",
      targetUrl: "https://httpbin.org",
      quotas: [
        {
          count: 200,
          timeUnit: "day"
        }
      ],
      auth: [
        {
          type: authTypes.apikey
        }
      ]
    }
  ]
}

apigeeGenerator.generateProxy(input, "./proxies").then((result) => {
  // Proxy bundle generated to ./proxies/MyProxy.zip
  console.log(`Proxy successfully generated to ${result.localPath}!`);
});

```

Current features:
* Proxy name
* Base path
* Target URL
* Auth with apikey or a sharedflow callout (presumably to validate a 3rd party JWT token)
* Quotas and spike arrests

# Extending & Customizing the Templates
The project is designed to be extensible.  You can extend or customize in 2 ways.

## 1. Create your own cli or service project
This option requires you to change the host CLI or service process to inject your own plugins in the ApigeeGenerator constructor.  You can see how the **cli** and **service** projects do this when they create the object.

```typescript
  // Pass an array of template and input converter plugins that are used at runtime.
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
```
The above plugins are delivered in the **apigee-templater-module** package, but you can easily write your own by implementing the **ApigeeTemplatePlugin** interface (see /module/lib/plugins for examples).

## 2. Add a script callout when using the CLI
The second option is to add a script using the **-s** parameter when calling the **apigee-template** CLI.  This script is evaluated before the templating is done, and can make changes to the **ApigeeGenerator** object as needed, by for example removing, replacing or adding plugins for both templating and input conversion.

```bash
# Create a proxy based on ./samples/input.json using customization script ./samples/script.js,
# which replaces the generic **QuotaPlugin** with a developer-specific **DevQuotaPlugin**
apigee-template -f ./samples/input.json -s ./samples/script.js
```

# Feedback and feature requests
In case you find this useful feel free to request features or report bugs as Github issues.
