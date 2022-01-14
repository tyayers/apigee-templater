import { Buffer } from 'buffer';
import React from 'react';
import { useState } from 'react';
import logo from './logo.svg';
import beams from './assets/beams.jpg'
import './App.css';
import { env } from 'process';

const yaml = require('js-yaml')

function App() {

  const [name, setName] = useState("")
  const [basePath, setBasePath] = useState("")
  const [target, setTarget] = useState("")
  const [spec, setSpec] = useState("")
  const [description, setDescription] = useState("")
  const [environment, setEnvironment] = useState("")

  function submit(deploy: boolean) {
    if (!name) {
      alert("Please enter at least a name for the proxy.");
      return;
    }

    if (!target && spec) {
      const specObj = yaml.load(spec);
      if (specObj && specObj.servers && specObj.servers.length > 0)
        setTarget(specObj.servers[0].url.replace("http://", "").replace("https://", ""));
    }

    var command = {
      name: name,
      basePath: "/" + basePath,
      targetUrl: "https://" + target,
      deploy: deploy,
      deployEnvironment: environment
    }

    fetch("/apigeegen",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(command)
    })
    .then(response => response.blob())
    .then(blob => {
      if (!deploy) {
        var blobUrl = URL.createObjectURL(blob);
        //window.open(blobUrl);
        var anchor = document.createElement("a");
        anchor.download = name + ".zip";
        anchor.href = blobUrl;
        anchor.click();    
      }
    });
  }

  function onFileChange(event: any) {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      // this will then display a text file
      if (reader.result != null) {
        let newSpec = reader.result.toString();
        setSpec(newSpec);
        const specObj = yaml.load(newSpec);

        if (!target) {
          if (specObj && specObj.servers && specObj.servers.length > 0)
            setTarget(specObj.servers[0].url.replace("http://", "").replace("https://", ""));
        }

        if (!name) {
          if (specObj && specObj.info && specObj.info.title)
            setName(specObj.info.title)
        }

        if (!basePath) {
          if (specObj && specObj.tags && specObj.tags.length > 0)
            setBasePath(specObj.tags[0].name);
        }
      }

    }, false);
  
    reader.readAsText(event.target.files[0]);
    //setSpec(event.target.files[0]);
  }

  return (
    <div className="w-full p-4">
      <div className="-z-[01] absolute inset-0 bg-[url(assets/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <div className="w-full sm:mt-[100px] sm:mb-[150px] content-center justify-center">
        <div className="w-full sm:w-2/3 bg-gray-50 rounded-xl m-auto">
          <div className="bg-white rounded shadow px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div>
              <div className="lg:grid lg:grid-cols-3 lg:gap-6">
                <div className="lg:col-span-1">
                  <img className="pt-5 pr-5 mb-10 mt-10" src="https://www.laguilde.quebec/wp-content/uploads/2020/05/logo-placeholder.jpg"></img>
                  <div className="px-4 sm:px-0">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Publish API</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Configure your API to be published to the API platform.
                    </p>
                  </div>
                </div>
                <div className="mt-5 lg:mt-0 lg:col-span-2">
                  <div >
                    <div className="shadow sm:rounded-md sm:overflow-hidden">
                      <div className="px-4 py-5 bg-white space-y-6 sm:p-6">

                        <div className="grid grid-cols-3 gap-6">
                          <div className="col-span-3">
                            <label htmlFor="api-name" className="block text-sm font-medium text-gray-700">
                              Name
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                              <input
                                type="text"
                                name="api-name"
                                id="api-name"
                                className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block rounded-md sm:text-sm border-gray-300 border"
                                placeholder="Super API"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          <div className="col-span-3">
                            <label htmlFor="api-path" className="block text-sm font-medium text-gray-700">
                              Base Path
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                https://api.company.com/
                              </span>
                              <input
                                type="text"
                                name="api-path"
                                id="api-path"
                                className="w-[100px] focus:ring-indigo-500 focus:border-indigo-500 flex-1 block rounded-none rounded-r-md sm:text-sm border-gray-300 border"
                                placeholder="super"
                                value={basePath}
                                onChange={(e) => setBasePath(e.target.value)}
                              />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                            The base path that your API will be offered on.
                            </p>
                          </div>
                        </div>                     

                        <div className="grid grid-cols-3 gap-6">
                          <div className="col-span-3">
                            <label htmlFor="company-website" className="block text-sm font-medium text-gray-700">
                              Target (Backend) URL
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                https://
                              </span>
                              <input
                                type="text"
                                name="company-website"
                                id="company-website"
                                className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block rounded-none rounded-r-md sm:text-sm border-gray-300 border"
                                placeholder="backend.a.run.app"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                              />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                            Target Cloud Function, Cloud Run, or GKE Ingress endpoint (overrides OpenAPI spec)
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">OpenAPI Spec v3</label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <svg
                                className="mx-auto h-12 w-12 text                    <!-- centered card -->-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                                aria-hidden="true"
                              >
                                <path
                                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                >
                                  <span>Upload a file</span>
                                  <input id="file-upload" onChange={onFileChange} name="file-upload" type="file" className="sr-only" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">YAML, JSON up to 5MB</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="about" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="about"
                              name="about"
                              rows={3}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                              placeholder="This amazing API will knock your socks off!"
                              defaultValue={description}
                              onChange={(e) => setDescription(e.target.value)}
                            />
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            Brief description for your API. URLs are hyperlinked.
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          <div className="col-span-3">
                            <label htmlFor="api-name" className="block text-sm font-medium text-gray-700">
                              Environment
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                              <input
                                type="text"
                                name="api-env"
                                id="api-env"
                                className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block rounded-md sm:text-sm border-gray-300 border"
                                placeholder="dev"
                                value={environment}
                                onChange={(e) => setEnvironment(e.target.value)}
                              />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                            The environment in case the API should be deployed.
                          </p>
                          </div>
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <fieldset>
                            <legend className="block text-sm font-medium text-gray-700">Authorization methods accepted</legend>
                            <div className="mt-4 space-y-4">
                              <div className="flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id="apikey"
                                    name="apikey"
                                    type="checkbox"
                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor="apikey" className="font-medium text-gray-700">
                                    API Key
                                  </label>
                                  <p className="text-gray-500">Developers can access this API with an API key.</p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id="idtoken"
                                    name="idtoken"
                                    type="checkbox"
                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor="idtoken" className="font-medium text-gray-700">
                                    OAuth token
                                  </label>
                                  <p className="text-gray-500">Access is granted with an OAuth access token.</p>
                                </div>
                              </div>
                            </div>
                          </fieldset>
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <label htmlFor="auth-type" className="block text-sm font-medium text-gray-700">
                            Visability
                          </label>
                          <select
                            id="auth-type"
                            name="auth-type"
                            autoComplete="auth-type"
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            <option>Partners</option>
                            <option>Internal</option>
                            <option>Public</option>
                            <option>Test</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Photo</label>
                          <div className="mt-1 flex items-center">
                            <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                              <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </span>
                            <button
                              type="button"
                              className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                        <button
                          type="submit"
                          onClick={() => submit(false)}
                          className="inline-flex justify-center mr-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Download
                        </button>
                        <button
                          type="submit"
                          onClick={() => submit(true)}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Deploy
                        </button>                        
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
