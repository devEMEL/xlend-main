// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

contract CWETH is ERC7984, ZamaEthereumConfig {
    uint8 private immutable DECIMALS;
    uint256 public constant RATE = 1e12;

    constructor() ERC7984("Confidential WETH", "cWETH", "") {
        DECIMALS = 6;
    }


    function decimals() public view virtual override returns (uint8) {
        return DECIMALS;
    }


    function rate() public view returns (uint256) {
        return RATE;
    }


    function deposit(address to) public payable {
        uint256 weiAmount = msg.value;

        require(weiAmount >= RATE, "Amount too small");

        // Convert wei (18 decimals) → token units (6 decimals)
        uint256 tokenAmount = weiAmount / RATE;

        // ERC7984 mint amount must fit uint64
        uint64 mintAmount = SafeCast.toUint64(tokenAmount);

        // Mint encrypted tokens
        _mint(to, FHE.asEuint64(mintAmount));
    }


}



