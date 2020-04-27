pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
//import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";
import "./ERC20Stakes.sol";
import "./ERC20Airdrop.sol";

contract Token is Initializable, Ownable, ERC20Airdrop, ERC20Stakes, ERC20Detailed, ERC20Mintable {

    function initialize(string memory name, string memory symbol, uint8 decimals, uint256 initialSupply, address initialHolder,
        uint256 basePeriod, uint256 holdPeriod, uint256 annualPercent, uint256 annualPeriod) public initializer {
        Ownable.initialize(initialHolder);
        ERC20Detailed.initialize(name, symbol, decimals);
        // Mint the initial supply
        _mint(initialHolder, initialSupply * 10 ** uint256(decimals));

        // Initialize the minter roles, and renounce them
        ERC20Mintable.initialize(initialHolder);


        //        uint256 constant _holdPeriod = 2 minutes; // 21 days;
        //        uint256 constant _annualPercent = 12; // 12%
        //        uint256 constant _basePeriod = 30 seconds; //1 days
        //        uint256 constant _annualPeriod = 100 * 10 minutes; // 100 * 365 days
        ERC20Stakes.initialize(basePeriod, holdPeriod, annualPercent, annualPeriod);

    }

//    function initialize(string memory name, string memory symbol) public initializer {
//        Ownable.initialize(msg.sender);
//        ERC20Detailed.initialize(name, symbol, 18);
//        // Mint the initial supply
//        _mint(msg.sender, 500 * 10 ** 18);
//
//        // Initialize the minter roles, and renounce them
//        ERC20Mintable.initialize(msg.sender);
//
//
//        //        uint256 constant _basePeriod = 30 seconds; //1 days
//        //        uint256 constant _holdPeriod = 2 minutes; // 21 days;
//        //        uint256 constant _annualPercent = 12; // 12%
//        //        uint256 constant _annualPeriod = 100 * 10 minutes; // 100 * 365 days
////        ERC20Stakes.initialize(basePeriod, holdPeriod, annualPercent, annualPeriod);
//        ERC20Stakes.initialize(30 seconds, 2 minutes, 12, 100 * 10 minutes);
//
//    }

    /**
    * @dev non payable default function
    *
    * prevents to receive eth by direct transfer to contract
    */
    function() external {}

    /**
    * @dev allow minter to burn tokens from any account
    */
    function burn(address account, uint256 amount) public onlyMinter returns (bool) {
        _burn(account, amount);
        return true;
    }





    uint256[50] private ______gap;
}
