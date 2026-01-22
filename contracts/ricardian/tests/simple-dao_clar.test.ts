import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

describe("simple-dao_clar tests", () => {
  beforeEach(() => {
    // Setup: Mint property NFT and initialize shares
    simnet.callPublicFn(
      "property-nft_clar",
      "mint-property",
      [
        Cl.standardPrincipal(address1),
        Cl.stringAscii("123 Main St, New York, NY"),
        Cl.uint(1000000),
        Cl.uint(5000),
        Cl.stringAscii("https://example.com/metadata/1")
      ],
      deployer
    );

    simnet.callPublicFn(
      "property-shares_clar",
      "initialize",
      [
        Cl.contractPrincipal(deployer, "property-nft_clar"),
        Cl.uint(1),
        Cl.uint(1000000),
        Cl.standardPrincipal(address1)
      ],
      deployer
    );
  });

  describe("create-proposal", () => {
    it("should create a proposal successfully", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [
          Cl.uint(1), // property-id
          Cl.uint(5000), // amount
          Cl.stringAscii("Roof repair") // description
        ],
        address1
      );
      expect(result).toBeOk(Cl.uint(1)); // First proposal has ID 1 (proposals now start at 1)
    });

    it("should fail with invalid property ID", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [
          Cl.uint(0),
          Cl.uint(5000),
          Cl.stringAscii("Repair")
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(108)); // ERR-INVALID-PROPERTY-ID
    });

    it("should fail with zero amount", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [
          Cl.uint(1),
          Cl.uint(0),
          Cl.stringAscii("Repair")
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-AMOUNT
    });

    it("should fail with empty description", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [
          Cl.uint(1),
          Cl.uint(5000),
          Cl.stringAscii("")
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(110)); // ERR-INVALID-DESCRIPTION
    });

    it("should increment proposal ID", () => {
      simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [
          Cl.uint(1),
          Cl.uint(5000),
          Cl.stringAscii("First proposal")
        ],
        address1
      );

      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [
          Cl.uint(1),
          Cl.uint(3000),
          Cl.stringAscii("Second proposal")
        ],
        address1
      );
      expect(result).toBeOk(Cl.uint(2)); // Second proposal has ID 2
    });
  });

  describe("vote-for-proposal", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [
          Cl.uint(1),
          Cl.uint(5000),
          Cl.stringAscii("Roof repair")
        ],
        address1
      );
    });

    it("should vote for proposal successfully", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [
          Cl.uint(1), // property-id
          Cl.uint(1) // proposal-id (proposals start at 1)
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail with invalid property ID", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [
          Cl.uint(0),
          Cl.uint(1)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(108)); // ERR-INVALID-PROPERTY-ID
    });

    it("should fail with invalid proposal ID", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [
          Cl.uint(1),
          Cl.uint(0) // proposal-id must be > 0
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(109)); // ERR-INVALID-PROPOSAL-ID
    });

    it("should fail if voter has no shares", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address2 // address2 has no shares
      );
      expect(result).toBeErr(Cl.uint(103)); // ERR-NO-SHARES
    });

    it("should fail if already voted", () => {
      simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address1
      );

      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(104)); // ERR-ALREADY-VOTED
    });

    it("should fail if proposal already approved", () => {
      simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address1
      );

      simnet.callPublicFn(
        "simple-dao_clar",
        "finalize-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        deployer
      );

      // Give address2 some shares so they can try to vote
      simnet.callPublicFn(
        "property-shares_clar",
        "mint",
        [
          Cl.uint(1),
          Cl.uint(100000),
          Cl.standardPrincipal(address2)
        ],
        deployer
      );

      // Try to vote on an already approved proposal (should fail because approved)
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address2 // address2 hasn't voted yet, but proposal is approved
      );
      expect(result).toBeErr(Cl.uint(105)); // ERR-ALREADY-APPROVED
    });

    it("should fail if proposal not found", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [
          Cl.uint(1),
          Cl.uint(999)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(106)); // ERR-PROPOSAL-NOT-FOUND
    });
  });

  describe("vote-against-proposal", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [
          Cl.uint(1),
          Cl.uint(5000),
          Cl.stringAscii("Roof repair")
        ],
        address1
      );
    });

    it("should vote against proposal successfully", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "vote-against-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail with same validations as vote-for-proposal", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "vote-against-proposal",
        [
          Cl.uint(0),
          Cl.uint(1)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(108)); // ERR-INVALID-PROPERTY-ID
    });
  });

  describe("finalize-proposal", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [
          Cl.uint(1),
          Cl.uint(5000),
          Cl.stringAscii("Roof repair")
        ],
        address1
      );
      simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address1
      );
    });

    it("should finalize proposal successfully", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "finalize-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail if not called by owner", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "finalize-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("should fail with invalid property ID", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "finalize-proposal",
        [
          Cl.uint(0),
          Cl.uint(1)
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(108)); // ERR-INVALID-PROPERTY-ID
    });

    it("should fail with invalid proposal ID", () => {
      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "finalize-proposal",
        [
          Cl.uint(1),
          Cl.uint(0) // proposal-id must be > 0
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(109)); // ERR-INVALID-PROPOSAL-ID
    });

    it("should fail if already approved", () => {
      simnet.callPublicFn(
        "simple-dao_clar",
        "finalize-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "finalize-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(105)); // ERR-ALREADY-APPROVED
    });

    it("should fail if insufficient votes", () => {
      // Create proposal but don't vote
      simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [
          Cl.uint(1),
          Cl.uint(3000),
          Cl.stringAscii("Window replacement")
        ],
        address1
      );

      const { result } = simnet.callPublicFn(
        "simple-dao_clar",
        "finalize-proposal",
        [
          Cl.uint(1),
          Cl.uint(2) // Second proposal (ID 2)
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(107)); // ERR-INSUFFICIENT-VOTES
    });
  });

  describe("read-only functions", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [
          Cl.uint(1),
          Cl.uint(5000),
          Cl.stringAscii("Roof repair")
        ],
        address1
      );
    });

    it("should check if proposal is approved", () => {
      const { result } = simnet.callReadOnlyFn(
        "simple-dao_clar",
        "is-proposal-approved",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(false));
    });

    it("should get proposal details", () => {
      const { result } = simnet.callReadOnlyFn(
        "simple-dao_clar",
        "get-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address1
      );
      expect(result).toBeOk(Cl.some(Cl.tuple({
        amount: Cl.uint(5000),
        description: Cl.stringAscii("Roof repair"),
        approved: Cl.bool(false),
        proposer: Cl.standardPrincipal(address1),
        "votes-for": Cl.uint(0),
        "votes-against": Cl.uint(0)
      })));
    });

    it("should get proposal votes", () => {
      simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address1
      );

      const { result } = simnet.callReadOnlyFn(
        "simple-dao_clar",
        "get-proposal-votes",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address1
      );
      expect(result).toBeOk(Cl.tuple({
        "votes-for": Cl.uint(1000000), // address1 has 1000000 shares
        "votes-against": Cl.uint(0),
        approved: Cl.bool(false)
      }));
    });

    it("should check if user has voted", () => {
      simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [
          Cl.uint(1),
          Cl.uint(1)
        ],
        address1
      );

      const { result } = simnet.callReadOnlyFn(
        "simple-dao_clar",
        "has-voted",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.standardPrincipal(address1)
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should get proposal count", () => {
      const { result } = simnet.callReadOnlyFn(
        "simple-dao_clar",
        "get-proposal-count",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(1));
    });
  });
});
