const fs = require('fs');

function verifyScan(bomFile, resultsFile) {
    try {
        const bomData = JSON.parse(fs.readFileSync(bomFile, 'utf8'));
        let bomCount = (bomData.components || []).length;
        if (bomData.metadata && bomData.metadata.component) {
            bomCount += 1;
        }

        const resultsData = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
        let trivyCount = 0;
        for (const result of (resultsData.Results || [])) {
            trivyCount += (result.Packages || []).length;
        }

        if (bomCount === trivyCount) {
            console.log(`✅ VERIFICATION PASSED: CycloneDX BOM has ${bomCount} packages, Trivy scanned exactly ${trivyCount} packages.`);
        } else {
            console.log(`❌ VERIFICATION FAILED: CycloneDX BOM has ${bomCount} packages, but Trivy scanned ${trivyCount} packages.`);
        }
    } catch (e) {
        console.error(`⚠️ Verification error:`, e.message);
    }
}

const args = process.argv.slice(2);
if (args.length !== 2) {
    console.error("Usage: node verify_scan.js <bom_file> <trivy_results_file>");
    process.exit(1);
}
verifyScan(args[0], args[1]);
