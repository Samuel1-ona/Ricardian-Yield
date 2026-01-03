// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleDAO
 * @dev Simple multi-sig or voting mechanism for CapEx approvals
 * For hackathon: simplified version with owner-controlled approvals
 * Can be upgraded to full DAO voting later
 */
contract SimpleDAO is Ownable {
    struct Proposal {
        uint256 amount;
        string description;
        bool approved;
        address proposer;
        uint256 timestamp;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    address public cashFlowEngine;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, uint256 amount, string description);
    event ProposalApproved(uint256 indexed proposalId);
    event CashFlowEngineSet(address indexed engine);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Set the CashFlowEngine address (only once)
     */
    function setCashFlowEngine(address _cashFlowEngine) external onlyOwner {
        require(cashFlowEngine == address(0), "SimpleDAO: CashFlowEngine already set");
        require(_cashFlowEngine != address(0), "SimpleDAO: invalid address");
        cashFlowEngine = _cashFlowEngine;
        emit CashFlowEngineSet(_cashFlowEngine);
    }

    /**
     * @dev Create a new CapEx proposal
     * @param amount Amount of CapEx
     * @param description Description of the CapEx
     * @return proposalId The ID of the created proposal
     */
    function createProposal(uint256 amount, string calldata description) external returns (uint256) {
        require(amount > 0, "SimpleDAO: amount must be greater than zero");
        require(bytes(description).length > 0, "SimpleDAO: description cannot be empty");

        uint256 proposalId = proposalCount++;
        proposals[proposalId] = Proposal({
            amount: amount,
            description: description,
            approved: false,
            proposer: msg.sender,
            timestamp: block.timestamp
        });

        emit ProposalCreated(proposalId, msg.sender, amount, description);
        return proposalId;
    }

    /**
     * @dev Approve a CapEx proposal (only owner for simplified version)
     * In production, this would require multi-sig or token-weighted voting
     */
    function approveProposal(uint256 proposalId) external onlyOwner {
        require(proposalId < proposalCount, "SimpleDAO: proposal does not exist");
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.approved, "SimpleDAO: proposal already approved");

        proposal.approved = true;
        emit ProposalApproved(proposalId);
    }

    /**
     * @dev Check if a proposal is approved
     */
    function isProposalApproved(uint256 proposalId) external view returns (bool) {
        require(proposalId < proposalCount, "SimpleDAO: proposal does not exist");
        return proposals[proposalId].approved;
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposalId < proposalCount, "SimpleDAO: proposal does not exist");
        return proposals[proposalId];
    }
}

