"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const viem_1 = require("viem");
const emailAddress = [
    "airdrophunter1@gmail.com",
    "airdrophunter2@gmail.com",
    "airdrophunter3@gmail.com",
];
/**
 * Preferred way of going from plaintext to hashed data for merkle leaves
 *
 * @param data Data to be hashed
 * @returns data in hashed format
 */
const dataToHash = (data) => {
    return (0, viem_1.keccak256)((0, viem_1.toHex)(data, { size: 32 }));
};
/**
 * Takes in array of plaintext data and constructs the base layer of the merkle tree.
 *
 * @param nonHashLeaves array of data
 * @returns array of merkle leaves that form the base layer of the merkle tree
 */
const prepareBaseLayer = (nonHashLeaves) => {
    let hashedLeaves = [];
    for (let i = 0; i < nonHashLeaves.length; i++) {
        hashedLeaves.push(dataToHash(nonHashLeaves[i]));
    }
    return hashedLeaves;
};
/**
 * Preferred way of handling empty branch in a merkle tree
 * Append a node with 0x as data
 * Other strategy could be duplicating the adjacent node
 *
 * @param layer
 * @returns array with even length consisting of merkle leaves
 */
const handleEmptyBranch = (layer) => {
    if (layer.length % 2)
        layer.push(dataToHash("0x"));
    return layer;
};
/**
 * Preferred way of calculating the parent merkle node
 *
 * @param a one of the merkle node
 * @param b other merkle node to be hashed with a
 * @returns parent merkle node
 */
const pairHash = (a, b) => {
    /**
     * Lexicographical sorting helps with the ordering of the nodes
     * During verification if sorting is not done then the information about the order
     * whether the given node is a left or right node has to be also provided.
     */
    const left = a > b ? b : a;
    const right = left == a ? b : a;
    return (0, viem_1.keccak256)((0, viem_1.encodeAbiParameters)([
        { name: "left", type: "bytes32" },
        { name: "right", type: "bytes32" },
    ], [left, right]));
};
/**
 * Takes a layer of merkle nodes as input, constructs a merkle tree and outputs the root of the tree
 *
 * @param layer layer of nodes for which the parent layer is to be calculated
 * @returns merkle root of the tree from the given layer
 */
const calculateMerkleRootFromLayer = (layer) => {
    if (layer.length === 1) {
        return layer[0];
    }
    const validLayer = handleEmptyBranch(layer);
    const parentLayer = [];
    for (let i = 0; i < validLayer.length; i += 2) {
        let left = validLayer[i];
        let right = validLayer[i + 1];
        let parent = pairHash(left, right);
        parentLayer.push(parent);
    }
    return calculateMerkleRootFromLayer(parentLayer);
};
/**
 * Given an array of data constructs a merkle tree and outputs the root of the tree
 *
 * @param data array of data for which the merkle root needs to be calculated
 * @returns merkle root of the merkle tree formed using the data provided
 */
const calculateMerkleRootFromData = (data) => {
    const baseLayer = prepareBaseLayer(data);
    const root = calculateMerkleRootFromLayer(baseLayer);
    return root;
};
/**
 * Calculates the merkle root using data and the intermediate proofs as if the data was part of the merkle tree.
 * Once the merkle root is calculated it is matched with the merkle root provided as input.
 * If matched then data is part of the tree
 * If not matched then data is not part of the tree (intermediate proofs have to be provided in the right order)
 *
 * @param data data that needs to be verified if it is part of the merkle tree
 * @param intermediateProofs intermediate merkle nodes which act as adjacent nodes when calculating the parent nodes
 * @param merkleRoot the actual merkle root against which the calculated merkle root will be matched with
 * @returns a boolean indicating whether data is the part of the valid set
 */
const verifyProof = (data, intermediateProofs, merkleRoot) => {
    const dataNode = dataToHash(data);
    let nextNode = dataNode;
    for (let i = 0; i < intermediateProofs.length; i++) {
        nextNode = pairHash(nextNode, intermediateProofs[i]);
    }
    return nextNode === merkleRoot;
};
function main() {
    // Merkle root for the data.
    console.log(calculateMerkleRootFromData(emailAddress));
    // Merkle root verification for valid data;
    // Calculating merkle root for adjacent data in the base layer
    const merkleNode = dataToHash("airdrophunter1@gmail.com");
    console.log(verifyProof("airdrophunter2@gmail.com", [
        merkleNode,
        // I console logged the intermediate nodes and put them here.
        "0xbb6fbadeae6523789e06658ab747efe2b59d01e5b281cd709aa49cd10a4323c4",
    ], "0x2c2f3c0b4bd0618ef3b40c5c787e594e2c662fdcde94053f86d8d32c3bf78d6e"));
    // Example for verification returning false for data that is not part of the set.
    // console.log(
    //     verifyProof(
    //         "airdrophunter4@gmail.com",
    //         [
    //             merkleNode,
    //             // I console logged the intermediate nodes and put them here.
    //             "0xbb6fbadeae6523789e06658ab747efe2b59d01e5b281cd709aa49cd10a4323c4",
    //         ],
    //         "0x2c2f3c0b4bd0618ef3b40c5c787e594e2c662fdcde94053f86d8d32c3bf78d6e"
    //     )
    // );
}
main();
