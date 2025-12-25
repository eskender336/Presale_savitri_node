const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
const CONTRACT_ADDRESS = "0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262";
const CONSTRUCTOR_ARGS = "0x000000000000000000000000bc08bf77697271f1617728c7cd049b596d13b3ba";
const CONTRACT_NAME = "TokenICO";
const COMPILER_VERSION = "v0.8.19+commit.7dd6d404";
const OPTIMIZATION = true;
const RUNS = 0;
const EVM_VERSION = "paris";

async function verifyContract() {
  console.log("🔍 Verifying TokenICO via BSCScan API...");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("");

  if (!BSCSCAN_API_KEY) {
    throw new Error("BSCSCAN_API_KEY not set in .env");
  }

  // Read flattened source
  const flattenedPath = path.join(__dirname, "TokenICO_flattened.sol");
  if (!fs.existsSync(flattenedPath)) {
    throw new Error(`Flattened file not found: ${flattenedPath}`);
  }
  const sourceCode = fs.readFileSync(flattenedPath, "utf8");
  console.log(`✅ Loaded flattened source (${sourceCode.length} chars)`);

  // Prepare form data
  const formData = new URLSearchParams({
    apikey: BSCSCAN_API_KEY,
    module: "contract",
    action: "verifysourcecode",
    contractaddress: CONTRACT_ADDRESS,
    sourceCode: sourceCode,
    codeformat: "solidity-single-file",
    contractname: CONTRACT_NAME,
    compilerversion: COMPILER_VERSION,
    optimizationUsed: OPTIMIZATION ? "1" : "0",
    runs: RUNS.toString(),
    evmversion: EVM_VERSION,
    constructorArguements: CONSTRUCTOR_ARGS.slice(2), // Remove 0x prefix
  });

  const options = {
    hostname: "api.bscscan.com",
    path: "/api",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": formData.toString().length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          if (result.status === "1") {
            console.log("✅ Verification submitted successfully!");
            console.log("GUID:", result.result);
            console.log("\n⏳ Check verification status at:");
            console.log(`   https://bscscan.com/address/${CONTRACT_ADDRESS}#code`);
            console.log("\nOr check status with:");
            console.log(`   curl "https://api.bscscan.com/api?module=contract&action=checkverifystatus&apikey=${BSCSCAN_API_KEY}&guid=${result.result}"`);
            resolve(result);
          } else {
            console.error("❌ Verification failed:");
            console.error(result);
            reject(new Error(result.message || "Verification failed"));
          }
        } catch (e) {
          console.error("❌ Failed to parse response:", data);
          reject(e);
        }
      });
    });

    req.on("error", (e) => {
      console.error("❌ Request error:", e.message);
      reject(e);
    });

    req.write(formData.toString());
    req.end();
  });
}

verifyContract()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });


