const { accounts, contract } = require('@openzeppelin/test-environment');
const { fromWei } = require('web3').utils;

const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  time
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');


// Use the different accounts, which are unlocked and funded with Ether
const [owner, alice, bob, charlie, david, ...recipients] = accounts;

const Token = contract.fromArtifact('Token');
const name = 'Token'
const symbol = 'TKN'
const decimals = new BN(18)

const tokens = (amount) => {
  return new BN(amount).imul(new BN(10).pow(decimals))
}

const initialSupply = tokens(100000)
const basePeriod = time.duration.days(1) // 30 sec
const holdPeriod = time.duration.days(21) // 2 min
const annualPercent = 12 // 12%
const annualPeriod = time.duration.years(1) //10 minutes;
const value1 = tokens(100)
const value2 = tokens(200)
const value3 = tokens(300)
const airdrop = tokens(100)
const stake = tokens(5000)
const zero = new BN(0)
// let totalSupply

describe('Token', function () {
  beforeEach(async function () {
    this.value = new BN(1);
    this.token = await Token.new();
    await this.token.initialize(name, symbol, decimals, initialSupply, owner, basePeriod, holdPeriod, annualPercent, annualPeriod);
    await this.token.transfer(alice, value1, { from: owner })
    await this.token.transfer(bob, value2, { from: owner })
    await this.token.transfer(charlie, value3, { from: owner })
    // totalSupply = initialSupply.add(value1).add(value2).add(value3)
  });
  describe('ERC-20 details', function () {
    describe('owner()', function () {
      it(`token has proper owner`, async function () {
        expect(await this.token.owner()).to.equal(owner);
      })
    })
    describe('name()', function () {
      it(`should return: ${ name }`, async function () {
        expect(await this.token.name()).to.equal(name);
      })
    })
    describe('symbol()', function () {
      it(`should return: ${ symbol }`, async function () {
        expect(await this.token.symbol()).to.equal(symbol);
      })
    })
    describe('decimals()', function () {
      it(`should return ${ decimals }`, async function () {
        expect(await this.token.decimals.call()).to.be.bignumber.equal(decimals)
      })
    })
  })

  describe('ERC-20', function () {
    describe('totalSupply()', function () {
      it(`should have supply of: ${ fromWei(initialSupply) }${ symbol }`, async function () {
        expect(await this.token.totalSupply()).to.bignumber.equal(initialSupply);
      })
    })
    describe('approve(), allowance()', function () {
      it('should set allowance & event', async function () {
        let receipt = await this.token.approve(bob, value1, { from: charlie })
        expect(await this.token.allowance(charlie, bob)).to.be.bignumber.equal(value1)
        // Event assertions can verify that the arguments are the expected ones
        expectEvent(receipt, 'Approval', {
          owner: charlie,
          spender: bob,
          value: value1,
        });
      })
    })
    describe('increaseApproval() & decreaseApproval()', function () {
      it('should increace approval & event', async function () {
        let receipt = await this.token.increaseAllowance(bob, value1, { from: charlie })
        expect(await this.token.allowance(charlie, bob)).to.be.bignumber.equal(value1)
        // Event assertions can verify that the arguments are the expected ones
        expectEvent(receipt, 'Approval', {
          owner: charlie,
          spender: bob,
          value: value1,
        });
      })
      it('should decrease approval & event', async function () {
        await this.token.increaseAllowance(bob, value1, { from: charlie })
        let receipt = await this.token.decreaseAllowance(bob, value1, { from: charlie })
        expect(await this.token.allowance(charlie, bob)).to.be.bignumber.equal(zero)
        // Event assertions can verify that the arguments are the expected ones
        expectEvent(receipt, 'Approval', {
          owner: charlie,
          spender: bob,
          value: zero,
        });
      })
    })
    describe('transfer()', function () {
      it('reverts when transferring tokens to the zero address', async function () {
        await expectRevert(
          this.token.transfer(constants.ZERO_ADDRESS, value1, { from: alice }),
          'ERC20: transfer to the zero address',
        );
      });
      it('reverts when transferring exceeded amount', async function () {
        await expectRevert(
          this.token.transfer(bob, value3, { from: alice }),
          'ERC20: transfer amount exceeds balance',
        );
      });

      it('emits a Transfer event on successful transfers', async function () {
        const receipt = await this.token.transfer(alice, value2, { from: charlie });
        expect(await this.token.balanceOf(alice)).to.be.bignumber.equal(value1.add(value2))

        // Event assertions can verify that the arguments are the expected ones
        expectEvent(receipt, 'Transfer', {
          from: charlie,
          to: alice,
          value: value2,
        });
      });
    })
    describe('transferFrom()', function () {
      it('should revert transfer without allowance', async function () {
        await expectRevert(
          this.token.transferFrom(charlie, alice, value1, { from: alice }),
          'ERC20: transfer amount exceeds allowance',
        );
      })
      it('should transfer approved amount & decrease allowance', async function () {
        await this.token.approve(bob, value1, { from: charlie });
        receipt = await this.token.transferFrom(charlie, bob, value1, { from: bob });
        expect(await this.token.balanceOf(charlie)).to.be.bignumber.equal(value3.sub(value1));
        expect(await this.token.balanceOf(bob)).to.be.bignumber.equal(value2.add(value1));
        expect(await this.token.allowance(charlie, bob)).to.be.bignumber.equal(zero);
        expectEvent(receipt, 'Transfer', {
          from: charlie,
          to: bob,
          value: value1,
        });
        await expectRevert(
          this.token.transferFrom(charlie, bob, value1, { from: bob }),
          'ERC20: transfer amount exceeds allowance',
        );

      })
    })
    describe('mint() & burn()', function () {
      it('should fail mint when no rights', async function () {
        await expectRevert(
          this.token.mint(alice, value1, { from: alice }),
          'MinterRole: caller does not have the Minter role',
        );
      })
      it('should fail burn when no rights', async function () {
        await expectRevert(
          this.token.burn(alice, value1, { from: alice }),
          'MinterRole: caller does not have the Minter role',
        );
      })
      it('should fail burn when amount exceeds balance', async function () {
        await expectRevert(
          this.token.burn(alice, value2, { from: owner }),
          'ERC20: burn amount exceeds balance',
        );
      })
      it(`should mint ${ fromWei(value1) }${ symbol } to alice & emit event, update balance and total supply`, async function () {
        const receipt = await this.token.mint(alice, value1, { from: owner })
        expect(await this.token.balanceOf(alice)).to.be.bignumber.equal(value2)
        expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply.add(value1))
        expectEvent(receipt, 'Transfer', {
          from: constants.ZERO_ADDRESS,
          to: alice,
          value: value1,
        });
      })

      it(`should burn ${ fromWei(value1) }${ symbol } from to alice, emit event, update balance and total supply`, async function () {
        const receipt = await this.token.burn(alice, value1, { from: owner })
        expect(await this.token.balanceOf(alice)).to.be.bignumber.equal(zero)
        expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply.sub(value1))
        expectEvent(receipt, 'Transfer', {
          from: alice,
          to: constants.ZERO_ADDRESS,
          value: value1,
        });
      })
    })
  })

  describe('ERC-20 airdrop', function () {
    it('should revert in case zero amount', async function () {
      await expectRevert(
        this.token.airdrop(zero, recipients, { from: alice }),
        'Airdrop: zero amount',
      );
    })
    it('should revert in case no recipients specified', async function () {
      await expectRevert(
        this.token.airdrop(airdrop, [], { from: alice }),
        'Airdrop: recipients required',
      );
    })
    it('should revert in case insufficient balance of airdrop account', async function () {
      await expectRevert(
        this.token.airdrop(airdrop, recipients, { from: charlie }),
        'Airdrop: not enough balance',
      );
    })
    it(`should perform airdrop to ${ recipients.length } recipients for ${ fromWei(airdrop) }${ symbol }`, async function () {
      const airdropTotal = airdrop.mul(new BN(recipients.length));
      await this.token.transfer(david, airdropTotal, { from: owner });
      expect(await this.token.balanceOf(david)).to.be.bignumber.equal(airdropTotal);
      const receipt = await this.token.airdrop(airdrop, recipients, { from: david });
      for (let i = 0; i < recipients.length; i++) {
        expectEvent(receipt, 'Transfer', {
          from: david,
          to: recipients[i],
          value: airdrop,
        });
        expect(await this.token.balanceOf(recipients[i])).to.be.bignumber.equal(airdrop);
      }
      expect(await this.token.balanceOf(david)).to.be.bignumber.equal(zero);
    })
  })

  describe('ERC-20 stake', function () {
    describe('basePeriod()', function () {
      it(`should return: ${ basePeriod }`, async function () {
        expect(await this.token.basePeriod()).to.be.bignumber.equal(new BN(basePeriod));
      })
    })
    describe('holdPeriod()', function () {
      it(`should return: ${ holdPeriod }`, async function () {
        expect(await this.token.holdPeriod()).to.be.bignumber.equal(new BN(holdPeriod));
      })
    })
    describe('annualPercent()', function () {
      it(`should return: ${ annualPercent }`, async function () {
        expect(await this.token.annualPercent()).to.be.bignumber.equal(new BN(annualPercent));
      })
    })
    describe('annualPeriod()', function () {
      it(`should return: ${ annualPeriod }`, async function () {
        expect(await this.token.annualPeriod()).to.be.bignumber.equal(new BN(annualPeriod));
      })
    })
    describe('createStake()', function () {
      it('should revert if no balance for stake', async function () {
        await expectRevert(
          this.token.createStake(stake, { from: alice }),
          'ERC20: burn amount exceeds balance',
        );
      })
      it(`should emit create stake event`, async function () {
        const receipt = await this.token.createStake(value1, { from: alice })
        expectEvent(receipt, 'StakeCreate', {
          stakeholder: alice,
          stake: value1
        });
      })
      it(`should be all balances correct after stake`, async function () {
        await this.token.createStake(value1, { from: alice })
        expect(await this.token.balanceOf(alice)).to.be.bignumber.equal(zero);
        expect(await this.token.stakeOf(alice)).to.be.bignumber.equal(value1);
        expect(await this.token.totalStakes()).to.be.bignumber.equal(value1);
        expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply.sub(value1));
      })
      it('should revert if second stake exists', async function () {
        await this.token.transfer(alice, stake, { from: owner });
        await this.token.createStake(value1, { from: alice })
        await expectRevert(
          this.token.createStake(stake, { from: alice }),
          'Stake: stake exists',
        );
      })

    })
    describe('cancelStake()', function () {
      it('should revert if no stake exists', async function () {
        await expectRevert(
          this.token.cancelStake({ from: alice }),
          'Stake: no stake yet',
        );
      })
      it('should revert stake on hold', async function () {
        await this.token.createStake(value1, { from: alice })
        await time.increase(time.duration.days(1))
        await this.token.cancelStake({ from: alice }),
          await expectRevert(
            this.token.cancelStake({ from: alice }),
            'Stake: stake canceled',
          );
      })
      it(`should emit cancel stake event`, async function () {
        await this.token.createStake(value1, { from: alice })
        await time.increase(time.duration.days(1))
        const receipt = await this.token.cancelStake({ from: alice })
        expectEvent(receipt, 'StakeHold', {
          stakeholder: alice
        });
      })

      it(`should hold stake with correct times and reward`, async function () {
        await this.token.transfer(alice, stake, { from: owner });
        await this.token.createStake(stake, { from: alice })
        const stakeStartAt = await time.latest()
        await time.increase(time.duration.days(1))
        await this.token.cancelStake({ from: alice })
        const stakeFinishAt = await time.latest()
        const details = await this.token.stakeDetails(alice)
        expect(details[0]).to.be.bignumber.equal(stakeStartAt);
        expect(details[1]).to.be.bignumber.equal(stakeFinishAt);
        // reward for 1 day = 5000 * 12% / 365
        const reward = new BN('1643835616438356164')
        expect(await this.token.rewardOf(alice)).to.be.bignumber.equal(reward);
      })
    })
    describe('withdrawStake()', function () {
      it('should revert if no stake exists', async function () {
        await expectRevert(
          this.token.withdrawStake({ from: alice }),
          'Stake: stake not exists or not canceled',
        );
      })
      it('should revert stake on hold', async function () {
        await this.token.createStake(value1, { from: alice })
        await time.increase(time.duration.days(1))
        await this.token.cancelStake({ from: alice })
        await time.increase(time.duration.days(1))
        await expectRevert(
          this.token.withdrawStake({ from: alice }),
          'Stake: stake on hold',
        );
      })

      it(`should be able get correct reward after hold period`, async function () {
        await this.token.transfer(alice, stake, { from: owner });
        await this.token.createStake(stake, { from: alice })
        await time.increase(time.duration.days(1))
        await this.token.cancelStake({ from: alice })
        await time.increase(time.duration.days(22))
        const receipt = await this.token.withdrawStake({ from: alice })
        // reward for 1 day = 5000 * 12% / 365
        const reward = new BN('1643835616438356164')
        expectEvent(receipt, 'StakeWithdraw', {
          stakeholder: alice,
          reward: reward
        });
        expect(await this.token.rewardOf(alice)).to.be.bignumber.equal(zero);
      })

      it(`should increase balances and total supply`, async function () {
        await this.token.transfer(alice, stake, { from: owner });
        await this.token.createStake(stake, { from: alice })
        await time.increase(time.duration.days(1))
        await this.token.cancelStake({ from: alice })
        await time.increase(time.duration.days(22))
        const receipt = await this.token.withdrawStake({ from: alice })
        // reward for 1 day = 5000 * 12% / 365
        const reward = new BN('1643835616438356164')
        expect(await this.token.balanceOf(alice)).to.be.bignumber.equal(value1.add(stake).add(reward))
        expect(await this.token.totalSupply()).to.bignumber.equal(initialSupply.add(reward));
        expect(await this.token.stakeOf(alice)).to.be.bignumber.equal(zero);
        expect(await this.token.totalStakes()).to.be.bignumber.equal(zero);

      })
    })
  })
});
