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
// cweth address = 0x277d57385768235e93f0B3fC67b48563Eb4A5a8c
