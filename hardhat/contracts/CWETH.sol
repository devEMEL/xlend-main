// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

contract CWETH is ERC7984, ZamaEthereumConfig {
    uint8 private immutable DECIMALS;
    uint256 private immutable RATE;

    constructor() ERC7984("Confidential WETH", "cWETH", "") {
        DECIMALS = 6;
        RATE = 1;
    }


    function decimals() public view virtual override returns (uint8) {
        return DECIMALS;
    }


    function rate() public view returns (uint256) {
        return RATE;
    }


    function deposit(address to) public payable {
        uint256 amount = msg.value;
        require(amount > rate(), "Amount must be greater than rate");
        uint64 mintAmount = SafeCast.toUint64(amount / rate());

        _mint(to, FHE.asEuint64(mintAmount));
    }


}



