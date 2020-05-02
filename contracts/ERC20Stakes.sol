pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

/**
 * @dev Extension of {ERC20} that implements a basic ERC20 staking
 * with incentive distribution.
 */
contract ERC20Stakes is Initializable, ERC20 {
    using SafeMath for uint256;

    // TODO change to real
    uint256 private _holdPeriod; // = 2 minutes; // 21 days;
    uint256 private _annualPercent; // = 12; // 12%
    uint256 private _basePeriod; // = 30 seconds; //1 days
    uint256 private _annualPeriod; // = 100 * 10 minutes; // 100 * 365 days

    event StakeCreate(address indexed stakeholder, uint256 stake);
    event StakeHold(address indexed stakeholder);
    event StakeWithdraw(address indexed stakeholder, uint256 reward);

    struct Stake {
        uint256 amount;
        uint256 stakedAt;
        uint256 heldAt;
    }

    /**
     * @dev stakeholders list
     */
    address[] private _stakeholders;

    /**
     * @dev the stakes for each stakeholder.
     */
    mapping(address => Stake) private _stakes;

    modifier onlyStakeExists(address stakeholder) {
        require(_stakes[stakeholder].amount > 0, "Stake: no stake yet");
        require(_stakes[stakeholder].heldAt == 0, "Stake: stake canceled");
        require(_stakes[stakeholder].stakedAt < now, "Stake: stake just created");
        _;
    }

    modifier onlyNoStakeYet(address stakeholder) {
        require(_stakes[stakeholder].amount == 0, "Stake: stake exists");
        _;
    }

    modifier onlyStakeUnheld(address stakeholder) {
        require(_stakes[stakeholder].heldAt > _stakes[stakeholder].stakedAt, "Stake: stake not exists or not canceled");
        require(_stakes[stakeholder].heldAt + _holdPeriod <= now, "Stake: stake on hold");
        _;
    }

    function initialize(uint256 basePeriod, uint256 holdPeriod, uint256 annualPercent, uint256 annualPeriod) public initializer {
        _stakeParams(basePeriod, holdPeriod, annualPercent, annualPeriod);
    }


    function _stakeParams(uint256 basePeriod, uint256 holdPeriod, uint256 annualPercent, uint256 annualPeriod) internal {
        _holdPeriod = holdPeriod;
        _annualPercent = annualPercent;
        _basePeriod = basePeriod;
        _annualPeriod = annualPeriod.mul(100);
    }

    function basePeriod() external view returns (uint256) {
        return _basePeriod;
    }
    function holdPeriod() external view returns (uint256) {
        return _holdPeriod;
    }
    function annualPercent() external view returns (uint256) {
        return _annualPercent;
    }
    function annualPeriod() external view returns (uint256) {
        return _annualPeriod / 100;
    }

    /**
   * @dev A method for a stakeholder to create a stake
   */
    function createStake(uint256 stake) external {
        _createStake(_msgSender(), stake);
    }

    /**
     * @dev A method for a stakeholder to remove a stake
     */
    function cancelStake() external {
        _holdStake(_msgSender());
    }

    /**
    * @dev A method to allow a stakeholder to withdraw his rewards.
    */
    function withdrawStake() external {
        _removeStake(_msgSender());
    }

    /**
     * @dev internal method for a stakeholder to create a stake.
     * @param stakeholder Stakeholder address
     * @param stake The size of the stake to be created.
     */
    function _createStake(address stakeholder, uint256 stake) internal onlyNoStakeYet(stakeholder) {
        _burn(stakeholder, stake);
        _stakes[stakeholder] = Stake({
            amount : stake,
            stakedAt : now,
            heldAt : 0
            });
        _addStakeholder(stakeholder);
        emit StakeCreate(stakeholder,  stake);

    }

    /**
     * @dev internal method for a stakeholder to hold a stake.
     * @param stakeholder Stakeholder address
     */
    function _holdStake(address stakeholder) internal onlyStakeExists(stakeholder) {
        _stakes[stakeholder].heldAt = now;
        emit StakeHold(stakeholder);
    }

    /**
     * @dev internal method for a stakeholder to remove a stake.
     * @param stakeholder Stakeholder address
     */
    function _removeStake(address stakeholder) internal onlyStakeUnheld(stakeholder) {
        uint256 reward = _reward(stakeholder, _stakes[stakeholder].heldAt);
        uint256 stake = _stakes[stakeholder].amount;
        delete _stakes[stakeholder];
        _removeStakeholder(stakeholder);
        _mint(stakeholder, stake.add(reward));
        emit StakeWithdraw(stakeholder, reward);
    }

    /**
     * @dev A method to retrieve the stake for a stakeholder.
     * @param stakeholder The stakeholder to retrieve the stake for.
     * @return uint256 The amount of wei staked.
     */
    function stakeOf(address stakeholder) public view returns (uint256){
        return _stakes[stakeholder].amount;
    }

    function stakeDetails(address stakeholder) public view returns (uint256, uint256){
        return (_stakes[stakeholder].stakedAt, _stakes[stakeholder].heldAt);
    }

    function rewardOf(address stakeholder) public view returns(uint256) {
        if (_stakes[stakeholder].stakedAt == 0) return 0;
        return _reward(stakeholder, _stakes[stakeholder].heldAt == 0 ? now : _stakes[stakeholder].heldAt);
    }

    function _reward(address stakeholder, uint rewardedAt) internal view returns(uint256) {
        // total stake period in days
        uint256 period = ((rewardedAt - _stakes[stakeholder].stakedAt) / _basePeriod) * _basePeriod;
        // reward for period according annual percent value
        return _stakes[stakeholder].amount.mul(period).mul(_annualPercent) / _annualPeriod;
    }

    /**
     * @dev A method to the aggregated stakes from all stakeholders.
     * @return uint256 The aggregated stakes from all stakeholders.
     */
    function totalStakes() public view returns (uint256) {
        uint256 _totalStakes = 0;
        for (uint256 s = 0; s < _stakeholders.length; s++) {
            _totalStakes = _totalStakes.add(_stakes[_stakeholders[s]].amount);
        }
        return _totalStakes;
    }

    /**
     * @dev A method to check if an address is a stakeholder.
     * @param stakeholder The address to verify.
     * @return bool, uint256 Whether the address is a stakeholder,
     * and if so its position in the stakeholders array.
     */
    function isStakeholder(address stakeholder) public view returns (bool, uint256) {
        for (uint256 s = 0; s < _stakeholders.length; s++) {
            if (stakeholder == _stakeholders[s]) return (true, s);
        }
        return (false, 0);
    }

    /**
     * @dev A method to add a stakeholder.
     * @param stakeholder The stakeholder to add.
     */
    function _addStakeholder(address stakeholder) internal {
        (bool _isStakeholder,) = isStakeholder(stakeholder);
        if (!_isStakeholder) _stakeholders.push(stakeholder);
    }

    /**
     * @dev A method to remove a stakeholder.
     * @param stakeholder The stakeholder to remove.
     */
    function _removeStakeholder(address stakeholder) internal {
        (bool _isStakeholder, uint256 s) = isStakeholder(stakeholder);
        if (_isStakeholder) {
            _stakeholders[s] = _stakeholders[_stakeholders.length - 1];
            _stakeholders.pop();
        }
    }

    uint256[50] private ______gap;
}
