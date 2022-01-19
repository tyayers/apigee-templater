interface apigeegen {
  name: string;
  proxyType: proxyTypes;
  basePath: string;
  targetUrl: string;
  auth: authConfig[];
}

interface authConfig {
  type: authTypes;
  parameters: {[key: string]: string};
}

enum proxyTypes {
  programmable = "programmable",
  configurable = "configurable"
}

enum authTypes {
  apikey = "apikey",
  jwt = "jwt",
  sharedflow = "sharedflow"
}

export {
  apigeegen,
  authTypes,
  proxyTypes
}