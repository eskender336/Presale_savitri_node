const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const contractPath = "contracts/TokenICO.sol";
  const sources = {};
  const processed = new Set();
  const nodeModulesPath = path.join(__dirname, "node_modules");
  
  function resolveImport(importPath, currentDir) {
    let canonicalPath = importPath;
    let fullPath;
    
    if (importPath.startsWith("@openzeppelin/")) {
      canonicalPath = importPath;
      const relativePath = importPath.replace("@openzeppelin/", "");
      fullPath = path.join(nodeModulesPath, "@openzeppelin", relativePath);
    } else if (importPath.startsWith("../")) {
      const baseDir = path.dirname(currentDir);
      fullPath = path.resolve(baseDir, importPath);
      const normalizedPath = fullPath.replace(/\\/g, "/");
      const openzeppelinMatch = normalizedPath.match(/node_modules\/@openzeppelin\/(.+)$/);
      if (openzeppelinMatch) {
        canonicalPath = "@openzeppelin/" + openzeppelinMatch[1];
      } else {
        canonicalPath = importPath;
      }
    } else if (importPath.startsWith("./")) {
      const baseDir = path.dirname(currentDir);
      fullPath = path.resolve(baseDir, importPath);
      const normalizedPath = fullPath.replace(/\\/g, "/");
      const openzeppelinMatch = normalizedPath.match(/node_modules\/@openzeppelin\/(.+)$/);
      if (openzeppelinMatch) {
        canonicalPath = "@openzeppelin/" + openzeppelinMatch[1];
      } else {
        canonicalPath = importPath;
      }
    } else {
      return;
    }
    
    if (processed.has(canonicalPath)) {
      return;
    }
    processed.add(canonicalPath);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      sources[canonicalPath] = { content };
      
      const importRegex = /import\s+["']([^"']+)["']/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        resolveImport(match[1], fullPath);
      }
    }
  }
  
  const sourcePath = path.join(__dirname, contractPath);
  const sourceCode = fs.readFileSync(sourcePath, "utf8");
  sources[contractPath] = { content: sourceCode };
  processed.add(contractPath);
  
  const importRegex = /import\s+["']([^"']+)["']/g;
  let match;
  while ((match = importRegex.exec(sourceCode)) !== null) {
    resolveImport(match[1], sourcePath);
  }
  
  // Get compiler settings
  const config = hre.config.solidity;
  const soliditySettings = config.settings || {};
  
  const settings = {
    optimizer: {
      enabled: soliditySettings.optimizer?.enabled !== false,
      runs: soliditySettings.optimizer?.runs ?? 0,
    },
    viaIR: false, // Try without viaIR first
    evmVersion: "paris",
    metadata: soliditySettings.metadata || {},
    libraries: {
      // Libraries need to be linked - these addresses should be filled in
      // "contracts/libraries/PriceCalculationLibrary.sol:PriceCalculationLibrary": "0x...",
      // "contracts/libraries/StakingLibrary.sol:StakingLibrary": "0x...",
    },
  };
  
  const standardJsonInput = {
    language: "Solidity",
    sources: sources,
    settings: settings,
  };
  
  const outputPath = path.join(__dirname, "tokenico-standard-json.json");
  fs.writeFileSync(outputPath, JSON.stringify(standardJsonInput, null, 2));
  
  console.log("✅ Standard JSON Input generated!");
  console.log("File:", outputPath);
  console.log("\n⚠️  IMPORTANT: TokenICO uses libraries!");
  console.log("   You need to provide library addresses in the settings.libraries section");
  console.log("   Or use the flattened file instead");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

