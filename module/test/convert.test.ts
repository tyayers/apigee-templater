import { ApigeeTemplateService, ApigeeGenerator } from "../src";
import fs from 'fs';
import { expect } from "chai";

console.log("starting")
let apigeeGenerator: ApigeeTemplateService = new ApigeeGenerator(undefined, undefined);

describe('Generate simple normal JSON 1 proxy', () => {
  return it('should produce a valid proxy bundle', () => {
    let input = fs.readFileSync("./test/data/input1.json", "utf-8");
    return apigeeGenerator.generateProxyFromString(input, "test/proxies").then((response) => {
      //console.log(response);
      expect(response.success).to.equal(true);
      expect(response.duration).to.greaterThan(0);
      expect(fs.existsSync(response.localPath)).to.equal(true);
    })
  })
});

describe('Generate custom JSON 2 proxy', () => {
  return it('should produce a valid proxy bundle', () => {
    let input = fs.readFileSync("./test/data/input2.json", "utf-8");
    return apigeeGenerator.generateProxyFromString(input, "test/proxies").then((response) => {
      //console.log(response);
      expect(response.success).to.equal(true);
      expect(response.duration).to.greaterThan(0);
      expect(fs.existsSync(response.localPath)).to.equal(true);
    })
  })
});

describe('Generate OpenAPI v3 proxy', () => {
  return it('should produce a valid proxy bundle', () => {
    let input = fs.readFileSync("./test/data/petstore.yaml", "utf-8");
    return apigeeGenerator.generateProxyFromString(input, "test/proxies").then((response) => {
      //console.log(response);
      expect(response.success).to.equal(true);
      expect(response.duration).to.greaterThan(0);
      expect(fs.existsSync(response.localPath)).to.equal(true);
    })
  })
});