# Upgradable token with airdrop and staking

ERC20 Token build on top latest openzeppelin libraries. 
Features:
 - upgradable
 - mint & burn by Owner
 - builtin real airdrop function (takes list of address to decrease gas usage)
 - `Staking` functionality (inspired by [link](https://hackernoon.com/implementing-staking-in-solidity-1687302a82cf))
 

Deployed in [Rinkeby testnet](https://rinkeby.etherscan.io/address/0x265453b7f7d8bbab249280d7714837d9651e7ed3)

### Pre requirements

##### Ensure that you have:
 - installed `nodejs` v.10 or v.12
 - ensure `node` & `npm` console commands are works

##### Install dependencies:
 - `npm install`
 
##### Ethereum wallet:
 - prepare your **MNEMONIC** (seed phrase) from the existent wallet or create new one
 
##### Prepare environment:
 Copy `.env.exmaple` to `.env` and edit it according steps below:

 - register at http://infura.io/ to get free API key (PROJECT ID) 
   and change __INFURA_PROJECT_ID__ value in `.env`
 - change __MNEMONIC__ value in `.env` to your actual
 - adjust __AIRDROP_AMOUNT__ value in `.env` to desired
   > **NOTE:** value must be integer in `wei`s or according to decimals of your token
 - (optional) change __AIRDROP_RECIPIENTS_FILE__ to actual file name with address list
 - (optional) change __AIRDROP_ACCOUNT_ID__ to desired account index in generated sequence from mnemonic
   > **NOTE:** by default it's `0` i.e. default first account

##### Prepare token data:
 - name
 - symbol
 - decimals (`18` is max and thus good choice)
 - initial supply (integer amount according to decimals, i.e. for __555 tokens__ with __decimals=18__, it will be __555000000000000000000__)
 - initial holder (address of token owner, initial supply wil be transferred here)
   > **NOTE:** for best experience put here default (first) address generated from mnemonic, i.e with index 0
 - stake base period - minimal period for reward calculation, in seconds (1 day = 86400)
 - stake hold period - period of stake hold after canceling, reward can be taken only after, in seconds (21 days = 1814400)
 - stake annual percent - reward percent per annual period, integer ( 12 )
 - stake annual period - annual equivalent period, in seconds (1 year = 365 days = 31536000)
 
## deploy
 - run `npx oz deploy`
 - on next step with arrows keys choose **upgradeable**
 - next pick network **rinkeby** or **mainnet**
 - next choose contract **Token**
 - on question 'Call a function to initialize the instance after creating it?' answer **Y**
 - next select **initialize** function with most parameters
   ![](img1.png?raw=true)
 - next follow wizard to fill Token parameters:
   - name (__Some token__)
   - symbol (__TKN__)
   - initialSupply (__555000000000000000000__)
   - initialHolder (__0xD9dC8E5b333a89d4A7e435faD1E53f62E80309Fd__) 
     > **NOTE:** Initial holder WILL BE OWNER of Token, i.e. can do mint/burn
   - stakeBasePeriod (__86400__)
   - stakeHoldPeriod (__1814400__)
   - stakeAnnualPercent (__12__)
   - stakeAnnualPeriod (__31536000__)
 

## usage

Token supports all ERC20 standard functions.
 
In addition:
 - `mint(address account, uint256 amount)` - owner can mint some amount for specified account
 - `burn(address account, uint256 amount)` - owner can burn some amount from specified account
 - `airdrop(uint256 amount, address [] calldata recipients)` - transfer a specified amount to each address in list, function caller must have enough token balance
 - `stakeParams(uint256 basePeriod, uint256 holdPeriod, uint256 annualPercent, uint256 annualPeriod)` - owner can change stake parameters
 - `createStake(uint256 stake)` - create the stake for caller, caller must have enough token balance
 - `cancelStake()` - cancel the stake for caller and hold staked amount 
 - `withdrawStake()` - caller take reward after hold period
 - `isStakeholder(address stakeholder) returns (bool)` - check if address is stakeholder
 - `rewardOf(address stakeholder) returns(uint256) ` - get provision or calculated reward for address
 - `stakeOf(address stakeholder) returns (uint256)` - staked amount of stakeholder
 - `stakeDetails(address stakeholder) returns (uint256, uint256)` - returns staking start and finish time for address
 - `totalStakes() returns (uint256) ` - total staked amount at the moment
 - `basePeriod()`
 - `holdPeriod()`
 - `annualPercent()`
 - `annualPeriod()`

### airdrop
 - fill `recipients.txt` with address list (one address per line, line with incorrect address will be ignored)
 - ensure you have enough ETH ant token balance on the owner account (or account which index in specified `.env`)
 - run `npm run airdrop-rinkeby` or `npm run airdrop-mainnet` to perform airdrop
 > **NOTE:** airdrop was test with ~900 addresses in list per one transaction, it takes about 6M of gas [see tx](https://rinkeby.etherscan.io/tx/0x280d50a16d20527306cf042b1eecff4100df425ebab27f056bb4c38208bed4e0)    
 
## run local tests
 - `npm test`


