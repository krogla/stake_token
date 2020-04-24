pragma solidity ^0.6.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";
import "./ERC20Stakes.sol";

contract BonusToken is Initializable, Ownable, ERC20Stakes, ERC20Detailed, ERC20Mintable, ERC20Burnable {

    function initialize(string memory name, string memory symbol, uint8 decimals, uint256 initialSupply, address initialHolder) public initializer {
        Ownable.initialize(msg.sender);
        ERC20Detailed.initialize(name, symbol, decimals);
        // Mint the initial supply
        _mint(initialHolder, initialSupply);

        // Initialize the minter roles, and renounce them
        ERC20Mintable.initialize(msg.sender);

    }

    /**
    * @dev non payable default function
    *
    * prevents to receive eth by direct transfer to contract
    */
    function () external {}

    /**
    * @dev allow minter to burn tokens from any account
    */
    function burn(address account, uint256 amount) public onlyMinter returns (bool) {
        _burn(account, amount);
        return true;
    }

    uint256[50] private ______gap;
}
