async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const TransparentService = await ethers.getContractFactory("TransparentService");
  // Pass the deployer's address as main admin
  const service = await TransparentService.deploy(deployer.address);
  await service.deployed();

  console.log("TransparentService deployed to:", service.address);
  console.log("Main Admin set to:", deployer.address);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});