import fs from 'fs';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan'

import { ApigeeService, ApiManagementInterface, ProxyRevision, ProxyDeployment} from 'apigee-x-module'

import { ApigeeGenService, ApigeeGenInput, proxyTypes, authTypes } from '../lib/interfaces';
import { ApigeeGenerator } from '../lib/service';

const apigeeGenerator: ApigeeGenService = new ApigeeGenerator();
const apigeeService: ApiManagementInterface = new ApigeeService();

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('combined'));
app.use(express.static('public'));

// special JSON conversion middleware
app.use((req, res, next) => {
  if (req.body && req.body.api) {
    try {
      var newInput: ApigeeGenInput = {
        name: req.body.product.apiTestBackendProduct.productName,
        proxyType: proxyTypes.programmable,
        basePath: req.body.product.apiTestBackendProduct.productName,
        targetUrl: req.body.environments[0].backendBaseUrl,
        auth: [
          {
            type: authTypes.sharedflow,
            parameters: {}
          }
        ]
      };

      if (req.body.api.policies && req.body.api.policies.inbound && req.body.api.policies.inbound.totalThrottlingEnabled) {
        newInput.quotas = [{
          count: 200,
          timeUnit: "day"
        }]
      }

      if (req.body.environments && req.body.environments.length > 0 && req.body.environments[0].backendAudienceConfiguration) {
        newInput.auth[0].parameters["audience"] = req.body.environments[0].backendAudienceConfiguration.backendAudience;
      }      
      if (req.body.api.policies && req.body.api.policies.inbound && req.body.api.policies.inbound.validateJwtTokenAzureAdV1) {
        newInput.auth[0].parameters["issuerVer1"] = "https://sts.windows.net/30f52344-4663-4c2e-bab3-61bf24ebbed8/";
      }
      if (req.body.api.policies && req.body.api.policies.inbound && req.body.api.policies.inbound.validateJwtTokenAzureAdV2) {
        newInput.auth[0].parameters["issuerVer2"] = "https://login.microsoftonline.com/30f52344-4663-4c2e-bab3-61bf24ebbed8/v2.0";
      }

      req.body = newInput;
    }
    catch(error) {
      console.log(error);
    }
  }

  next();
});

app.post('/apigeegen/deployment/:environment', (req, res) => {
  console.log(JSON.stringify(req.body));
  var env: string = req.params.environment;

  if (!env) {
    res.status(400).send(JSON.stringify({
      message: "Please include an environment to deploy to in the path /apigeegen/deployment/:environment."
    }));

    return;
  }

  let genInput: ApigeeGenInput = req.body as ApigeeGenInput;
  var _proxyDir = "proxies/" + genInput.name + "/apiproxy/";

  fs.mkdirSync(_proxyDir, { recursive: true });

  apigeeGenerator.generateProxy(genInput, _proxyDir).then((result) => {

    apigeeService.updateProxy(genInput.name, "proxies/" + genInput.name + ".zip").then((updateResult: ProxyRevision) => {
      if (updateResult && updateResult.revision) {
        apigeeService.deployProxyRevision(env, genInput.name, updateResult.revision).then((deploymentResult) => {
          console.log("deploy complete!");
          fs.unlinkSync("proxies/" + genInput.name + ".zip");
          res.status(200).send({
            message: `Deployment successful of proxy ${genInput.name} to environment ${env}.`
          });
        }).catch((error) => {
          fs.unlinkSync("proxies/" + genInput.name + ".zip");
          res.status(500).send({
            message: `Error deploying proxy ${genInput.name}, possible the environment doesn't exist?.`
          });
        })
      }
    }).catch((error) => {
      fs.unlinkSync("proxies/" + genInput.name + ".zip");

      if (error && error.response && error.response.status && error.response.status == 400)
        res.status(400).send({
          message: `Error deploying ${genInput.name}, bundle has errors.`
        });
      else
        res.status(500).send({
          message: `Error deploying ${genInput.name}, general error.`
        });
    });
  }).catch((error) => {
    fs.unlinkSync("proxies/" + genInput.name + ".zip");
    res.status(500).send({
      message: `Error deploying proxy ${genInput.name}.`
    });
  });
});

app.post('/apigeegen/file', (req, res) => {
  console.log(JSON.stringify(req.body));

  let genInput: ApigeeGenInput = req.body as ApigeeGenInput;
  var _proxyDir = "proxies/" + genInput.name + "/apiproxy/";

  fs.mkdirSync(_proxyDir, { recursive: true });

  apigeeGenerator.generateProxy(genInput, _proxyDir).then((result) => {
    res.attachment(genInput.name + '.zip').type('zip');
    // Create a readable stream that we can pipe to the response object
    let readStream = fs.createReadStream("proxies/" + genInput.name + ".zip");
    // When everything has been read from the stream, end the response
    readStream.on('close', () => {
      // delete file and return
      fs.unlinkSync("proxies/" + genInput.name + ".zip");
      res.end();
    });
    // Pipe the contents of the readStream directly to the response
    readStream.pipe(res);
  }).catch((error) => {
    fs.unlinkSync("proxies/" + genInput.name + ".zip");
    res.status(500).send({
      message: `Error generating proxy ${genInput.name}.`
    });
  });
});

app.listen(8080, () => {
  return console.log(`server is listening on 8080`);
});