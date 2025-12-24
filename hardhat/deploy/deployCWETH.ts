import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

 
  // Deploy cWETH
  const cweth = await deploy("CWETH", {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: false,
  });

  console.log(`CWETH deployed to: ${cweth.address}`);
};

export default func;
func.tags = ["cweth"];

// npx hardhat deploy --network sepolia --tags cweth
// cweth address = 0x8205Ef153F39B2c0eae577D8d2E90461049601AC
