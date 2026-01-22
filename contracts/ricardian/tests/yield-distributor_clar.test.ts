import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

describe("yield-distributor_clar tests", () => {
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

  describe("distribute-yield", () => {
    it("should fail if not called by property owner", () => {
      const { result } = simnet.callPublicFn(
        "yield-distributor_clar",
        "distribute-yield",
        [Cl.uint(1)],
        address2
      );
      expect(result).toBeErr(Cl.uint(111)); // ERR-NOT-PROPERTY-OWNER
    });

    it("should fail with invalid property ID", () => {
      const { result } = simnet.callPublicFn(
        "yield-distributor_clar",
        "distribute-yield",
        [Cl.uint(0)],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-PROPERTY-ID
    });

    it("should fail if no distributable cash flow", () => {
      // Without rent deposits and proper setup, this should fail
      const { result } = simnet.callPublicFn(
        "yield-distributor_clar",
        "distribute-yield",
        [Cl.uint(1)],
        address1
      );
      // Should fail with ERR-NO-DISTRIBUTABLE
      expect(result).toBeErr(Cl.uint(103)); // ERR-NO-DISTRIBUTABLE
    });
  });

  describe("claim-yield", () => {
    it("should fail with invalid property ID", () => {
      const { result } = simnet.callPublicFn(
        "yield-distributor_clar",
        "claim-yield",
        [
          Cl.uint(0), // property-id
          Cl.uint(0) // period
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-PROPERTY-ID
    });

    it("should fail if distribution not found", () => {
      const { result } = simnet.callPublicFn(
        "yield-distributor_clar",
        "claim-yield",
        [
          Cl.uint(1),
          Cl.uint(0)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(110)); // ERR-DISTRIBUTION-NOT-FOUND
    });
  });

  describe("get-claimable-yield", () => {
    it("should fail with invalid property ID", () => {
      const { result } = simnet.callPublicFn(
        "yield-distributor_clar",
        "get-claimable-yield",
        [
          Cl.uint(0),
          Cl.uint(0),
          Cl.standardPrincipal(address1)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-PROPERTY-ID
    });

    it("should return zero if no distribution", () => {
      const { result } = simnet.callPublicFn(
        "yield-distributor_clar",
        "get-claimable-yield",
        [
          Cl.uint(1),
          Cl.uint(0),
          Cl.standardPrincipal(address1)
        ],
        address1
      );
      expect(result).toBeOk(Cl.uint(0));
    });

    it("should fail with invalid user", () => {
      const { result } = simnet.callPublicFn(
        "yield-distributor_clar",
        "get-claimable-yield",
        [
          Cl.uint(1),
          Cl.uint(0),
          Cl.contractPrincipal(deployer, "yield-distributor_clar")
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(105)); // ERR-INVALID-USER
    });
  });

  describe("read-only functions", () => {
    it("should get distribution (returns none if not found)", () => {
      const { result } = simnet.callReadOnlyFn(
        "yield-distributor_clar",
        "get-distribution",
        [
          Cl.uint(1),
          Cl.uint(0)
        ],
        address1
      );
      expect(result).toBeOk(Cl.none());
    });

    it("should fail with invalid property ID", () => {
      const { result } = simnet.callReadOnlyFn(
        "yield-distributor_clar",
        "get-distribution",
        [
          Cl.uint(0),
          Cl.uint(0)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-PROPERTY-ID
    });

    it("should check if user has claimed", () => {
      const { result } = simnet.callReadOnlyFn(
        "yield-distributor_clar",
        "has-claimed",
        [
          Cl.uint(1),
          Cl.uint(0),
          Cl.standardPrincipal(address1)
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(false));
    });

    it("should fail with invalid property ID for has-claimed", () => {
      const { result } = simnet.callReadOnlyFn(
        "yield-distributor_clar",
        "has-claimed",
        [
          Cl.uint(0),
          Cl.uint(0),
          Cl.standardPrincipal(address1)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-PROPERTY-ID
    });

    it("should get claimed amount", () => {
      const { result } = simnet.callReadOnlyFn(
        "yield-distributor_clar",
        "get-claimed-amount",
        [
          Cl.uint(1),
          Cl.uint(0),
          Cl.standardPrincipal(address1)
        ],
        address1
      );
      expect(result).toBeOk(Cl.uint(0));
    });

    it("should get current period", () => {
      const { result } = simnet.callReadOnlyFn(
        "yield-distributor_clar",
        "get-current-period",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(0));
    });

    it("should fail with invalid property ID for get-current-period", () => {
      const { result } = simnet.callReadOnlyFn(
        "yield-distributor_clar",
        "get-current-period",
        [Cl.uint(0)],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-PROPERTY-ID
    });
  });

  describe("reset-distribution-period", () => {
    it("should reset distribution period successfully", () => {
      const { result } = simnet.callPublicFn(
        "yield-distributor_clar",
        "reset-distribution-period",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail if not called by property owner", () => {
      const { result } = simnet.callPublicFn(
        "yield-distributor_clar",
        "reset-distribution-period",
        [Cl.uint(1)],
        address2
      );
      expect(result).toBeErr(Cl.uint(111)); // ERR-NOT-PROPERTY-OWNER
    });

    it("should fail with invalid property ID", () => {
      const { result } = simnet.callPublicFn(
        "yield-distributor_clar",
        "reset-distribution-period",
        [Cl.uint(0)],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-PROPERTY-ID
    });

    it("should increment period", () => {
      simnet.callPublicFn(
        "yield-distributor_clar",
        "reset-distribution-period",
        [Cl.uint(1)],
        address1
      );

      const { result } = simnet.callReadOnlyFn(
        "yield-distributor_clar",
        "get-current-period",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(1));
    });
  });
});
