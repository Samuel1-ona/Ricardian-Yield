// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {SimpleDAO} from "../contracts/SimpleDAO.sol";

contract SimpleDAOTest is Test {
    SimpleDAO public dao;
    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        vm.prank(owner);
        dao = new SimpleDAO(owner);
    }

    function testCreateProposal() public {
        uint256 amount = 5000 * 1e18;
        string memory description = "Property renovation";
        
        uint256 proposalId = dao.createProposal(amount, description);

        assertEq(proposalId, 0);
        SimpleDAO.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.amount, amount);
        assertEq(keccak256(bytes(proposal.description)), keccak256(bytes(description)));
        assertFalse(proposal.approved);
        assertEq(proposal.proposer, address(this));
    }

    function testCreateProposalFailsWithZeroAmount() public {
        vm.expectRevert("SimpleDAO: amount must be greater than zero");
        dao.createProposal(0, "Test");
    }

    function testCreateProposalFailsWithEmptyDescription() public {
        vm.expectRevert("SimpleDAO: description cannot be empty");
        dao.createProposal(1000 * 1e18, "");
    }

    function testApproveProposal() public {
        uint256 amount = 5000 * 1e18;
        uint256 proposalId = dao.createProposal(amount, "Renovation");
        
        vm.prank(owner);
        dao.approveProposal(proposalId);

        assertTrue(dao.isProposalApproved(proposalId));
    }

    function testApproveProposalFailsIfNotOwner() public {
        uint256 proposalId = dao.createProposal(1000 * 1e18, "Test");
        
        vm.prank(user);
        vm.expectRevert();
        dao.approveProposal(proposalId);
    }

    function testApproveProposalFailsIfAlreadyApproved() public {
        uint256 proposalId = dao.createProposal(1000 * 1e18, "Test");
        
        vm.startPrank(owner);
        dao.approveProposal(proposalId);
        vm.expectRevert("SimpleDAO: proposal already approved");
        dao.approveProposal(proposalId);
        vm.stopPrank();
    }

    function testSetCashFlowEngine() public {
        address engine = address(3);
        
        vm.prank(owner);
        dao.setCashFlowEngine(engine);

        assertEq(dao.cashFlowEngine(), engine);
    }

    function testSetCashFlowEngineFailsIfAlreadySet() public {
        address engine1 = address(3);
        address engine2 = address(4);
        
        vm.startPrank(owner);
        dao.setCashFlowEngine(engine1);
        vm.expectRevert("SimpleDAO: CashFlowEngine already set");
        dao.setCashFlowEngine(engine2);
        vm.stopPrank();
    }
}

