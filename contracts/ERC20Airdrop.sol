pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

contract ERC20Airdrop is Initializable, ERC20 {
    using SafeMath for uint256;

    function airdrop(uint256 amount, address [] calldata recipients) external {
        require(amount > 0, "Airdrop: zero amount");
        require(recipients.length > 0, "Airdrop: recipients required");
        address sender = _msgSender();
        require(balanceOf(sender) >= amount.mul(recipients.length), "Airdrop: not enough balance");
        for (uint i = 0; i < recipients.length; i++) {
            _transfer(sender, recipients[i], amount);
        }
    }

    uint256[50] private ______gap;
}
