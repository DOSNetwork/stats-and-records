const StakingABI = require('./UnipoolABI.json');
const Web3 = require('web3');
const assert = require('assert');
const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/987b4d1bff194359b7801a0f45f99ca3'));
const LpAddr = '0xE41363abB45fFb173ec512CFd0B9A8ac03e05F68';
const LpInstance = new web3.eth.Contract(StakingABI, LpAddr);

// Skip dust distribution to save us some gas.
const epsilon = 1e-9;
const poolBeginBlock = 10669884;

///// config start /////
const lastDistributedBlock = 11498160;  // startBlock = lastDistributedBlock + 1
// Last time BAL was distributed.
const endBlock = 11722990;
// Total number of bal to be distributed.
const balNum = 130.767452073173490844;
///// config end /////

async function analyze_stake_withdraw() {
  console.log(`Pool started from block ${poolBeginBlock}, last distributed to block ${lastDistributedBlock},` +
    ` now analyzing BAL distribution data from block ${lastDistributedBlock} to block ${endBlock}...\n`);

  const option = {
    fromBlock: poolBeginBlock,
    toBlock: endBlock
  };
  let weight = new Map();
  let totalWeight = 0;

  // Analyze Staked event
  const stakeList = await LpInstance.getPastEvents('Staked', option);
  for (let i = 0; i < stakeList.length; i++) {
    let staker = stakeList[i].returnValues.user;
    let amount = web3.utils.fromWei(stakeList[i].returnValues.amount);
    let blkNum = stakeList[i].blockNumber;
    
    let w = 0;
    if (blkNum <= lastDistributedBlock) {
      w = (endBlock - lastDistributedBlock) * amount;
    } else {
      w = (endBlock - blkNum) * amount;
    }
    totalWeight += w;
    if (weight.has(staker)) {
      weight.set(staker, weight.get(staker) + w);
    } else {
      weight.set(staker, w);
    }
    console.log(`${staker} staked ${amount} LP tokens on block ${blkNum}`);
  }
  
  // Analyze Withdrawn event
  const withdrawList = await LpInstance.getPastEvents('Withdrawn', option);
  for (let i = 0; i < withdrawList.length; i++) {
    let staker = withdrawList[i].returnValues.user;
    let amount = web3.utils.fromWei(withdrawList[i].returnValues.amount);
    let blkNum = withdrawList[i].blockNumber;
    
    let w = 0;
    if (blkNum <= lastDistributedBlock) {
      w = (endBlock - lastDistributedBlock) * amount;
    } else {
      w = (endBlock - blkNum) * amount;
    }
    totalWeight -= w;
    weight.set(staker, weight.get(staker) - w);
    console.log(`${staker} withdrew ${amount} LP tokens on block ${blkNum}`);
  }
  console.log(`totalWeight = ${totalWeight}`);
  console.log('weight = ', weight);

  weight.forEach(function(v, k) {
    let amt = v / totalWeight * balNum;
    if (amt <= epsilon) amt = 0;
    console.log(k, ',', amt)
  })
}

(async () => {
  await analyze_stake_withdraw();
})();
