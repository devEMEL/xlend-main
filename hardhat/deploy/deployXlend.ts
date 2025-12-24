import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  let cwethAddress: string;

  cwethAddress = "0x8205Ef153F39B2c0eae577D8d2E90461049601AC";


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
// xlend address = 0x8B1fffa4943FB18a7D763A24543086e8D570e93a
