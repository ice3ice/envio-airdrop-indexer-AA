const ethers = require("ethers");

const { Schema, Zas } = require("../generated/src/TestHelpers.bs.js");

const TOTAL_REWARD_ID = "e573a447e86d91ef8e17f49bd1083b9107e32538627e0026ea5e16319702018c";
const TOTAL_REWARD = 16000000;

const blockInfo = {
  block: {
    number: 0,
    timestamp: 0,
    hash: "0x0000000000000000000000000000000000000000000000000000000000000000"
  },
  transaction: {
    index: 0,
    hash: "0x0000000000000000000000000000000000000000000000000000000000000000"
  },
}

const schemaRegisterAddress = "0x29f15c2bb9298a534d257d04ec70124b9d074113";
const notaryAddress = "0x9D8A6eBaD8b76c6E25a00ab02EC685529Ee3e30e";
const allocatorAddress = "0x19a567b3b212a5b35bA0E3B600FbEd5c2eE9083d";

const nextBlock = () => {
  blockInfo.block.number += 1;
  blockInfo.block.timestamp += 1;

  let blockHash = parseInt(blockInfo.block.hash, 16);
  blockHash += 1
  blockHash = blockHash.toString(16).padStart(64, 0);
  blockInfo.block.hash = blockHash;

  let transactionHash = parseInt(blockInfo.transaction.hash, 16);
  transactionHash += 1
  transactionHash = transactionHash.toString(16).padStart(64, 0);
  blockInfo.transaction.hash = transactionHash;

  blockInfo.transaction.index += 1;

  return blockInfo.block.timestamp;
}

const createSchemaRegisteredEvent = (chainId, uid, schemaURI, schemaData) => {
  const mockSchemaRegisteredEvent = Schema.SchemaRegistered.createMockEvent({
    uid,
    registerer: schemaRegisterAddress,
    schemaURI,
    schemaData,
    revocable: true,
    mockEventData: {
      chainId,
      srcAddress: schemaRegisterAddress,
      logIndex: 0,
      block: blockInfo.block,
      transaction: blockInfo.transaction,
    },
  });

  return mockSchemaRegisteredEvent;
}

const createMockZasAttestedEvent = (chainId, recipient, uid, schema, nullifier) => {
  const mockZasAttestedEvent = Zas.Attested.createMockEvent({
    recipient,
    notary: notaryAddress,
    allocator: allocatorAddress,
    uid,
    schema,
    nullifier,
    mockEventData: {
      chainId,
      srcAddress: recipient,
      logIndex: 0,
      block: blockInfo.block,
      transaction: blockInfo.transaction,
    },
  });

  return mockZasAttestedEvent;
}

const createMockZasRevokedEvent = (chainId, recipient, uid, schema, nullifier) => {
  const mockZasRevokedEvent = Zas.Revoked.createMockEvent({
    recipient,
    revoker: recipient,
    uid,
    schema,
    nullifier,
    mockEventData: {
      chainId,
      srcAddress: recipient,
      logIndex: 0,
      block: blockInfo.block,
      transaction: blockInfo.transaction,
    },
  });

  return mockZasRevokedEvent;
}

const uidHash = (uid, chainId) => {
  uid = uid.split("0x")[1];
  chainId = chainId.toString();

  uid = ethers.keccak256(Buffer.from(uid + chainId, "utf-8"));

  return "0x" + uid;
}

const nonceHash = (schemaId, nullifier) => {
  schemaId = schemaId.split("0x")[1];
  nullifier = nullifier.split("0x")[1];

  const nonce = ethers.keccak256(Buffer.from(schemaId + nullifier, "utf-8"));

  return "0x" + nonce;
}

module.exports = {
  TOTAL_REWARD_ID,
  TOTAL_REWARD,
  nextBlock,
  createSchemaRegisteredEvent,
  createMockZasAttestedEvent,
  createMockZasRevokedEvent,
  uidHash,
  nonceHash,
};
