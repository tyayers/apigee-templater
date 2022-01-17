# Apigee Templater
This is a simple tool for automating the templating of Apigee API proxies through a web frontend. The generated proxy can either be downloaded as a bundle, or deployed to an Apigee X environment.

A **live version** can be tested [here](https://apigee-templater-h7pi7igbcq-ew.a.run.app/). Just fill in a name, a base path, an existing endpoint, and you can submit to get a proxy bundle generated or deployed (to a test environment).  You can also upload an OpenAPI v3 spec and get the fields filled in based on the spec values.

![Frontend screenshot](img/screen1.png)

Current features:
* Proxy name is set
* Base path is set
* Target URL is set
* API Key is added if the checkbox is checked
* OAuth 3rd party token validation is done through a shared flow if the checkbox is checked.

Coming soon features:
* More template snippets around throttling, analytics, etc...

# Easy deploy
[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run)

If your GCP project allows unautenticated Cloud Run access, then you can just click the button above to deploy to Cloud Run and access the tool at the published URL. 

# Normal deploy
Simply clone the repo and check the **deploy.sh** script for any customizations for your GCP environment, and then run:

```bash
./deploy.sh
```

As an alternative you can also run **deploy_local.sh** to build to a local Docker environment.

# Headless
You can also use the service without the frontend using REST calls, for example this call deploys a proxy:

```bash
curl --location --request POST 'http://localhost:8080/apigeegen/deployment/test1' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "testproxy",
    "targetUrl": "https://httpbin.org",
    "basePath": "/httpbin",
    "auth": ["apikey"]
}'
```

This call downloads the generated proxy bundle:

```bash
curl --location --request POST 'http://localhost:8080/apigeegen/file' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "testproxy",
    "targetUrl": "https://httpbin.org",
    "basePath": "/httpbin",
    "auth": ["apikey"]
}'
```


# Extending
The project is simple to extend because the service is built with TypeScript and an easy plugin machanism for loading any additional templating, or adapting any of the existing plugins.  Just check out **service/lib/apigeegen-service.ts** to see how the plugins are loaded, and **service/lib/plugins** to see the existing plugins, which are easy to duplicate and extend.

# Feedback and feature requests
In case you find this useful feel free to request features or report bugs as Github issues.
