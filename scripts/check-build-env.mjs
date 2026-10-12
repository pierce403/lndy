const required = ["VITE_THIRDWEB_CLIENT_ID", "VITE_LAUNCHER_CONTRACT_ADDRESS"];
for (const name of required) {
  if (!process.env[name]?.trim()) {
    throw new Error(`Missing required public build variable: ${name}`);
  }
}
if (!/^0x[a-fA-F0-9]{40}$/.test(process.env.VITE_LAUNCHER_CONTRACT_ADDRESS)) {
  throw new Error("VITE_LAUNCHER_CONTRACT_ADDRESS must be an Ethereum address");
}
