const fs = require("fs")
const path = require("path")
const config = require("./compose-config.json");
  
async function main() {

    const workDir = path.resolve(  __dirname, config.context)
   
    let YAML

    try {
        YAML = require('yaml')
    } catch (ex) {
        console.log("The yaml npm package is required please run\n\nsudo npm i -g yaml\n")
        console.log("And make sure the NODE_PATH environmental variable is correct, example: export NODE_PATH=/usr/lib/node_modules\n")
        return
    }


    outObject = {
        version: "3.7",
        services: {}
    }

    for (let c of config.configs) {
        cPath = path.join(workDir, c)
        if (!fs.existsSync(cPath)) continue;
        const cFile = fs.readFileSync(cPath, "utf-8").toString()
        ymlObject = YAML.parse(cFile)

        for (let [name, service] of Object.entries(ymlObject.services)) {
            if (config.excludeServices.includes(name)) {
                continue;
            }

            if (service.build) {
                if (service.build.context) {
                    service.build.context = "./" + path.join(path.dirname(c), service.build.context)
                } else if (typeof service.build === "string") {
                    service.build = "./" + path.join(path.dirname(c), service.build)
                }
            }

            if (Array.isArray(service.volumes)) {
                service.volumes = service.volumes.map(v => "./" + path.join(path.dirname(c), v))
            }
            if (outObject.services[name]) {
                console.error("Error: Duplicate service named '" + name + "' found. All services must have a unique name.")
                process.exit(-1)
            }
            outObject.services[name] = service
        }

    }

    const outYml = YAML.stringify(outObject)

    fs.writeFileSync(path.join(workDir, config.output), outYml);

    let outDotEnv = ""
    for (let dotEnv of config.envFiles) {
        const  envPath = path.join(workDir, dotEnv)
        if (!fs.existsSync(envPath)) continue;
        let str = fs.readFileSync(envPath, "utf-8")
        outDotEnv += str + "\n"
    }
    fs.writeFileSync(path.join(workDir, config.outputEnv), outDotEnv)
}

main()