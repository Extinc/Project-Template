const fs = require('fs');
const path = require('path');

function generateIndex() {
    const reportsDir = 'reports';
    if (!fs.existsSync(reportsDir)) return;

    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('-results.json') && !f.includes('.previous.'));
    const servicesData = [];

    for (const file of files) {
        const fullPath = path.join(reportsDir, file);
        const baseName = file.replace('-results.json', '');
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

        // Load previous scan to calculate diffs
        const prevPath = fullPath.replace('-results.json', '-results.previous.json');
        const prevPkgMap = {};
        if (fs.existsSync(prevPath)) {
            try {
                const prevData = JSON.parse(fs.readFileSync(prevPath, 'utf8'));
                for (const result of (prevData.Results || [])) {
                    for (const pkg of (result.Packages || [])) {
                        if (!prevPkgMap[pkg.Name]) prevPkgMap[pkg.Name] = new Set();
                        prevPkgMap[pkg.Name].add(pkg.Version);
                    }
                }
            } catch (e) { }
        }
        const hasPreviousRun = Object.keys(prevPkgMap).length > 0;

        let totalVulns = 0;
        let critical = 0, high = 0, medium = 0, low = 0;
        let totalInstalled = 0;
        const packages = [];

        const results = data.Results || [];
        for (const result of results) {
            if (!result.Packages) continue;

            const vulnMap = {};
            for (const v of (result.Vulnerabilities || [])) {
                if (!vulnMap[v.PkgName]) vulnMap[v.PkgName] = [];
                vulnMap[v.PkgName].push(v);
            }

            for (const pkg of result.Packages) {
                totalInstalled++;
                let group = "N/A";
                let name = pkg.Name;

                if (pkg.Name.includes(':')) {
                    const parts = pkg.Name.split(':');
                    group = parts[0];
                    name = parts[1];
                }

                let status = "";
                if (hasPreviousRun) {
                    if (!prevPkgMap[pkg.Name]) {
                        status = "🆕 NEW";
                    } else if (prevPkgMap[pkg.Name].has(pkg.Version)) {
                        status = "Unchanged";
                    } else {
                        const prevVersions = Array.from(prevPkgMap[pkg.Name]).join(", ");
                        status = `🔄 UPDATED (from ${prevVersions})`;
                    }
                }

                const vulns = vulnMap[pkg.Name] || [];
                if (vulns.length === 0) {
                    packages.push({ group, name, status, severity: 'SAFE', vuln: 'None', installed: pkg.Version, fixed: '-' });
                } else {
                    for (const v of vulns) {
                        totalVulns++;
                        const sev = v.Severity || 'UNKNOWN';
                        if (sev === 'CRITICAL') critical++;
                        else if (sev === 'HIGH') high++;
                        else if (sev === 'MEDIUM') medium++;
                        else if (sev === 'LOW') low++;

                        packages.push({ group, name, status, severity: sev, vuln: v.VulnerabilityID || 'N/A', installed: v.InstalledVersion, fixed: v.FixedVersion || 'None' });
                    }
                }
            }
        }

        servicesData.push({
            name: baseName.toUpperCase().replace('_BOM', ''),
            report_html: `${baseName}-report.html`,
            total_installed: totalInstalled,
            total_vulns: totalVulns,
            critical, high, medium, low,
            packages
        });
    }

    // Generate index.html
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Global Security Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #34495e; color: white; font-weight: 600; }
        tr:hover { background-color: #f5f5f5; }
        .badge { padding: 5px 10px; border-radius: 4px; font-size: 0.85em; font-weight: bold; }
        .sev-CRITICAL { background-color: #e74c3c; color: white; }
        .sev-HIGH { background-color: #e67e22; color: white; }
        .sev-MEDIUM { background-color: #f1c40f; color: black; }
        .sev-LOW { background-color: #3498db; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 Global Microservice Security Dashboard</h1>
        <table>
            <thead>
                <tr>
                    <th>Microservice</th>
                    <th>Dependencies</th>
                    <th>Vulnerabilities</th>
                    <th>Critical</th>
                    <th>High</th>
                    <th>Medium</th>
                    <th>Low</th>
                </tr>
            </thead>
            <tbody>`;

    for (const s of servicesData) {
        html += `
                <tr>
                    <td><a href="${s.report_html}" style="font-weight: bold; color: #2980b9;">${s.name}</a></td>
                    <td>${s.total_installed}</td>
                    <td><b>${s.total_vulns}</b></td>
                    <td><span class="badge sev-CRITICAL">${s.critical}</span></td>
                    <td><span class="badge sev-HIGH">${s.high}</span></td>
                    <td><span class="badge sev-MEDIUM">${s.medium}</span></td>
                    <td><span class="badge sev-LOW">${s.low}</span></td>
                </tr>`;
    }

    html += `
            </tbody>
        </table>
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(reportsDir, 'index.html'), html);

    // Generate Confluence Markdown
    let md = "## Security Dashboard Overview\n\n";
    md += "| Microservice | Total Dependencies | Total Vulnerabilities | Critical | High | Medium | Low |\n";
    md += "|---|---|---|---|---|---|---|\n";

    for (const s of servicesData) {
        md += `| [${s.name}](${s.report_html}) | ${s.total_installed} | ${s.total_vulns} | ${s.critical} | ${s.high} | ${s.medium} | ${s.low} |\n`;
    }

    md += "\n---\n\n";

    for (const s of servicesData) {
        md += `## ${s.name} Dependencies\n\n`;
        md += "| Status | Package Group | Package Name | Vulnerability | Installed Version | Fixed Version |\n";
        md += "|---|---|---|---|---|---|\n";
        for (const p of s.packages) {
            let vulnStr = p.severity === 'SAFE' ? p.vuln : `${p.vuln} (${p.severity})`;
            let group = String(p.group).replace(/\|/g, '&#124;');
            let name = String(p.name).replace(/\|/g, '&#124;');
            let status = String(p.status).replace(/\|/g, '&#124;');
            vulnStr = String(vulnStr).replace(/\|/g, '&#124;');
            md += `| ${status} | ${group} | ${name} | ${vulnStr} | ${p.installed} | ${p.fixed} |\n`;
        }
        md += "\n";
    }

    fs.writeFileSync(path.join(reportsDir, 'confluence-report.md'), md);
    console.log("Generated reports/index.html and reports/confluence-report.md with DIFF tracking!");
}

generateIndex();
