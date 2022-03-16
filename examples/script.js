/* eslint-disable no-invalid-this */
/* eslint-disable no-var */
/* eslint-disable require-jsdoc */
/*
This example script creates a simple DevQuotaPlugin that applies a developer-specific quota policy
to the proxy.

The for-loop at the bottom loops through the plugins in the ApigeeGenerator, and exchanges
the existing generic QuotaPlugin for this DevQuotaPlugin.

You can use the script by passing it with the -s parameter to the apigee-template cli.
*/

class DevQuotaPlugin {

  snippet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Quota continueOnError="false" enabled="true" name="Dev-Quota" type="calendar">
      <DisplayName>Dev-Quota</DisplayName>
      <Properties/>
      <Identifier ref="developer.email" />
      <Allow count="20" countRef="request.header.allowed_quota"/>
      <Interval ref="request.header.quota_count">1</Interval>
      <Distributed>false</Distributed>
      <Synchronous>false</Synchronous>
      <TimeUnit ref="request.header.quota_timeout">day</TimeUnit>
      <AsynchronousConfiguration>
          <SyncIntervalInSeconds>20</SyncIntervalInSeconds>
          <SyncMessageCount>5</SyncMessageCount>
      </AsynchronousConfiguration>
  </Quota>`;

  applyTemplate(inputConfig, processingVars, outputDir) {
    return new Promise((resolve, reject) => {

      processingVars.get("preflow_request_policies").push({ name: "Dev-Quota" });

      resolve({
        files: [
          {
            path: "/policies/Dev-Quota.xml",
            contents: this.snippet
          }
        ]
      });
    });
  }
}

for (var i=0; i<this.apigeeGenerator.profiles["default"].plugins.length; i++) {
  console.log(this.apigeeGenerator.profiles["default"].plugins[i].constructor.name);
  if (this.apigeeGenerator.profiles["default"].plugins[i].constructor.name == "QuotaPlugin") {
    this.apigeeGenerator.profiles["default"].plugins[i] = new DevQuotaPlugin();
    break;
  }
}

