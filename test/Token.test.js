const { accounts, contract } = require('@openzeppelin/test-environment');

const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');


// Use the different accounts, which are unlocked and funded with Ether
const [owner, alice, bob, charles] = accounts;
const decimals = new BN(18)
const tokens = (amount) => {
  return new BN(amount).imul(new BN(10).pow(decimals))
}

const Token = contract.fromArtifact('Token');
const options = {
  name: 'Token',
  symbol: 'TKN',
  decimals,
}


const initialSupply = tokens(1000)
const basePeriod = 30 // 30 sec //1 days
const holdPeriod = 120 // 2 minutes // 21 days;
const annualPercent = 12 // 12%
const annualPeriod = 600 //10 minutes; // 100 * 365 days
const value1 = tokens(10)
const value2 = tokens(20)
const value3 = tokens(30)

let totalSupply

describe('Token', function () {
  beforeEach(async function () {
    this.value = new BN(1);
    this.token = await Token.new();
    await this.token.initialize(options.name, options.symbol, options.decimals, initialSupply, owner, basePeriod, holdPeriod, annualPercent, annualPeriod);
    await this.token.transfer(alice, value1, { from: owner })
    await this.token.transfer(bob, value2, { from: owner })
    await this.token.transfer(charles, value3, { from: owner })
    totalSupply = initialSupply.add(value1).add(value2).add(value3)
  });

  // it('token totalSupply', async function () {
  //   expect(await this.token.totalSupply()).to.bignumber.equal(new BN(initialSupply));
  // });
  it('token has proper owner', async function () {
    expect(await this.token.owner()).to.equal(owner);
  });


  describe('ERC-20', function () {
    describe('totalSupply()', function () {
      it(`should have supply of: ${ initialSupply }`, async function () {
        expect(await this.token.totalSupply()).to.bignumber.equal(new BN(initialSupply));
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
        const receipt = await this.token.transfer(alice, value2, { from: charles });
        expect(await this.token.balanceOf(alice)).to.be.bignumber.equal(value1.add(value2))

        // Event assertions can verify that the arguments are the expected ones
        expectEvent(receipt, 'Transfer', {
          from: charles,
          to: alice,
          value: value2,
        });
      });
    })
    describe('mint() & burn()', function () {
      it('should fail mint when no rights', async function () {
        await expectRevert(
          this.token.mint(alice, value1, { from: alice }),
          'MinterRole: caller does not have the Minter role',
        );
      })
      it('should fail burn when no rights or amount exceeds balance', async function () {
        await expectRevert(
          this.token.burn(alice, value1, { from: alice }),
          'MinterRole: caller does not have the Minter role',
        );
        await expectRevert(
          this.token.burn(alice, value2, { from: owner }),
          'ERC20: burn amount exceeds balance',
        );
      })
      it(`should mint ${ value1 } to alice, emit event, update balance and total supply`, async function () {
        const receipt = await this.token.mint(alice, value1, { from: owner })
        expect(await this.token.balanceOf(alice)).to.be.bignumber.equal(value2)
        expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply.add(value1))
        expectEvent(receipt, 'Transfer', {
          from: constants.ZERO_ADDRESS,
          to: alice,
          value: value1,
        });
      })

      it(`should burn ${ value1 } from to alice, emit event, update balance and total supply`, async function () {
        const receipt = await this.token.burn(alice, value1, { from: owner })
        expect(await this.token.balanceOf(alice)).to.be.bignumber.equal(new BN(0))
        expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply.sub(value1))
        expectEvent(receipt, 'Transfer', {
          from: alice,
          to: constants.ZERO_ADDRESS,
          value: value1,
        });
      })
    })
    describe('approve(), allowance()', function () {
      it('should set allowance & event', async function () {
        let receipt = await this.token.approve(bob, value1, { from: charles })
        expect(await this.token.allowance(charles, bob)).to.be.bignumber.equal(value1)
        // Event assertions can verify that the arguments are the expected ones
        expectEvent(receipt, 'Approval', {
          owner: charles,
          spender: bob,
          value: value1,
        });
      })
    })
    describe('increaseApproval() & decreaseApproval()', function () {
      it('should increace approval & event', async function () {
        let receipt = await this.token.increaseAllowance(bob, value1, { from: charles })
        expect(await this.token.allowance(charles, bob)).to.be.bignumber.equal(value1)
        // Event assertions can verify that the arguments are the expected ones
        expectEvent(receipt, 'Approval', {
          owner: charles,
          spender: bob,
          value: value1,
        });
      })
      it('should decrease approval & event', async function () {
        await this.token.increaseAllowance(bob, value1, { from: charles })
        let receipt = await this.token.decreaseAllowance(bob, value1, { from: charles })
        expect(await this.token.allowance(charles, bob)).to.be.bignumber.equal(new BN(0))
        // Event assertions can verify that the arguments are the expected ones
        expectEvent(receipt, 'Approval', {
          owner: charles,
          spender: bob,
          value: new BN(0),
        });
      })
    })
    describe('transferFrom()', function () {
      it('should revert transfer without approval', async function () {
        await expectRevert(
          this.token.transferFrom(charles, alice, value1, { from: alice }),
          'ERC20: transfer amount exceeds allowance',
        );
      })
      it('should transfer approved amount & decrease allowance', async function () {
        await this.token.approve(bob, value1, { from: charles })
        receipt = await this.token.transferFrom(charles, bob, value1, { from: bob });
        expect(await this.token.balanceOf(charles)).to.be.bignumber.equal(value3.sub(value1))
        expect(await this.token.balanceOf(bob)).to.be.bignumber.equal(value2.add(value1))
        expect(await this.token.allowance(charles, bob)).to.be.bignumber.equal(new BN(0))
        expectEvent(receipt, 'Transfer', {
          from: charles,
          to: bob,
          value: value1,
        });
        await expectRevert(
          this.token.transferFrom(charles, bob, value1, { from: bob }),
          'ERC20: transfer amount exceeds allowance',
        );

      })
    })

  })

  describe('ERC-20 details', function () {
    describe('name()', function () {
      it(`should return: ${ options.name }`, async function () {
        expect(await this.token.name()).to.equal(options.name);
      })
    })

    describe('symbol()', function () {
      it(`should return: ${ options.symbol }`, async function () {
        expect(await this.token.symbol()).to.equal(options.symbol);
      })
    })

    describe('decimals()', function () {
      it(`should return ${ options.decimals }`, async function () {
        expect(await this.token.decimals.call()).to.be.bignumber.equal(options.decimals)
      })
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
  })

});
