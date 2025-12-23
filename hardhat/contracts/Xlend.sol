// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {
    FHE,
    euint64,
    externalEuint64,
    ebool
} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";


import {CWETH} from "./CWETH.sol";

contract Xlend is ZamaEthereumConfig {
    CWETH public immutable cweth;

    constructor(address _cweth) {
        cweth = CWETH(_cweth);
    }

    struct Fund {
        address owner;
        uint64 clearLiquidity;
        euint64 liquidity; // encrypted available CWETH
    }

    event FundCreated(
        uint256 indexed fundId,
        address indexed owner,
        uint64 liquidity    
    );

    event Borrowed(
        uint256 indexed fundId,
        address indexed borrower
    );

    event Repaid(
        uint256 indexed fundId,
        address indexed borrower
    );


    uint256 public nextFundId;
    mapping(uint256 => Fund) public funds;

    // fundId => borrower => encrypted debt
    mapping(uint256 => mapping(address => euint64)) private debts;

    function createFund(
        uint64 clearLiquidity,
        externalEuint64 liquidityExt,
        bytes calldata proof
    ) external {
        // Convert encrypted input
        euint64 liquidity = FHE.fromExternal(liquidityExt, proof);

        uint256 fundId = ++nextFundId;
        funds[fundId] = Fund({
            owner: msg.sender,
            clearLiquidity: clearLiquidity,
            liquidity: liquidity
        });

        FHE.allowThis(liquidity);
        FHE.allow(liquidity, msg.sender);

        //approve xlend = setOperator(address operator, uint48 until)
        FHE.allowTransient(liquidity, address(cweth));
        cweth.confidentialTransferFrom(msg.sender, address(this), liquidity);

        emit FundCreated(fundId, msg.sender, clearLiquidity);
    }

    function borrow(
        uint256 fundId,
        externalEuint64 amountExt,
        bytes calldata proof
    ) external {
        Fund storage fund = funds[fundId];

        euint64 amount = FHE.fromExternal(amountExt, proof);

        // amount <= liquidity ?
        // ebool canBorrow = FHE.lte(amount, fund.liquidity);

        ebool canBorrow =
            FHE.or(
                FHE.lt(amount, fund.liquidity),
                FHE.eq(amount, fund.liquidity)
            );
        

        // borrowAmount = amount if allowed else 0
        euint64 borrowAmount = FHE.select(
            canBorrow,
            amount,
            FHE.asEuint64(0)
        );

        // Update encrypted accounting
        fund.liquidity = FHE.sub(fund.liquidity, borrowAmount);
        debts[fundId][msg.sender] =
            FHE.add(debts[fundId][msg.sender], borrowAmount);


        FHE.allowThis(fund.liquidity);
        FHE.allowThis(debts[fundId][msg.sender]);

        FHE.allow(fund.liquidity, fund.owner);
        FHE.allow(debts[fundId][msg.sender], msg.sender);

        FHE.allowTransient(borrowAmount, address(cweth));
        cweth.confidentialTransfer(msg.sender, borrowAmount);

        emit Borrowed(fundId, msg.sender);
    }


    function repay(
        uint256 fundId,
        externalEuint64 amountExt,
        bytes calldata proof
    ) external {
        Fund storage fund = funds[fundId];

        euint64 amount = FHE.fromExternal(amountExt, proof);
        euint64 currentDebt = debts[fundId][msg.sender];

        // repay <= debt ?
        // ebool canRepay = FHE.lte(amount, currentDebt);
        ebool canRepay =
            FHE.or(
                FHE.lt(amount, currentDebt),
                FHE.eq(amount, currentDebt)
            );

        euint64 repayAmount = FHE.select(
            canRepay,
            amount,
            FHE.asEuint64(0)
        );

        // Update encrypted accounting
        debts[fundId][msg.sender] = FHE.sub(currentDebt, repayAmount);
        fund.liquidity = FHE.add(fund.liquidity, repayAmount);

        FHE.allowThis(debts[fundId][msg.sender]);
        FHE.allowThis(fund.liquidity);

        FHE.allow(debts[fundId][msg.sender], msg.sender);
        FHE.allow(fund.liquidity, fund.owner);

        FHE.allowTransient(repayAmount, address(cweth));
        cweth.confidentialTransferFrom(msg.sender, address(this), repayAmount);

        emit Repaid(fundId, msg.sender);
    }

     function getFund(uint256 fundId) external view returns (Fund memory) {
        require(funds[fundId].owner != address(0), "Fund not found");
        return funds[fundId];
    }

    // USER DEBT (HANDLE ONLY), decrypt with relayer


    function getMyDebt(uint256 fundId) external view returns (euint64) {
        return debts[fundId][msg.sender];
    }
}
