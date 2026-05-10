const fs = require('fs');

function sanitizeBom(bomFile, configPath) {
    let filterGroups = [];
    let redactTexts = [];

    if (configPath && fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            redactTexts = config.redact_texts || [];
        } catch (e) {
            console.error(`Error reading config file ${configPath}:`, e.message);
            process.exit(1);
        }
    }

    let data;
    try {
        data = JSON.parse(fs.readFileSync(bomFile, 'utf8'));
    } catch (e) {
        console.error(`Error reading BOM file ${bomFile}:`, e.message);
        process.exit(1);
    }

    if (filterGroups.length > 0 && data.components) {
        const originalCount = data.components.length;
        data.components = data.components.filter(c => {
            const group = String(c.group || '').toLowerCase();
            return !filterGroups.some(fg => group.includes(fg.toLowerCase()));
        });
        const removed = originalCount - data.components.length;
        if (removed > 0) {
            console.log(`[${bomFile}] Filtered out ${removed} internal components matching requested groups.`);
        }
    }

    function recursiveRedact(obj) {
        if (Array.isArray(obj)) {
            obj.forEach(item => recursiveRedact(item));
        } else if (obj !== null && typeof obj === 'object') {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    let val = obj[key];
                    for (const st of redactTexts) {
                        if (val.includes(st)) {
                            val = val.split(st).join("***REDACTED***");
                            obj[key] = val;
                        }
                    }
                } else {
                    recursiveRedact(obj[key]);
                }
            }
        }
    }

    if (redactTexts.length > 0) {
        recursiveRedact(data);
        console.log(`[${bomFile}] Redacted sensitive URLs/text.`);
    }

    fs.writeFileSync(bomFile, JSON.stringify(data, null, 2));
}

const args = process.argv.slice(2);
if (args.length < 1) {
    console.error("Usage: node sanitize_bom.js <bom_file> [--config <config.json>]");
    process.exit(1);
}

const bomFile = args[0];
let configPath = null;
const configIdx = args.indexOf('--config');
if (configIdx !== -1 && configIdx + 1 < args.length) {
    configPath = args[configIdx + 1];
}

sanitizeBom(bomFile, configPath);
