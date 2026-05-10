const fs = require('fs');
const path = require('path');

function generateCustomReport(jsonFile, outputFile) {
    let currentData = { Results: [] };
    let previousData = { Results: [] };

    try {
        currentData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    } catch (e) {
        console.error(`Error reading ${jsonFile}:`, e.message);
        process.exit(1);
    }

    const prevJsonFile = jsonFile.replace('-results.json', '-results.previous.json');
    if (fs.existsSync(prevJsonFile)) {
        try {
            previousData = JSON.parse(fs.readFileSync(prevJsonFile, 'utf8'));
        } catch (e) {
            console.error(`Warning: Could not parse previous scan file ${prevJsonFile}`);
        }
    }

    // Map previous packages: "PkgName" -> Version
    const prevPkgMap = {};
    for (const result of (previousData.Results || [])) {
        for (const pkg of (result.Packages || [])) {
            if (!prevPkgMap[pkg.Name]) prevPkgMap[pkg.Name] = new Set();
            prevPkgMap[pkg.Name].add(pkg.Version);
        }
    }
    const hasPreviousRun = Object.keys(prevPkgMap).length > 0;

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detailed Security Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #2980b9; color: white; font-weight: 600; }
        tr:hover { background-color: #f5f5f5; }
        .badge { padding: 5px 10px; border-radius: 4px; font-size: 0.85em; font-weight: bold; }
        .sev-CRITICAL { background-color: #e74c3c; color: white; }
        .sev-HIGH { background-color: #e67e22; color: white; }
        .sev-MEDIUM { background-color: #f1c40f; color: black; }
        .sev-LOW { background-color: #3498db; color: white; }
        .sev-SAFE { background-color: #2ecc71; color: white; }
        .status-NEW { background-color: #8e44ad; color: white; }
        .status-UPDATED { background-color: #9b59b6; color: white; }
        .status-UNCHANGED { color: #95a5a6; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📦 Dependency Security Report: ${path.basename(jsonFile).replace('-results.json', '')}</h1>
        <a href="index.html" style="text-decoration: none; color: #2980b9; font-weight: bold;">← Back to Dashboard</a>
        <table>
            <thead>
                <tr>
                    <th>Change Status</th>
                    <th>Package Group</th>
                    <th>Package Name</th>
                    <th>Severity</th>
                    <th>Vulnerability ID</th>
                    <th>Installed Version</th>
                    <th>Fixed Version</th>
                </tr>
            </thead>
            <tbody>`;

    const results = currentData.Results || [];
    let hasPackages = false;

    for (const result of results) {
        if (!result.Packages) continue;
        
        const vulnMap = {};
        for (const v of (result.Vulnerabilities || [])) {
            if (!vulnMap[v.PkgName]) vulnMap[v.PkgName] = [];
            vulnMap[v.PkgName].push(v);
        }

        for (const pkg of result.Packages) {
            hasPackages = true;
            let group = "N/A";
            let name = pkg.Name;
            
            if (pkg.Name.includes(':')) {
                const parts = pkg.Name.split(':');
                group = parts[0];
                name = parts[1];
            }

            let statusHtml = `<span class="status-UNCHANGED">Unchanged</span>`;
            if (hasPreviousRun) {
                if (!prevPkgMap[pkg.Name]) {
                    statusHtml = `<span class="badge status-NEW">NEW</span>`;
                } else if (!prevPkgMap[pkg.Name].has(pkg.Version)) {
                    const prevVersions = Array.from(prevPkgMap[pkg.Name]).join(", ");
                    statusHtml = `<span class="badge status-UPDATED">UPDATED</span><br><small style="color:#7f8c8d;">was ${prevVersions}</small>`;
                }
            }

            const vulns = vulnMap[pkg.Name] || [];
            
            if (vulns.length === 0) {
                html += `
                <tr>
                    <td>${statusHtml}</td>
                    <td>${group}</td>
                    <td>${name}</td>
                    <td><span class="badge sev-SAFE">SAFE</span></td>
                    <td>None</td>
                    <td>${pkg.Version || 'N/A'}</td>
                    <td>-</td>
                </tr>`;
            } else {
                for (const v of vulns) {
                    html += `
                <tr>
                    <td>${statusHtml}</td>
                    <td>${group}</td>
                    <td>${name}</td>
                    <td><span class="badge sev-${v.Severity || 'UNKNOWN'}">${v.Severity || 'UNKNOWN'}</span></td>
                    <td>${v.VulnerabilityID || 'N/A'}</td>
                    <td>${v.InstalledVersion || 'N/A'}</td>
                    <td>${v.FixedVersion || 'None Available'}</td>
                </tr>`;
                }
            }
        }
    }

    if (!hasPackages) {
        html += `<tr><td colspan="7" style="text-align: center;">No dependencies found in this file.</td></tr>`;
    }

    html += `
            </tbody>
        </table>
    </div>
</body>
</html>`;

    fs.writeFileSync(outputFile, html);
}

const args = process.argv.slice(2);
if (args.length !== 2) {
    console.error("Usage: node generate_custom_report.js <input_json> <output_html>");
    process.exit(1);
}
generateCustomReport(args[0], args[1]);
