const hre = require("hardhat");

async function main() {
  const contractAddress = "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
  
  console.log("Checking deployed contract functions...");
  console.log("Address:", contractAddress);
  console.log("");
  
  // Get contract bytecode
  const code = await hre.ethers.provider.getCode(contractAddress);
  if (code === "0x") {
    console.error("❌ No contract found at this address");
    process.exit(1);
  }
  
  console.log("✅ Contract found");
  console.log("Bytecode length:", code.length, "characters");
  console.log("");
  
  // Try to get contract instance and check functions
  try {
    const contract = await hre.ethers.getContractAt("SavitriCoin", contractAddress);
    
    console.log("Checking for functions...");
    console.log("");
    
    // Check ERC20 functions
    const checks = [
      { name: "name()", func: () => contract.name() },
      { name: "symbol()", func: () => contract.symbol() },
      { name: "decimals()", func: () => contract.decimals() },
      { name: "totalSupply()", func: () => contract.totalSupply() },
      { name: "balanceOf(address)", func: () => contract.balanceOf("0x0000000000000000000000000000000000000000") },
      
      // Ownable functions
      { name: "owner()", func: () => contract.owner(), optional: true },
      { name: "transferOwnership(address)", func: null, optional: true },
      { name: "renounceOwnership()", func: null, optional: true },
      
      // Custom functions
      { name: "setBlockStatus(address,bool)", func: null, optional: true },
      { name: "setAllowedSender(address,bool)", func: null, optional: true },
      { name: "setTransfersEnabled(bool)", func: null, optional: true },
      { name: "blockedAddresses(address)", func: () => contract.blockedAddresses("0x0000000000000000000000000000000000000000"), optional: true },
      { name: "allowedSenders(address)", func: () => contract.allowedSenders("0x0000000000000000000000000000000000000000"), optional: true },
      { name: "transfersEnabled()", func: () => contract.transfersEnabled(), optional: true },
    ];
    
    console.log("Function Check Results:");
    console.log("======================");
    
    for (const check of checks) {
      if (check.func) {
        try {
          await check.func();
          console.log(`✅ ${check.name} - EXISTS`);
        } catch (e) {
          if (check.optional) {
            console.log(`❌ ${check.name} - NOT FOUND (optional)`);
          } else {
            console.log(`❌ ${check.name} - NOT FOUND (required!)`);
          }
        }
      } else {
        // Check if function exists in interface
        try {
          const iface = contract.interface;
          if (iface.getFunction(check.name.split("(")[0])) {
            console.log(`✅ ${check.name} - EXISTS (in interface)`);
          } else {
            console.log(`❌ ${check.name} - NOT FOUND`);
          }
        } catch (e) {
          console.log(`❌ ${check.name} - NOT FOUND`);
        }
      }
    }
    
    console.log("");
    console.log("Checking contract interface...");
    const iface = contract.interface;
    console.log("Total functions in interface:", Object.keys(iface.functions).length);
    console.log("");
    console.log("All functions:");
    Object.keys(iface.functions).forEach((func, i) => {
      console.log(`  ${i + 1}. ${func}`);
    });
    
  } catch (error) {
    console.error("Error checking contract:", error.message);
    console.log("");
    console.log("This might mean the contract doesn't match the expected interface.");
    console.log("The deployed contract might be a different version.");
  }
  
  // Check bytecode for function selectors
  console.log("");
  console.log("Checking bytecode for function selectors...");
  console.log("===========================================");
  
  const selectors = {
    "owner()": "8da5cb5b",
    "transferOwnership(address)": "f2fde38b",
    "renounceOwnership()": "715018a6",
    "setBlockStatus(address,bool)": "4f93208a", // Need to calculate
    "setAllowedSender(address,bool)": "26b9ce13", // Need to calculate
    "setTransfersEnabled(bool)": "4b52ffb0", // Need to calculate
    "blockedAddresses(address)": "bef97c87", // Need to calculate
    "allowedSenders(address)": "fadbcf48", // Need to calculate
    "transfersEnabled()": "3f4ba83a", // Need to calculate
  };
  
  // Calculate actual selectors
  const { keccak256, toUtf8Bytes } = hre.ethers.utils;
  const actualSelectors = {};
  for (const [name, expected] of Object.entries(selectors)) {
    const hash = keccak256(toUtf8Bytes(name));
    const selector = hash.slice(0, 10);
    actualSelectors[name] = selector;
    
    const found = code.toLowerCase().includes(selector.toLowerCase());
    console.log(`${found ? "✅" : "❌"} ${name}: ${selector} ${found ? "FOUND" : "NOT FOUND"}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

