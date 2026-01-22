import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

describe("cash-flow-engine tests", () => {
  beforeEach(() => {
    // Setup: Mint a property NFT owned by address1
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
  });

  describe("record-operating-expense", () => {
    it("should record operating expense successfully", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "record-operating-expense",
        [
          Cl.uint(1), // property-id
          Cl.uint(1000) // amount
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail with zero amount", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "record-operating-expense",
        [Cl.uint(1), Cl.uint(0)],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-AMOUNT
    });

    it("should fail if caller is not property owner", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "record-operating-expense",
        [Cl.uint(1), Cl.uint(1000)],
        address2
      );
      expect(result).toBeErr(Cl.uint(103)); // ERR-NOT-PROPERTY-OWNER
    });

    it("should accumulate operating expenses", () => {
      simnet.callPublicFn(
        "cash-flow-engine_clar",
        "record-operating-expense",
        [Cl.uint(1), Cl.uint(1000)],
        address1
      );

      simnet.callPublicFn(
        "cash-flow-engine_clar",
        "record-operating-expense",
        [Cl.uint(1), Cl.uint(500)],
        address1
      );

      const { result } = simnet.callReadOnlyFn(
        "cash-flow-engine_clar",
        "get-operating-expenses",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(1500));
    });
  });

  describe("record-capex", () => {
    beforeEach(() => {
      // Create and approve a proposal
      simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [
          Cl.uint(1), // property-id
          Cl.uint(5000), // amount
          Cl.stringAscii("Roof repair")
        ],
        address1
      );

      // Initialize shares for property 1 so we can vote
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

     

      // Vote for proposal
      simnet.callPublicFn(
        "simple-dao_clar",
        "vote-for-proposal",
        [Cl.uint(1), Cl.uint(1)],
        address1
      );

      // Finalize proposal
      simnet.callPublicFn(
        "simple-dao_clar",
        "finalize-proposal",
        [Cl.uint(1), Cl.uint(1)],
        deployer
      );
    });

    it("should record CapEx successfully", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "record-capex",
        [
          Cl.uint(1), // property-id
          Cl.uint(5000), // amount
          Cl.uint(1) // proposal-id (proposals now start at 1)
        ],
        address1 // Can be called by any address, but proposal must be approved
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail with zero amount", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "record-capex",
        [Cl.uint(1), Cl.uint(0), Cl.uint(1)], // Use valid proposal-id 1, but zero amount
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-AMOUNT
    });

    it("should fail if proposal not approved", () => {
      // Create a proposal but don't approve it (this will be proposal-id 2)
      simnet.callPublicFn(
        "simple-dao_clar",
        "create-proposal",
        [Cl.uint(1), Cl.uint(3000), Cl.stringAscii("Window replacement")],
        address1
      );

      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "record-capex",
        [Cl.uint(1), Cl.uint(3000), Cl.uint(2)], // Use proposal-id 2 (the newly created, unapproved proposal)
        address1
      );
      expect(result).toBeErr(Cl.uint(106)); // ERR-PROPOSAL-NOT-APPROVED
    });
  });

  describe("allocate-working-capital", () => {
    it("should allocate working capital successfully", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "allocate-working-capital",
        [
          Cl.uint(1), // property-id
          Cl.uint(2000) // amount
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail with zero amount", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "allocate-working-capital",
        [Cl.uint(1), Cl.uint(0)],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-AMOUNT
    });

    it("should fail if caller is not property owner", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "allocate-working-capital",
        [Cl.uint(1), Cl.uint(2000)],
        address2
      );
      expect(result).toBeErr(Cl.uint(103)); // ERR-NOT-PROPERTY-OWNER
    });
  });

  describe("release-working-capital", () => {
    beforeEach(() => {
      // Allocate working capital first
      simnet.callPublicFn(
        "cash-flow-engine_clar",
        "allocate-working-capital",
        [Cl.uint(1), Cl.uint(2000)],
        address1
      );
    });

    it("should release working capital successfully", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "release-working-capital",
        [
          Cl.uint(1), // property-id
          Cl.uint(1000) // amount
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail with zero amount", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "release-working-capital",
        [Cl.uint(1), Cl.uint(0)],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-AMOUNT
    });

    it("should fail if insufficient reserve", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "release-working-capital",
        [Cl.uint(1), Cl.uint(3000)], // More than allocated
        address1
      );
      expect(result).toBeErr(Cl.uint(107)); // ERR-INSUFFICIENT-RESERVE
    });
  });

  describe("get-distributable-cash-flow", () => {
    beforeEach(() => {
      // Record expenses
      simnet.callPublicFn(
        "cash-flow-engine_clar",
        "record-operating-expense",
        [Cl.uint(1), Cl.uint(2000)],
        address1
      );

      // Allocate working capital
      simnet.callPublicFn(
        "cash-flow-engine_clar",
        "allocate-working-capital",
        [Cl.uint(1), Cl.uint(1000)],
        address1
      );
    });

    it("should calculate distributable cash flow", () => {
      // Note: This test requires rent-vault to be working properly
      // For now, we'll test that the function returns without error
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "get-distributable-cash-flow",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(0)); // No rent deposited, so 0
    });
  });

  describe("read-only functions", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "cash-flow-engine_clar",
        "record-operating-expense",
        [Cl.uint(1), Cl.uint(1000)],
        address1
      );
    });

    it("should get operating expenses", () => {
      const { result } = simnet.callReadOnlyFn(
        "cash-flow-engine_clar",
        "get-operating-expenses",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(1000));
    });

    it("should get working capital reserve", () => {
      simnet.callPublicFn(
        "cash-flow-engine_clar",
        "allocate-working-capital",
        [Cl.uint(1), Cl.uint(2000)],
        address1
      );

      const { result } = simnet.callReadOnlyFn(
        "cash-flow-engine_clar",
        "get-working-capital-reserve",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(2000));
    });

    it("should get accounting data", () => {
      const { result } = simnet.callReadOnlyFn(
        "cash-flow-engine_clar",
        "get-accounting-data",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.some(Cl.tuple({
        "operating-expenses": Cl.uint(1000),
        "capex-spent": Cl.uint(0),
        "working-capital-reserve": Cl.uint(0),
        "last-capex-change": Cl.uint(0),
        "last-working-capital-change": Cl.int(0)
      })));
    });
  });

  describe("reset-period", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "cash-flow-engine_clar",
        "record-operating-expense",
        [Cl.uint(1), Cl.uint(1000)],
        address1
      );
    });

    it("should reset period successfully", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "reset-period",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail if not called by owner", () => {
      const { result } = simnet.callPublicFn(
        "cash-flow-engine_clar",
        "reset-period",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });
  });
});