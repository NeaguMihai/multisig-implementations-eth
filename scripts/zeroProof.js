const { ethers } = require("ethers");
const { readFileSync } = require("fs");
const { parseUnits } = require("ethers/lib/utils");
const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545');

const wallets = [];
const generateWallets = (count) => {
  for (let i = 0; i < count; i++) {
    wallets.push(ethers.Wallet.createRandom());
  }
} 

const main = async () => {
  generateWallets(1);
  const data = JSON.parse(readFileSync('./artifacts/ZeroProof.json', 'utf8'));  
  const addresses = ['0xE803e8079531Fd53D2DCAd1cc1ef483195863f53', ...wallets.map((wallet) => wallet.address)];
  const bytecode = data.data.bytecode;
  const cf = new ethers.ContractFactory(data.abi, bytecode.object, provider.getSigner(0));
  const tx = cf.getDeployTransaction(addresses);
  const txHash = await provider.getSigner(0).sendTransaction(tx);
  const receipt = await txHash.wait();
  const contract = await cf.deploy(addresses);
  await contract.deployed();
  const approvers = await contract.deposit({ value: parseUnits('0.01', 'ether') });
  await approvers.wait();

  const gasPrice = ethers.BigNumber.from('14').mul(ethers.BigNumber.from('10').pow(9));
  console.log('Deploy Cost: ', gasPrice.mul(receipt.cumulativeGasUsed)
  .toString()
  .split('')
  .reverse()
  .reduce((acc, cur, i) => {
    if(i % 3 === 0 && i !== 0) {
      return acc + ',' + cur; 
    }
    return acc + cur;
  } ,'')
  .split('')
  .reverse()
  .join(''));
  console.log('GAS ', receipt.cumulativeGasUsed.toString());
  const resTx = await contract.getTransferTransaction('0xbCF285a2342ACa6BC601b72F9De5AAe7d561040d', '0xE803e8079531Fd53D2DCAd1cc1ef483195863f53', parseUnits('0.01', 'ether'));
  const sigs = [];
  for(let i = 0; i < wallets.length; i++) {
    const wall = wallets[i];
    const sig = await ethers.utils.joinSignature(wall._signingKey().signDigest(Buffer.from(resTx.slice(2), 'hex')));
    sigs.push(sig);
  }
  const resSig = await contract.transferFromContract('0xbCF285a2342ACa6BC601b72F9De5AAe7d561040d', parseUnits('0.01', 'ether'), sigs);
  const txRes = await resSig.wait();
  console.log('TxCost: ', gasPrice.mul(txRes.cumulativeGasUsed)
  .toString()
  .split('')
  .reverse()
  .reduce((acc, cur, i) => {
    if(i % 3 === 0 && i !== 0) {
      return acc + ',' + cur; 
    }
    return acc + cur;
  } ,'')
  .split('')
  .reverse()
  .join(''));
  
  // const c = await contract.transferFromContract('0xE803e8079531Fd53D2DCAd1cc1ef483195863f53', 10000, signature);
  // console.log(await c);
  // console.log((await contract.funds()).toString());
  // const res = await signer.call({ to: contract.address, data: resTx});
  // console.log(await res.wait());
  // await res.wait();
  // console.log((await contract.funds()).toString());

}
main();