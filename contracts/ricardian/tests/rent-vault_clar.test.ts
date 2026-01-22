import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

describe("rent-vault tests", () => {
  beforeEach(() => {
    // Setup: Mint a property NFT
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

  describe("set-authorized", () => {
    it("should set authorized address successfully", () => {
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "set-authorized",
        [
          Cl.standardPrincipal(address1), 
          Cl.bool(true)
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail if not called by owner", () => {
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "set-authorized",
        [
          Cl.standardPrincipal(address1), 
          Cl.bool(true)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("should revoke authorization", () => {
      // First authorize
      simnet.callPublicFn(
        "rent-vault_clar",
        "set-authorized",
        [Cl.standardPrincipal(address1), Cl.bool(true)],
        deployer
      );

      // Then revoke
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "set-authorized",
        [Cl.standardPrincipal(address1), Cl.bool(false)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("deposit-rent", () => {
    it("should fail with zero amount", () => {
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "deposit-rent",
        [
          Cl.uint(1), 
          Cl.uint(0)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-AMOUNT
    });

    it("should fail with invalid property ID", () => {
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "deposit-rent",
        [
          Cl.uint(0), 
          Cl.uint(1000)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(102)); // ERR-INVALID-PROPERTY-ID
    });

    it("should deposit rent successfully", () => {
      // First, mint USDCx tokens to address1
      simnet.callPublicFn(
        "usdcx",
        "mint",
        [
          Cl.uint(10000), // amount
          Cl.standardPrincipal(address1) // recipient
        ],
        deployer
      );

      // Verify address1 has tokens
      const { result: balanceBefore } = simnet.callReadOnlyFn(
        "usdcx",
        "get-balance",
        [Cl.standardPrincipal(address1)],
        address1
      );
      expect(balanceBefore).toBeOk(Cl.uint(10000));

      // User transfers tokens to rent-vault contract first
      simnet.callPublicFn(
        "usdcx",
        "transfer",
        [
          Cl.uint(5000), // amount
          Cl.standardPrincipal(address1), // sender
          Cl.contractPrincipal(deployer, "rent-vault_clar"), // recipient
          Cl.none() // memo
        ],
        address1
      );

      // Then call deposit-rent to update records
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "deposit-rent",
        [
          Cl.uint(1), // property-id
          Cl.uint(5000) // amount
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));

      // Verify address1 balance decreased
      const { result: balanceAfter } = simnet.callReadOnlyFn(
        "usdcx",
        "get-balance",
        [Cl.standardPrincipal(address1)],
        address1
      );
      expect(balanceAfter).toBeOk(Cl.uint(5000));

      // Verify rent-vault contract has the tokens
      const { result: vaultBalance } = simnet.callReadOnlyFn(
        "usdcx",
        "get-balance",
        [Cl.contractPrincipal(deployer, "rent-vault_clar")],
        address1
      );
      expect(vaultBalance).toBeOk(Cl.uint(5000));

      // Verify property rent data was updated
      const { result: rentData } = simnet.callReadOnlyFn(
        "rent-vault_clar",
        "get-property-rent-data",
        [Cl.uint(1)],
        address1
      );
      expect(rentData).toBeOk(Cl.some(Cl.tuple({
        balance: Cl.uint(5000),
        "rent-collected": Cl.uint(5000),
        "current-period": Cl.uint(0)
      })));

      // Verify balance matches
      const { result: balance } = simnet.callReadOnlyFn(
        "rent-vault_clar",
        "get-balance",
        [Cl.uint(1)],
        address1
      );
      expect(balance).toBeOk(Cl.uint(5000));
    });

    it("should accumulate rent for multiple deposits", () => {
      // Mint USDCx tokens to address1
      simnet.callPublicFn(
        "usdcx",
        "mint",
        [
          Cl.uint(20000),
          Cl.standardPrincipal(address1)
        ],
        deployer
      );

      // First deposit: transfer tokens then record
      simnet.callPublicFn(
        "usdcx",
        "transfer",
        [
          Cl.uint(3000),
          Cl.standardPrincipal(address1),
          Cl.contractPrincipal(deployer, "rent-vault_clar"),
          Cl.none()
        ],
        address1
      );
      simnet.callPublicFn(
        "rent-vault_clar",
        "deposit-rent",
        [
          Cl.uint(1),
          Cl.uint(3000)
        ],
        address1
      );

      // Second deposit: transfer tokens then record
      simnet.callPublicFn(
        "usdcx",
        "transfer",
        [
          Cl.uint(2000),
          Cl.standardPrincipal(address1),
          Cl.contractPrincipal(deployer, "rent-vault_clar"),
          Cl.none()
        ],
        address1
      );
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "deposit-rent",
        [
          Cl.uint(1),
          Cl.uint(2000)
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));

      // Verify accumulated balance
      const { result: balance } = simnet.callReadOnlyFn(
        "rent-vault_clar",
        "get-balance",
        [Cl.uint(1)],
        address1
      );
      expect(balance).toBeOk(Cl.uint(5000)); // 3000 + 2000

      // Verify rent collected
      const { result: rentData } = simnet.callReadOnlyFn(
        "rent-vault_clar",
        "get-property-rent-data",
        [Cl.uint(1)],
        address1
      );
      expect(rentData).toBeOk(Cl.some(Cl.tuple({
        balance: Cl.uint(5000),
        "rent-collected": Cl.uint(5000),
        "current-period": Cl.uint(0)
      })));
    });

    it("should record deposit even if tokens not transferred (user responsibility)", () => {
      // Note: In production, user should transfer tokens first
      // This test documents that deposit-rent will succeed and update records
      // even if tokens weren't transferred (it's the user's responsibility)
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "deposit-rent",
        [
          Cl.uint(1),
          Cl.uint(1000)
        ],
        address1
      );
      // deposit-rent will succeed and update records
      // (In production, ensure tokens are transferred first)
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should track rent per period", () => {
      // Mint USDCx tokens
      simnet.callPublicFn(
        "usdcx",
        "mint",
        [
          Cl.uint(10000),
          Cl.standardPrincipal(address1)
        ],
        deployer
      );

      // Transfer tokens then record deposit
      simnet.callPublicFn(
        "usdcx",
        "transfer",
        [
          Cl.uint(2500),
          Cl.standardPrincipal(address1),
          Cl.contractPrincipal(deployer, "rent-vault_clar"),
          Cl.none()
        ],
        address1
      );
      simnet.callPublicFn(
        "rent-vault_clar",
        "deposit-rent",
        [
          Cl.uint(1),
          Cl.uint(2500)
        ],
        address1
      );

      // Verify rent for period 0
      const { result: periodRent } = simnet.callReadOnlyFn(
        "rent-vault_clar",
        "get-rent-for-period",
        [Cl.uint(1), Cl.uint(0)],
        address1
      );
      expect(periodRent).toBeOk(Cl.uint(2500));
    });
  });

  describe("withdraw", () => {
    beforeEach(() => {
      // Authorize address1
      simnet.callPublicFn(
        "rent-vault_clar",
        "set-authorized",
        [Cl.standardPrincipal(address1), Cl.bool(true)],
        deployer
      );
    });

    it("should fail with zero amount", () => {
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "withdraw",
        [
          Cl.uint(1), 
          Cl.standardPrincipal(address2), 
          Cl.uint(0)
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-AMOUNT
    });

    it("should fail if not authorized or owner", () => {
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "withdraw",
        [
          Cl.uint(1), 
          Cl.standardPrincipal(address2), 
          Cl.uint(1000)
        ],
        address2
      );
      expect(result).toBeErr(Cl.uint(103)); // ERR-NOT-AUTHORIZED-CALLER
    });

    it("should fail if property not found", () => {
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "withdraw",
        [
          Cl.uint(999), 
          Cl.standardPrincipal(address2), 
          Cl.uint(1000)
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(105)); // ERR-PROPERTY-NOT-FOUND
    });
  });

  describe("read-only functions", () => {
    it("should get balance (returns zero for non-existent property)", () => {
      const { result } = simnet.callReadOnlyFn(
        "rent-vault_clar",
        "get-balance",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(0));
    });

    it("should get rent for period", () => {
      const { result } = simnet.callReadOnlyFn(
        "rent-vault_clar",
        "get-rent-for-period",
        [Cl.uint(1), Cl.uint(0)],
        address1
      );
      expect(result).toBeOk(Cl.uint(0));
    });

    it("should get current period", () => {
      const { result } = simnet.callReadOnlyFn(
        "rent-vault_clar",
        "get-current-period",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(0));
    });

    it("should get property rent data", () => {
      const { result } = simnet.callReadOnlyFn(
        "rent-vault_clar",
        "get-property-rent-data",
        [Cl.uint(1)],
        address1
      );
      // Returns none for non-existent property
      expect(result).toBeOk(Cl.none());
    });

    it("should get rent collected", () => {
      const { result } = simnet.callReadOnlyFn(
        "rent-vault_clar",
        "get-rent-collected",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(0));
    });

    it("should get balance for multiple properties", () => {
      // Mint another property
      simnet.callPublicFn(
        "property-nft_clar",
        "mint-property",
        [
          Cl.standardPrincipal(address2),
          Cl.stringAscii("456 Oak Ave, Boston, MA"),
          Cl.uint(2000000),
          Cl.uint(7000),
          Cl.stringAscii("https://example.com/metadata/2")
        ],
        deployer
      );

      const { result: result1 } = simnet.callReadOnlyFn(
        "rent-vault_clar",
        "get-balance",
        [Cl.uint(1)],
        address1
      );
      expect(result1).toBeOk(Cl.uint(0));

      const { result: result2 } = simnet.callReadOnlyFn(
        "rent-vault_clar",
        "get-balance",
        [Cl.uint(2)],
        address1
      );
      expect(result2).toBeOk(Cl.uint(0));
    });
  });

  describe("reset-period", () => {
    it("should fail if not called by owner", () => {
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "reset-period",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("should fail if property not found", () => {
      const { result } = simnet.callPublicFn(
        "rent-vault_clar",
        "reset-period",
        [Cl.uint(999)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(105)); // ERR-PROPERTY-NOT-FOUND
    });
  });

  
});