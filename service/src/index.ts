import fs from 'fs';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan'
import Handlebars from 'handlebars';
import archiver from 'archiver';
import path from 'path';

import { ApigeeService, ApiManagementInterface, ProxyRevision, ProxyDeployment} from 'apigee-x-module'

import { apigeegen } from '../lib/apigeegen-types';
import { ApigeeGenPlugin } from "../lib/apigeegen-interface";
import { ManifestPlugin } from "../lib/plugins/manifest.plugin"
import { TargetsPlugin } from "../lib/plugins/targets.plugin"
import { EndpointsPlugin } from "../lib/plugins/endpoints.plugin"

let plugins: ApigeeGenPlugin[] = [
  new EndpointsPlugin(),
  new TargetsPlugin(),
  new ManifestPlugin()
]

const apigeeService: ApiManagementInterface = new ApigeeService();

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('combined'));
app.use(express.static('public'));

app.post('/apigeegen', (req, res) => {
  console.log(JSON.stringify(req.body))
  let genInput: apigeegen = req.body as apigeegen;
  var _proxyDir = "proxies/" + genInput.name + "/apiproxy/";

  fs.rmdirSync("proxies/" + genInput.name, {recursive: true});
  fs.mkdirSync(_proxyDir, { recursive: true });
  let processingVars: Map<string, any> = new Map<string, any>();

  for (let plugin of plugins) {
    let result = plugin.applyTemplate(genInput, processingVars, _proxyDir);
  }

  var archive = archiver('zip');
  archive.on('error', function(err) {
    res.status(500).send({error: err.message});
  });

  res.attachment(genInput.name + '.zip').type('zip');
  //archive.pipe(res);
  archive.directory("proxies/" + genInput.name, false);

  fs.unlinkSync("proxies/" + genInput.name + ".zip");
  var output = fs.createWriteStream("proxies/" + genInput.name + ".zip");

  archive.on('end', () => {
    if (genInput.deploy && genInput.deployEnvironment) {
      apigeeService.updateProxy(genInput.name, "proxies/" + genInput.name + ".zip").then((updateResult: ProxyRevision) => {
        if (updateResult && updateResult.revision) {
          apigeeService.deployProxyRevision(genInput.deployEnvironment, genInput.name, updateResult.revision).then((deploymentResult) => {
            console.log("deploy complete!");
          }).catch((error) => {
            console.log(error);
          });
        }
      }).catch((error) => {
        console.log(error);
      });
    }

    // Create a readable stream that we can pipe to the response object
    let readStream = fs.createReadStream("proxies/" + genInput.name + ".zip");
    // When everything has been read from the stream, end the response
    readStream.on('close', () => {
      res.end();
    });
    // Pipe the contents of the readStream directly to the response
    readStream.pipe(res)
  });

  archive.pipe(output);
  archive.finalize();
});

app.listen(8080, () => {
  return console.log(`server is listening on 8080`);
});