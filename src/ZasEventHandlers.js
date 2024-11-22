const { Zas } = require("../generated");
const { uidHash, nonceHash } = require('./utils');

const TOTAL_REWARD_ID = "e573a447e86d91ef8e17f49bd1083b9107e32538627e0026ea5e16319702018c";
const totalRewardCount = 16000000;

Zas.Attested.handler(async ({ event, context }) => {
  const chainId = event.chainId;
  const schemaId = event.params.schema.toString().toLowerCase();

  console.log(`attested for ${schemaId} on ${chainId} at blockTimestamp ${event.block.timestamp}`);

  let uid = event.params.uid.toString().toLowerCase();
  uid = uidHash(uid, chainId);

  const recipient = event.params.recipient.toString().toLowerCase();
  const nullifier = event.params.nullifier.toString().toLowerCase();
  const nonce = nonceHash(schemaId, nullifier);

  const attestationEntity = {
    id: uid,
    chainId,
    schemaId,
    nullifier,
    recipient,
    revocationTime: 0,
    reward: 0,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  };

  const schemaEntity = await context.ZSchema.get(schemaId);
  let reward = schemaEntity.reward;

  let totalRewardEntity = await context.TotalReward.get(TOTAL_REWARD_ID)
  if (!totalRewardEntity) {
    totalRewardEntity = {
      id: TOTAL_REWARD_ID,
      reward: totalRewardCount,
    };
  }

  let userRewardEntity = await context.UserReward.get(recipient)
  if (!userRewardEntity) {
    userRewardEntity = {
      id: recipient,
      reward: 0,
      blockTimestamp: 0,
    };
  }

  let nonceEntity = await context.Nonce.get(nonce);
  if (!nonceEntity) {
    nonceEntity = {
      id: nonce,
      revocationTime: 0,
    }
  } else if (nonceEntity.revocationTime > 0) {
    nonceEntity.revocationTime = 0;
  } else {
    reward = 0;
  }

  if (totalRewardEntity.reward <= 0 || totalRewardEntity.reward < schemaEntity.reward) {
    reward = 0;
  }

  totalRewardEntity.reward -= reward;

  userRewardEntity.reward += reward;
  userRewardEntity.blockTimestamp = event.block.timestamp;

  attestationEntity.reward = reward;

  context.Attestation.set(attestationEntity);
  context.Nonce.set(nonceEntity);
  context.TotalReward.set(totalRewardEntity);
  context.UserReward.set(userRewardEntity);
});


Zas.Revoked.handler(async ({ event, context }) => {
  const chainId = event.chainId;
  const schemaId = event.params.schema.toString().toLowerCase();

  console.log(`revoked for ${schemaId} on ${chainId} at blockTimestamp ${event.block.timestamp}`);

  let uid = event.params.uid.toString().toLowerCase();
  uid = uidHash(uid, chainId);

  const recipient = event.params.recipient.toString().toLowerCase();
  const nullifier = event.params.nullifier.toString().toLowerCase();
  const nonce = nonceHash(schemaId, nullifier);

  let attestationEntity = await context.Attestation.get(uid);

  if (attestationEntity) {
    const reward = attestationEntity.reward;

    attestationEntity.revocationTime = event.block.timestamp;
    attestationEntity.reward = 0;

    context.Attestation.set(attestationEntity);

    const nonceEntity = await context.Nonce.get(nonce);
    nonceEntity.revocationTime = event.block.timestamp;

    context.Nonce.set(nonceEntity);

    const userRewardEntity = await context.UserReward.get(recipient);
    userRewardEntity.reward -= reward;

    context.UserReward.set(userRewardEntity);

    const totalRewardEntity = await context.TotalReward.get(TOTAL_REWARD_ID);
    totalRewardEntity.reward += reward;

    context.TotalReward.set(totalRewardEntity);
  }
});
