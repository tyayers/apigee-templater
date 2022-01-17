import fs from 'fs';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan'
import Handlebars from 'handlebars';
import archiver from 'archiver';
import path from 'path';

import { ApigeeService, ApiManagementInterface, ProxyRevision, ProxyDeployment} from 'apigee-x-module'

import { apigeegen } from '../lib/apigeegen-types';
import { ApigeeGenService, ApigeeGenPlugin } from "../lib/apigeegen-interface";
import { ApigeeGenerator } from '../lib/apigeegen-service';
import { ManifestPlugin } from "../lib/plugins/manifest.plugin"
import { TargetsPlugin } from "../lib/plugins/targets.plugin"
import { EndpointsPlugin } from "../lib/plugins/endpoints.plugin"

let plugins: ApigeeGenPlugin[] = [
  new EndpointsPlugin(),
  new TargetsPlugin(),
  new ManifestPlugin()
]

const apigeeGenerator: ApigeeGenService = new ApigeeGenerator();
const apigeeService: ApiManagementInterface = new ApigeeService();

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('combined'));
app.use(express.static('public'));

app.post('/apigeegen/deployment/:environment', (req, res) => {
  console.log(JSON.stringify(req.body));
  var env: string = req.params.environment;

  if (!env) {
    res.status(400).send(JSON.stringify({
      message: "Please include an environment to deploy to in the path /apigeegen/deployment/:environment."
    }));

    return;
  }

  let genInput: apigeegen = req.body as apigeegen;
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
      res.status(500).send({
        message: `Error deploying proxy ${genInput.name}.`
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

  let genInput: apigeegen = req.body as apigeegen;
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