require('dotenv').config()
const fs = require('fs')
const Web3 = require('web3')
const { setupLoader } = require('@openzeppelin/contract-loader')
const { ConfigManager, files } = require('@openzeppelin/cli');

let network = 'development'
const args = process.argv.slice(2);
if (args.length) {
  network = args[0]
}
const contractName = 'Token'
const airdropRecipientsFile = process.env.AIRDROP_RECIPIENTS_FILE || 'recipients.txt'
const airdropAccountID = process.env.AIRDROP_ACCOUNT_ID || 0
const airdropAmount = process.env.AIRDROP_AMOUNT || 0

const main = async () => {
  const projectFile = new files.ProjectFile('.openzeppelin/project.json')
  const networkConfig = await ConfigManager.initNetworkConfiguration({ network })
  let networkFile = new files.NetworkFile(projectFile, networkConfig.network)
  // console.log(`Using network config ${ networkFile.filePath }...`)

  const fullName = `${ projectFile.name }/${ contractName }`
  const proxies = networkFile.data.proxies[fullName]
  const proxy = (proxies && proxies.length) ? proxies[proxies.length - 1] : null
  if (!proxy) {
    throw new Error('No deployed contract found')
  }
  console.log(`Using contract ${ proxy.address }`)

  const { provider } = await ConfigManager.config.loadNetworkConfig(network)
  const web3 = new Web3(provider)
  const loader = setupLoader({ provider: web3 }).web3;
  const token = loader.fromArtifact(contractName, proxy.address);

  const accounts = await web3.eth.getAccounts();
  const airdropAccount = accounts[airdropAccountID]
  process.stdout.write(`Using ${ airdropAccount } account for airdrop\n`)
  process.stdout.write(`Airdrop amount ${ airdropAmount } per address\n`)

  process.stdout.write(`Check token balance...`)
  const balance = await token.methods.balanceOf(airdropAccount).call();
  if (Web3.utils.toBN(balance).lt(Web3.utils.toBN(airdropAmount))) {
    throw new Error('Token balance not enough')
  }
  process.stdout.write(` Ok\n`)

  process.stdout.write(`Reading file ${ airdropRecipientsFile }... `)
  const recipients = fs.readFileSync(airdropRecipientsFile).toString().split("\n").map(s => s.trim()).filter(s => /^0x[a-fA-F0-9]{40}$/.test(s))
  process.stdout.write(`loaded ${ recipients.length } addresses\n`)
  if (!recipients.length) {
    throw new Error('No recipients')
  }

  process.stdout.write(`Sending transaction... `)
  const receipt = await token.methods.airdrop(airdropAmount, recipients).send({
    from: airdropAccount,
    gas: 6500000, // increase if need
    // gasPrice: 1e6
  });
  const count = receipt.event && receipt.event === 'Transfer' ? 1 : (receipt.events && receipt.events.Transfer ? receipt.events.Transfer.length : 0)
  process.stdout.write(` hash: ${ receipt.transactionHash }\n`)
  console.log(`Tokens transferred to ${ count } recipients`)
}

main().catch(e => console.error('ERROR', e.message)).then(process.exit)
