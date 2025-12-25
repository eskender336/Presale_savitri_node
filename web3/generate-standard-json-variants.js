const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

// Generate multiple variants to try
// EVM versions: london (0.8.0-0.8.18), paris (0.8.19+)
const variants = [
  { name: "no-viair", viaIR: false, compiler: "0.8.19", evmVersion: "paris" },
  { name: "with-viair", viaIR: true, compiler: "0.8.19", evmVersion: "paris" },
  { name: "no-viair-080", viaIR: false, compiler: "0.8.0", evmVersion: "london" },
  { name: "runs-200", viaIR: false, compiler: "0.8.19", runs: 200, evmVersion: "paris" },
  { name: "no-viair-london", viaIR: false, compiler: "0.8.19", evmVersion: "london" },
];

async function generateVariant(variant) {
  const contractPath = "contracts/mock/SavitriCoin.sol";
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
  
  const settings = {
    optimizer: {
      enabled: true,
      runs: variant.runs ?? 0,
    },
    viaIR: variant.viaIR,
    evmVersion: variant.evmVersion || "paris",
    metadata: {},
  };
  
  const standardJsonInput = {
    language: "Solidity",
    sources: sources,
    settings: settings,
  };
  
  const outputPath = path.join(__dirname, `savitri-standard-json-${variant.name}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(standardJsonInput, null, 2));
  
  console.log(`✅ Generated: ${outputPath}`);
  console.log(`   Compiler: ${variant.compiler}, viaIR: ${variant.viaIR}, runs: ${variant.runs ?? 0}, EVM: ${variant.evmVersion || "paris"}`);
}

async function main() {
  console.log("Generating multiple variants to try on BSCScan...\n");
  
  for (const variant of variants) {
    await generateVariant(variant);
  }
  
  console.log("\n📝 Try these files on BSCScan in order:");
  console.log("1. savitri-standard-json-no-viair.json (most likely)");
  console.log("2. savitri-standard-json-with-viair.json");
  console.log("3. savitri-standard-json-runs-200.json");
  console.log("4. savitri-standard-json-no-viair-080.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

