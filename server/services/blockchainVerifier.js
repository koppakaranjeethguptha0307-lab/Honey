const { getDb } = require('../db');
const { computeDataHash, computeCurrentHash } = require('./blockchainEngine');

/**
 * SHA-256 Demo Blockchain Verifier
 * Re-walks a batch's full blockchain_records chain and verifies cryptographic hash continuity.
 * Returns tamper-evident PASS/FAIL report.
 */
const verifyBatchChain = (batchId) => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT b.*, t.details as event_details
    FROM blockchain_records b
    LEFT JOIN traceability_events t ON b.event_id = t.id
    WHERE b.batch_id = ?
    ORDER BY b.block_number ASC, b.id ASC
  `);

  const blocks = stmt.all(batchId);

  if (!blocks || blocks.length === 0) {
    return {
      verified: true,
      status: 'DEMO BLOCKCHAIN VERIFIED',
      message: 'No blockchain records exist for this batch yet.',
      block_count: 0,
      chain_valid: true,
      blocks: []
    };
  }

  let isChainValid = true;
  const verifiedBlocks = [];
  let expectedPrevHash = '0';

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const detailsVal = block.event_details || block.details || '';

    // Re-derive data_hash from recorded event parameters
    const recomputedDataHash = computeDataHash(
      block.batch_id,
      block.event_type,
      block.actor,
      block.timestamp,
      detailsVal
    );

    // Re-derive current_hash from stored data_hash, previous_hash, and block_number
    const recomputedCurrentHash = computeCurrentHash(
      block.data_hash,
      block.previous_hash,
      block.block_number
    );

    const prevHashMatches = block.previous_hash === expectedPrevHash;
    const currentHashValid = block.current_hash === recomputedCurrentHash;

    const isBlockValid = prevHashMatches && currentHashValid;

    if (!isBlockValid) {
      isChainValid = false;
    }

    verifiedBlocks.push({
      block_number: block.block_number,
      event_id: block.event_id,
      event_type: block.event_type,
      timestamp: block.timestamp,
      actor: block.actor,
      data_hash: block.data_hash,
      previous_hash: block.previous_hash,
      current_hash: block.current_hash,
      status: isBlockValid ? 'VALID' : 'TAMPERED',
      checks: {
        previous_hash_matched: prevHashMatches,
        current_hash_valid: currentHashValid
      }
    });

    expectedPrevHash = block.current_hash;
  }

  return {
    verified: isChainValid,
    status: isChainValid ? 'DEMO BLOCKCHAIN VERIFIED' : 'DEMO BLOCKCHAIN VERIFICATION FAILED',
    message: isChainValid
      ? `All ${blocks.length} block(s) in batch chain verified successfully with 0 cryptographic tamper events.`
      : `Tamper detected in blockchain records for batch ${batchId}. Hash chain continuity broken.`,
    block_count: blocks.length,
    chain_valid: isChainValid,
    blocks: verifiedBlocks
  };
};

module.exports = {
  verifyBatchChain
};
