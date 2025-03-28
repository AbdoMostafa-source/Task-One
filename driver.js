"use strict";

let blindSignatures = require('blind-signatures');
let SpyAgency = require('./spyAgency.js').SpyAgency;

function makeDocument(coverName) {
  return `The bearer of this signed document, ${coverName}, has full diplomatic immunity.`;
}

function blind(msg, n, e) {
  return blindSignatures.blind({
    message: msg,
    N: n,
    E: e,
  });
}

function unblind(blindingFactor, sig, n) {
  return blindSignatures.unblind({
    signed: sig,
    N: n,
    r: blindingFactor,
  });
}

let agency = new SpyAgency();

// Prepare 10 documents with 10 different cover identities.
let coverNames = [
  "Agent X", "Agent Y", "Agent Z", "Agent A", "Agent B", 
  "Agent C", "Agent D", "Agent E", "Agent F", "Agent G"
];
let documents = coverNames.map(makeDocument);

// Blind each of the 10 documents and store their blinding factors.
let blindDocs = [];
let blindingFactors = [];

documents.forEach((doc) => {
  let { blinded, r } = blind(doc, agency.n, agency.e);
  blindDocs.push(blinded);
  blindingFactors.push(r);
});

agency.signDocument(blindDocs, (selected, verifyAndSign) => {
  // Prepare arrays for the verification step
  let filteredBlindingFactors = blindingFactors.map((r, i) => (i === selected ? undefined : r));
  let filteredOriginalDocs = documents.map((doc, i) => (i === selected ? undefined : doc));

  // Verify and sign the documents
  let signedBlindedSignature = verifyAndSign(filteredBlindingFactors, filteredOriginalDocs);

  // Unblind the signed document
  let finalSignature = unblind(blindingFactors[selected], signedBlindedSignature, agency.n);

  console.log(`Original Document: ${documents[selected]}`);
  console.log(`Unblinded Signature: ${finalSignature}`);
});
