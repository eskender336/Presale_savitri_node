const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const contractName = "SavitriCoin";
  const contractPath = "contracts/mock/SavitriCoin.sol";
  
  console.log("Generating Standard JSON Input for BSCScan verification...");
  
  // Recursively find all imports
  const sources = {};
  const processed = new Set();
  const nodeModulesPath = path.join(__dirname, "node_modules");
  const contractsPath = path.join(__dirname, "contracts");
  
  function resolveImport(importPath, currentDir) {
    // Normalize the import path to a canonical form
    let canonicalPath = importPath;
    let fullPath;
    
    if (importPath.startsWith("@openzeppelin/")) {
      canonicalPath = importPath;
      const relativePath = importPath.replace("@openzeppelin/", "");
      fullPath = path.join(nodeModulesPath, "@openzeppelin", relativePath);
    } else if (importPath.startsWith("../")) {
      // Relative import - resolve to full path
      const baseDir = path.dirname(currentDir);
      fullPath = path.resolve(baseDir, importPath);
      
      // Convert to @openzeppelin path if it's in node_modules
      const normalizedPath = fullPath.replace(/\\/g, "/");
      const openzeppelinMatch = normalizedPath.match(/node_modules\/@openzeppelin\/(.+)$/);
      if (openzeppelinMatch) {
        canonicalPath = "@openzeppelin/" + openzeppelinMatch[1];
      } else {
        canonicalPath = importPath;
      }
    } else if (importPath.startsWith("./")) {
      // Relative import
      const baseDir = path.dirname(currentDir);
      fullPath = path.resolve(baseDir, importPath);
      
      // Convert to @openzeppelin path if it's in node_modules
      const normalizedPath = fullPath.replace(/\\/g, "/");
      const openzeppelinMatch = normalizedPath.match(/node_modules\/@openzeppelin\/(.+)$/);
      if (openzeppelinMatch) {
        canonicalPath = "@openzeppelin/" + openzeppelinMatch[1];
      } else {
        canonicalPath = importPath;
      }
    } else {
      return; // Skip unknown imports
    }
    
    if (processed.has(canonicalPath)) {
      return; // Already processed
    }
    processed.add(canonicalPath);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      sources[canonicalPath] = { content };
      
      // Find all imports in this file
      const importRegex = /import\s+["']([^"']+)["']/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        resolveImport(match[1], fullPath);
      }
    }
  }
  
  // Start with the main contract
  const sourcePath = path.join(__dirname, contractPath);
  const sourceCode = fs.readFileSync(sourcePath, "utf8");
  sources[contractPath] = { content: sourceCode };
  processed.add(contractPath);
  
  // Find all imports in the main contract
  const importRegex = /import\s+["']([^"']+)["']/g;
  let match;
  while ((match = importRegex.exec(sourceCode)) !== null) {
    resolveImport(match[1], sourcePath);
  }
  
  // Get compiler settings from hardhat config
  // Hardhat config structure: { solidity: { version: "...", settings: { ... } } }
  const solidityConfig = hre.config.solidity;
  let soliditySettings = {};
  
  // Handle different config structures
  if (solidityConfig.settings) {
    soliditySettings = solidityConfig.settings;
  } else if (solidityConfig.optimizer || solidityConfig.viaIR) {
    soliditySettings = solidityConfig;
  }
  
  // Try without viaIR first (contract might have been deployed without it)
  const useViaIR = process.argv.includes('--via-ir');
  
  const settings = {
    optimizer: {
      enabled: soliditySettings.optimizer?.enabled !== false, // Default to true
      runs: soliditySettings.optimizer?.runs ?? 0,
    },
    viaIR: useViaIR, // Try false first, use --via-ir flag to enable
    evmVersion: "paris", // Default for 0.8.19
    metadata: soliditySettings.metadata || {},
  };
  
  console.log(`\n⚠️  Using viaIR: ${useViaIR}`);
  console.log("   If verification fails, try: node generate-standard-json.js --via-ir");
  
  // Create Standard JSON Input
  const standardJsonInput = {
    language: "Solidity",
    sources: sources,
    settings: {
      optimizer: settings.optimizer,
      viaIR: settings.viaIR,
      evmVersion: settings.evmVersion,
      metadata: settings.metadata,
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "evm.methodIdentifiers"],
        },
      },
    },
  };
  
  // Save to file
  const outputPath = path.join(__dirname, "savitri-standard-json.json");
  fs.writeFileSync(outputPath, JSON.stringify(standardJsonInput, null, 2));
  
  console.log("✅ Standard JSON Input generated!");
  console.log("File:", outputPath);
  console.log("\nTo use on BSCScan:");
  console.log("1. Go to contract verification page");
  console.log("2. Select 'Solidity (Standard JSON Input)'");
  console.log("3. Upload or paste the JSON from:", outputPath);
  console.log("4. Enter contract name: SavitriCoin");
  console.log("5. Constructor arguments: (leave empty)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

