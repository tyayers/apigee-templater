# Apigee Templater Demo

---
This tutorial shows you how to use the **apigee-templater-cli** to create and deploy proxies using simple commands and template files.

Let's get started!

---
## Setup environment
Edit the provided sample `env.sh` file, and set the environment variables there to the GCP project where Apigee X is provisioned.

Click <walkthrough-editor-open-file filePath="env.sh">here</walkthrough-editor-open-file> to open the file in the editor

Then, source the `env.sh` file in the Cloud shell.

```sh
source ./env.sh
```
---
## Create a simple proxy

Let's create a simple proxy to [httpbin.org](https://httpbin.org).  

Run this command in the Cloud Shell.

```sh
npx apigee-templater-cli -n HttpBinProxy -b /httpbin -t https://httpbin.org -d -e $APIGEE_ENV
```
Now jump over to the [Apigee console](https://apigee.google.com) to see the status of the proxy deployment.

Test the proxy with curl.

```sh
curl "https://$APIGEE_HOST/httpbin
```

You should see a valid response from httpbin.org.

<walkthrough-footnote>This is just a simple example.  You can put the configuration into a JSON file and pass it with more parameters.  Check out the **examples** directory for, well, examples.</walkthrough-footnote>

---

## Create a simple BigQuery table proxy

The next command will create a proxy to a BigQuery table, including filtering, sorting and paging.  

This is an example of using automation to ease the management of data products published as APIs.

Run this command in the Cloud Shell.

```sh
npx apigee-templater-cli -n BikeTrips-v1 -b /trips -q bigquery-public-data.austin_bikeshare.bikeshare_trips -d -e $APIGEE_ENV -s bq-api-service@$PROJECT.iam.gserviceaccount.com
```