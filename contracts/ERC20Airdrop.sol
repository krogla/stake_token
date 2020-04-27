pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

/**
 * @dev Extension of {ERC20} that implements a basic ERC20 staking
 * with incentive distribution.
 */
contract ERC20Airdrop is Initializable, ERC20 {
    using SafeMath for uint256;

    function airdrop(uint256 amount, address [] calldata recipients) external {
        address sender = _msgSender();
        require(recipients.length.mul(amount) >= balanceOf(sender), "Airdrop: not enough balance");
        for (uint i = 0; i < recipients.length; i++) {
            _transfer(sender, recipients[i], amount);
        }
    }
    uint256[50] private ______gap;
}
