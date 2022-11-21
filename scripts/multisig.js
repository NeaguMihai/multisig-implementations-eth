const { ethers } = require("ethers");
const { parseUnits } = require("ethers/lib/utils");
const { readFileSync } = require("fs");

const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545');
const main = async () => {
  const args = process.argv.slice(2);
  const address = args[0];
  const addressArray = [];
  for(let i = 0; i < +address; i++) {
    addressArray.push(provider.getSigner(i));
  }
  const data = JSON.parse(readFileSync('./artifacts/MultiSigWallet.json', 'utf8'));  

  const bytecode = data.data.bytecode;
  const cf = new ethers.ContractFactory(data.abi, bytecode.object, provider.getSigner(0));
  const tx = cf.getDeployTransaction(await Promise.all(addressArray.map(async address => await address.getAddress())));
  const txHash = await provider.getSigner(0).sendTransaction(tx);
  const receipt = await txHash.wait();
  const contract = await cf.deploy(await Promise.all(addressArray.map(async address => await address.getAddress())));
  await contract.deployed();
  const approvers = await contract.deposit({ value: parseUnits('0.0001', 'ether') });
  await approvers.wait();
  const init = await contract.initiateTransfer(parseUnits('0.00001', 'ether'), '0x9D83e6818BCCB6c5992712de7131082ff74a1C25');
  const res = await init.wait();
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
  console.log('PRETUL INITIALIZARII TRANZACTIEI', gasPrice.mul(res.cumulativeGasUsed).toString().split('').reverse().reduce((acc, cur, i) => {
    if(i % 3 === 0 && i !== 0) {
      return acc + ',' + cur;
    }
    return acc + cur;
  } ,'').split('').reverse().join(''));
  console.log('GAS ', res.cumulativeGasUsed.toString());
  const toApprove = addressArray.slice(1)
  let index = 0;
  for(let i of toApprove) {
    index ++;
    const approve = await contract.connect(i).approveTransfer(ethers.BigNumber.from(0), {
      gasLimit: 1000000,
    });
    const res = await approve.wait();
    console.log('PRETUL APROBARII ' + index, gasPrice.mul(res.cumulativeGasUsed).toString().split('').reverse().reduce((acc, cur, i) => {
      if(i % 3 === 0 && i !== 0) {
        return acc + ',' + cur;
      }
      return acc + cur;
    } ,'').split('').reverse().join(''));
    console.log('GAS ', res.cumulativeGasUsed.toString());
  }
}
main()