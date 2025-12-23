import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, network } from "hardhat";
import { Xlend, Xlend__factory, CWETH, CWETH__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";


type Signers = {
  deployer: HardhatEthersSigner;
  acc1: HardhatEthersSigner;
  acc2: HardhatEthersSigner;
  acc3: HardhatEthersSigner;
};


async function deployFixture() {

    const CWETHFactory = (await ethers.getContractFactory("CWETH")) as CWETH__factory;
    const CWETHFactoryContract = await CWETHFactory.deploy();
    const CWETHContractAddress = await CWETHFactoryContract.getAddress();

    const XlendFactory = (await ethers.getContractFactory("Xlend")) as Xlend__factory;
    const XlendFactoryContract = await XlendFactory.deploy(CWETHContractAddress); 
    const XlendContractAddress = await XlendFactoryContract.getAddress();

    return { 
        CWETHFactoryContract,
        CWETHContractAddress,
        XlendFactoryContract,
        XlendContractAddress,  
  };
}

describe("Xlend Test", function () {
    let signers: Signers;
    let CWETHFactoryContract: CWETH;
    let CWETHContractAddress: string;
    let XlendFactoryContract: Xlend;
    let XlendContractAddress: string;


    before(async function () {
        const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
        signers = { 
        deployer: ethSigners[0], 
        acc1: ethSigners[1], 
        acc2: ethSigners[2], 
        acc3: ethSigners[3] 
        };
    });

    beforeEach(async () => {
        // Check if running in FHEVM mock environment
        if (!fhevm.isMock) {
            throw new Error(`This hardhat test suite can only run in FHEVM mock environment`);
        }
        ({ 
            CWETHFactoryContract,
            CWETHContractAddress,
            XlendFactoryContract,
            XlendContractAddress,
        } = await deployFixture());

         // Initialize FHEVM
        await fhevm.initializeCLIApi();
    });

    describe("Contract Deployment and Initialization", function () {

        it("should deploys contracts", async function () {
            expect(CWETHContractAddress).to.properAddress;
            expect(XlendContractAddress).to.properAddress;
            console.log({CWETHContractAddress, XlendContractAddress});
        });
    });


    describe("Create Funds", function () {

        it("should create fund", async function () {
            // mint cweth
            await CWETHFactoryContract.deposit(signers.deployer.address, {value: ethers.parseEther("10")});
            //encrypt value
            const encryptedInput = await fhevm.createEncryptedInput(XlendContractAddress, signers.deployer.address)
            .add64(ethers.parseUnits("0.03", 6))
            .encrypt();

            // create fund
            const until = Math.floor(Date.now() / 1000) + 1000;
            await CWETHFactoryContract.setOperator(XlendContractAddress, until)
            await XlendFactoryContract.createFund(ethers.parseUnits("0.03", 6), encryptedInput.handles[0], encryptedInput.inputProof);


            // borrow

            const encryptedacc1 = await fhevm.createEncryptedInput(XlendContractAddress, signers.acc1.address)
            .add64(ethers.parseUnits("0.01", 6))
            .encrypt();
            await XlendFactoryContract.connect(signers.acc1).borrow(1, encryptedacc1.handles[0], encryptedacc1.inputProof);
            await network.provider.send("evm_mine");
            await network.provider.send("evm_mine");


            const debt = await XlendFactoryContract.connect(signers.acc1).getMyDebt(1);
            const debtClear = await fhevm.userDecryptEuint(FhevmType.euint64, debt, XlendContractAddress, signers.acc1);
            console.log({debt, debtClear: ethers.formatUnits(debtClear, 6)})
            


            const encryptedPayback = await fhevm.createEncryptedInput(XlendContractAddress, signers.acc1.address)
            .add64(ethers.parseUnits("0.01", 6))
            .encrypt();
            await CWETHFactoryContract.connect(signers.acc1).setOperator(XlendContractAddress, until)
            await XlendFactoryContract.connect(signers.acc1).repay(1, encryptedPayback.handles[0], encryptedPayback.inputProof);

            await network.provider.send("evm_mine");
            await network.provider.send("evm_mine");

            const debt0 = await XlendFactoryContract.connect(signers.acc1).getMyDebt(1);
            const debt0Clear = await fhevm.userDecryptEuint(FhevmType.euint64, debt0, XlendContractAddress, signers.acc1);
            console.log({debt0, debt0Clear: ethers.formatUnits(debt0Clear, 6)})


        })
    });

});




