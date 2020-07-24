const StakingABI = require('./StakingABI.json');
const Web3 = require('web3');
const assert = require('assert');
const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/987b4d1bff194359b7801a0f45f99ca3'));
const StakingAddr = '0x6D6E2E36367B7175aCaCb75b184bB8DbE9aFE863';
const startBlock = 10321611;
const StakingInstance = new web3.eth.Contract(StakingABI, StakingAddr);

async function analyze_delegate() {
  const option = {
    fromBlock: startBlock,
    toBlock: 'latest'
  };
  const eventList = await StakingInstance.getPastEvents('Delegate', option);
  for (let i = 0; i < eventList.length; i++) {
    let delegator = eventList[i].returnValues.from;
    let node = eventList[i].returnValues.to;
    let amount = web3.utils.fromWei(eventList[i].returnValues.amount);
    let rewards = await StakingInstance.methods.getDelegatorRewardTokensRT(delegator, node).call();
    rewards = web3.utils.fromWei(rewards);
    console.log(`[${delegator}] delegated (${amount}) DOS to [${node}], has (${rewards}) DOS reward to claim`);
  }
}

async function analyze_node() {
  const option = {
    fromBlock: startBlock,
    toBlock: 'latest'
  };
  const eventList = await StakingInstance.getPastEvents('NewNode', option);
  for (let i = 0; i < eventList.length; i++) {
    let ownerAddr = eventList[i].returnValues.owner;
    let nodeAddr = eventList[i].returnValues.nodeAddress;
    let amount = web3.utils.fromWei(eventList[i].returnValues.selfStakedAmount);
    let rewards = await StakingInstance.methods.getNodeRewardTokensRT(nodeAddr).call();
    rewards = web3.utils.fromWei(rewards);
    console.log(`[${ownerAddr}] started node [${nodeAddr}] with (${amount}) DOS, has (${rewards}) DOS reward to claim`);
  }
}

async function analyze_withdraw() {
  const option = {
    fromBlock: startBlock,
    toBlock: 'latest'
  };
  const eventList = await StakingInstance.getPastEvents('Withdraw', option);
  for (let i = 0; i < eventList.length; i++) {
    let nodeAddr = eventList[i].returnValues.from;
    let receiver = eventList[i].returnValues.to;
    let isNode = eventList[i].returnValues.nodeRunner;
    let withdrewAmount = web3.utils.fromWei(eventList[i].returnValues.tokenAmount);
    let rewards = 0;
    if (isNode) {
      rewards = await StakingInstance.methods.getNodeRewardTokensRT(nodeAddr).call();
      rewards = web3.utils.fromWei(rewards);
    } else {
      rewards = await StakingInstance.methods.getDelegatorRewardTokensRT(receiver, nodeAddr).call();
      rewards = web3.utils.fromWei(rewards);
    }
    console.log(`[${receiver}] withdrew (${withdrewAmount}) DOS. isNode (${isNode}), still have (${rewards}) DOS reward to claim`);
  }
}

async function analyze_unbond() {
  const option = {
    fromBlock: startBlock,
    toBlock: 'latest'
  };
  const eventList = await StakingInstance.getPastEvents('Unbond', option);
  for (let i = 0; i < eventList.length; i++) {
    let unbondFrom = eventList[i].returnValues.from;
    let nodeAddr = eventList[i].returnValues.to;
    let isNode = eventList[i].returnValues.nodeRunner;
    let amount = web3.utils.fromWei(eventList[i].returnValues.tokenAmount);
    let rewards = 0;
    if (isNode) {
      rewards = await StakingInstance.methods.getNodeRewardTokensRT(nodeAddr).call();
      rewards = web3.utils.fromWei(rewards);
    } else {
      rewards = await StakingInstance.methods.getDelegatorRewardTokensRT(unbondFrom, nodeAddr).call();
      rewards = web3.utils.fromWei(rewards);
    }
    console.log(`[${unbondFrom}] unbonded from node [${nodeAddr}] with (${amount}) DOS, still have (${rewards}) DOS reward`);
  }
}

async function analyze_claim() {
  const option = {
    fromBlock: startBlock,
    toBlock: 'latest'
  };
  const eventList = await StakingInstance.getPastEvents('ClaimReward', option);
  for (let i = 0; i < eventList.length; i++) {
    let receiver = eventList[i].returnValues.to;
    let nodeRunner = eventList[i].returnValues.nodeRunner;
    let amount = web3.utils.fromWei(eventList[i].returnValues.amount);
    console.log(`[${receiver}] nodeRunner (${nodeRunner}) has claimed (${amount}) DOS reward`);
  }
}

(async () => {
  await analyze_node();
  await analyze_delegate();
  await analyze_unbond();
  await analyze_withdraw();
  await analyze_claim(); 
})();
