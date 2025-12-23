import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  let cwethAddress: string;

  cwethAddress = "0x277d57385768235e93f0B3fC67b48563Eb4A5a8c";


  const xlend = await deploy("Xlend", {
    from: deployer,
    args: [cwethAddress],
    log: true,
    deterministicDeployment: false,
  });

  console.log(`Deployer Address: ${deployer}`)
  console.log(`Xlend deployed to: ${xlend.address}`);
  // }
  
};

export default func;
func.tags = ["xlend"];

// npx hardhat deploy --network sepolia --tags xlend
// xlend address = 0x58228Bb87820aF037776182e78B41eb4fF82119d
