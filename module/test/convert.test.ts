import { ApigeeTemplateService, ApigeeGenerator } from "../src";
import fs from 'fs';
import mocha from 'mocha'
import { expect } from "chai";

console.log("starting")
let apigeeGenerator: ApigeeTemplateService = new ApigeeGenerator([], []);

describe('Generate simple proxy', () => {
  return it('should produce a valid proxy bundle', () => {
    let input = fs.readFileSync("test/data/input2.json", "utf-8");
    return apigeeGenerator.generateProxyFromString(input, "test/proxies").then((response) => {
      console.log(response);
      expect(response.success).to.equal(true);
      expect(response.duration).to.greaterThan(0);
    })
  })
})