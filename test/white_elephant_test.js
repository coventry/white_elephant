const linkToken = require('./LinkToken.json')
const TruffleContract = require('truffle-contract')

let accounts
let world
let owner
let recipient

before(async function queryEthClientForConstants () {
  accounts = await web3.eth.getAccounts()
  ;[world, owner, recipient] = accounts.slice(0, 3)
})

const stringToBytes = s => Buffer.from(s, 'ascii')
const hexToString = h => {
  var n
  if (h.startsWith('0x')) {
    n = 2
  } else {
    n = 0
  }
  var rv = ''
  for (; n < h.length; n += 2) {
    rv += String.fromCharCode(parseInt(h.substr(n, 2)), 16)
  }
  return rv
}

const linkContract = async (account) => {
  const receipt = await web3.eth.sendTransaction({
    data: linkToken.bytecode,
    from: account,
    gasLimit: 2000000
  })
  const contract = TruffleContract({ abi: linkToken.abi })
  contract.setProvider(web3.currentProvider)
  contract.defaults({
    from: account,
    gas: 3500000,
    gasPrice: 10000000000
  })

  return contract.at(receipt.contractAddress)
}

const WhiteElephant = artifacts.require('WhiteElephantTestHelper')

contract('WhiteElephant', async accounts => {
  const answer = 'foo'
  const salt = stringToBytes('there\'s no spoon, Neo, no spoon.')
  const requiredHash = web3.utils.sha3(salt + answer)
  let linkToken
  let whiteElephant
  beforeEach(async () => {
    linkToken  = await linkContract(world)
    whiteElephant = await WhiteElephant.new(linkToken.address, salt,
                                            requiredHash, { from: owner })
  })
  it('runs a test', async () => {})
  it('tells me what the concatenation is', async () => {
    assert.equal(salt + answer, await whiteElephant.concat_.call(answer))
  })
  it('tells me what the expected hash is', async () => {
    assert.equal(requiredHash, await whiteElephant.hash_(answer))
  })
  it('rejects wrong answers', async () => {
    let errorMessage
    await whiteElephant.guessAnswer('bar', recipient)
      .catch(error => {
        assert(error, 'expected error to be raised')
        assert(error.message, 'expected error to be raised')
        return error.message
      })
      .then(msg => { errorMessage = msg })
    assert(errorMessage.includes('wrong answer; try again'))
  })
  it('pays the sender its link balance, when it gets the right answer',
     async () => {
       await linkToken.transfer(owner, '1000000000000000000', { from: world })
       await linkToken.transfer(whiteElephant.address, '500000000000000000',
                                { from: owner })
       assert.equal(await linkToken.balanceOf(whiteElephant.address),
                    '500000000000000000')
       await whiteElephant.guessAnswer(answer, recipient, { from: recipient })
       assert.equal(await linkToken.balanceOf(recipient), '500000000000000000')
     })
  it('allows the owner, and only the owner, to withdraw funds',
          async () => {
            const ethAmount = 100
            const linkAmount = 100
            await web3.eth.sendTransaction(
              { to: whiteElephant.address, from: owner, value: ethAmount })
            await linkToken.transfer(whiteElephant.address, linkAmount,
                                     { from: world })
            let errorMessage
            await whiteElephant.ownerWithdraw(world, { from: world })
              .catch(err => {
                assert(err, 'expected error to be raised')
                assert(err.message, 'expected error to be raised')
                return err.message
              })
              .then(msg => { errorMessage = msg })
            assert(errorMessage.includes('only owner can withdraw'),
                   'people other than owner can withdraw!')
            const otherAddress = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
            await whiteElephant.ownerWithdraw(otherAddress, { from: owner })
            assert.equal(await web3.eth.getBalance(otherAddress), ethAmount)
            assert.equal(await linkToken.balanceOf(otherAddress), linkAmount)
          })
})

