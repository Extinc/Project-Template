import fs from 'fs';
import readline from 'readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const process = async (file) => {
    const map = new Map();
    const fileStream = fs.createReadStream(file);

    const rl = readline.createInterface(
        {
            input: fileStream,
            crlfDelay: Infinity
        }
    )
    var count = 0;
    for await (const line of rl) {
        const trimmedLine = line.trim()
        if (trimmedLine.length > 0 && !trimmedLine.startsWith("#")) {
            const keyVal = line.split("=");
            var key = "";
            var val = "";

            if (keyVal.length > 0) {
                key = keyVal[0].trim();
            }

            if (keyVal.length > 1) {
                val = keyVal[1].trim();
            }

            if (map.get(key) === undefined) {
                map.set(key, val);
            } else {
                console.log(`Map already contains such key - ${key}`);
            }
            count++;
        }
    }

    return map;
}

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

var appDevPropertiesPath = path.join(__dirname, "application-dev.properties");
var appPropertiesPath = path.join(__dirname, "application.properties");

var set1 =  await process(appDevPropertiesPath).then(val=>{
     return new Set(val.keys());
});
var set2  =  await process(appPropertiesPath).then(val=>{
     return new Set(val.keys());
});

console.log(set1.difference(set2));