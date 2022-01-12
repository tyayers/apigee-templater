import fs from 'fs';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan'
import Handlebars from 'handlebars';
import archiver from 'archiver';
import path from 'path';

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

  res.attachment("proxies/" + genInput.name + '.zip');
  archive.pipe(res);
  archive.directory("proxies/" + genInput.name, false);
  archive.finalize();
});

app.listen(8080, () => {
  return console.log(`server is listening on 8080`);
});