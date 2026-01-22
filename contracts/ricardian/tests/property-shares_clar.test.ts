import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

describe("property-shares tests", () => {
  beforeEach(() => {
    // Reset state before each test
  });

  describe("initialize", () => {
    it("should initialize shares for a property successfully", () => {
      const { result } = simnet.callPublicFn(
        "property-shares_clar",
        "initialize",
        [
          Cl.contractPrincipal(deployer, "property-nft_clar"),
          Cl.uint(1), // property-id
          Cl.uint(1000000), // total-supply
          Cl.standardPrincipal(address1) // initial-owner
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail if not called by contract owner", () => {
      const { result } = simnet.callPublicFn(
        "property-shares_clar",
        "initialize",
        [
          Cl.contractPrincipal(deployer, "property-nft_clar"),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.standardPrincipal(address1)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("should fail with zero total supply", () => {
      const { result } = simnet.callPublicFn(
        "property-shares_clar",
        "initialize",
        [
          Cl.contractPrincipal(deployer, "property-nft_clar"),
          Cl.uint(1),
          Cl.uint(0),
          Cl.standardPrincipal(address1)
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(102)); // ERR-INVALID-SUPPLY
    });

    it("should fail if already initialized", () => {
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

      const { result } = simnet.callPublicFn(
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
      expect(result).toBeErr(Cl.uint(101)); // ERR-ALREADY-INITIALIZED
    });

    it("should mint shares to initial owner", () => {
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

      const { result } = simnet.callReadOnlyFn(
        "property-shares_clar",
        "get-balance",
        [Cl.standardPrincipal(address1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(1000000));
    });
  });

  describe("mint", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "property-shares_clar",
        "initialize",
        [
          Cl.contractPrincipal(deployer, "property-nft"),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.standardPrincipal(address1)
        ],
        deployer
      );
    });

    it("should mint additional shares successfully", () => {
      const { result } = simnet.callPublicFn(
        "property-shares_clar",  
        "mint",
        [
          Cl.uint(1), // property-id
          Cl.uint(500000), // amount
          Cl.standardPrincipal(address2) // recipient
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      const { result: balanceResult } = simnet.callReadOnlyFn(
        "property-shares_clar",
        "get-balance",
        [Cl.standardPrincipal(address2)],
        address1
      );
      expect(balanceResult).toBeOk(Cl.uint(500000));
    });

    it("should fail if not called by contract owner", () => {
      const { result } = simnet.callPublicFn(
        "property-shares_clar",
        "mint",
        [Cl.uint(1), Cl.uint(500000), Cl.standardPrincipal(address2)],
        address1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("should fail if property not found", () => {
      const { result } = simnet.callPublicFn(
        "property-shares_clar",
        "mint",
        [Cl.uint(999), Cl.uint(500000), Cl.standardPrincipal(address2)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(103)); // ERR-NOT-FOUND
    });
  });

  describe("transfer", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "property-shares_clar",
        "initialize",
        [
          Cl.contractPrincipal(deployer, "property-nft"),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.standardPrincipal(address1)
        ],
        deployer
      );
    });

    it("should transfer shares successfully", () => {
      const { result } = simnet.callPublicFn(
        "property-shares_clar",
        "transfer",
        [
          Cl.uint(100000), // amount
          Cl.standardPrincipal(address1), // sender
          Cl.standardPrincipal(address2), // recipient
          Cl.none() // memo
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));

      const { result: balance1Result } = simnet.callReadOnlyFn(
        "property-shares_clar",
        "get-balance",
        [Cl.standardPrincipal(address1)],
        address1
      );
      expect(balance1Result).toBeOk(Cl.uint(900000));

      const { result: balance2Result } = simnet.callReadOnlyFn(
        "property-shares_clar",  
        "get-balance",
        [Cl.standardPrincipal(address2)],
        address1
      );
      expect(balance2Result).toBeOk(Cl.uint(100000));
    });

    it("should transfer with memo", () => {
      const { result } = simnet.callPublicFn(
        "property-shares_clar",  
        "transfer",
        [
          Cl.uint(100000),
          Cl.standardPrincipal(address1),
          Cl.standardPrincipal(address2),
          Cl.some(Cl.bufferFromUtf8("transfer memo"))
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail if sender is not tx-sender", () => {
      const { result } = simnet.callPublicFn(
        "property-shares_clar",
        "transfer",
        [
          Cl.uint(100000), 
          Cl.standardPrincipal(address2), 
          Cl.standardPrincipal(address1), 
          Cl.none()
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(109)); // ERR-INVALID-SENDER
    });
  });

  describe("read-only functions", () => {
    beforeEach(() => {
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

    it("should get property shares data", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-shares_clar",
        "get-property-shares-data",
        [Cl.uint(1)],
        address1
      );
      
      expect(result).toBeOk(Cl.some(Cl.tuple({
        "property-nft": Cl.contractPrincipal(deployer, "property-nft_clar"),
        "nft-property-id": Cl.uint(1),
        "total-supply": Cl.uint(1000000),
        "initialized": Cl.bool(true)
      })));
    });

    it("should get total supply by property", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-shares_clar",
        "get-total-supply-by-property",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(1000000));
    });

    it("should get name", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-shares_clar",
        "get-name",
        [],
        address1
      );
      expect(result).toBeOk(Cl.stringAscii("Property Shares"));
    });

    it("should get symbol", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-shares_clar",
        "get-symbol",
        [],
        address1
      );
      expect(result).toBeOk(Cl.stringAscii("PSHARE"));
    });

    it("should get decimals", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-shares_clar",
        "get-decimals",
        [],
        address1
      );
      expect(result).toBeOk(Cl.uint(6));
    });

    it("should get balance", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-shares_clar",
        "get-balance",
        [Cl.standardPrincipal(address1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(1000000));
    });

    it("should get total supply", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-shares_clar",
        "get-total-supply",
        [],
        address1
      );
      expect(result).toBeOk(Cl.uint(1000000));
    });

    it("should return zero balance for address with no shares", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-shares_clar",
        "get-balance",
        [Cl.standardPrincipal(address2)],
        address1
      );
      expect(result).toBeOk(Cl.uint(0));
    });
  });
});