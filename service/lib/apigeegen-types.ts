interface apigeegen {
  name: string;
  proxyType: proxyTypes;
  basePath: string;
  targetUrl: string;
  auth: authTypes[];
}

enum proxyTypes {
  programmable = "programmable",
  configurable = "configurable"
}

enum authTypes {
  apikey = "apikey",
  jwt = "jwt"
}

export {
  apigeegen,
  authTypes,
  proxyTypes
}