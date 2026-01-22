import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

describe("property-nft tests", () => {
  beforeEach(() => {
    // Reset state before each test
  });

  describe("mint-property", () => {
    it("should mint a property NFT successfully", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",
        "mint-property",
        [
          Cl.standardPrincipal(address1),
          Cl.stringAscii("123 Main St, New York, NY"),
          Cl.uint(1000000), // valuation
          Cl.uint(5000), // monthly rent
          Cl.stringAscii("https://example.com/metadata/1")
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("should fail if not called by contract owner", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",            
        "mint-property",
        [
          Cl.standardPrincipal(address1),
          Cl.stringAscii("123 Main St, New York, NY"),
          Cl.uint(1000000),
          Cl.uint(5000),
          Cl.stringAscii("https://example.com/metadata/1")
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("should fail with invalid owner (contract itself)", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",
        "mint-property",
        [
          Cl.contractPrincipal(deployer, "property-nft_clar"),
          Cl.stringAscii("123 Main St, New York, NY"),
          Cl.uint(1000000),
          Cl.uint(5000),
          Cl.stringAscii("https://example.com/metadata/1")
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(104)); // ERR-INVALID-OWNER
    });

    it("should fail with empty location", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",   
        "mint-property",
        [
          Cl.standardPrincipal(address1),
          Cl.stringAscii(""),
          Cl.uint(1000000),
          Cl.uint(5000),
          Cl.stringAscii("https://example.com/metadata/1")
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(105)); // ERR-INVALID-LOCATION
    });

    it("should fail with zero valuation", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",   
        "mint-property",
        [
          Cl.standardPrincipal(address1),
          Cl.stringAscii("123 Main St, New York, NY"),
          Cl.uint(0),
          Cl.uint(5000),
          Cl.stringAscii("https://example.com/metadata/1")
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(106)); // ERR-INVALID-VALUATION
    });

    it("should fail with zero monthly rent", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",   
        "mint-property",
        [
          Cl.standardPrincipal(address1),
          Cl.stringAscii("123 Main St, New York, NY"),
          Cl.uint(1000000),
          Cl.uint(0),
          Cl.stringAscii("https://example.com/metadata/1")
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(107)); // ERR-INVALID-RENT
    });

    it("should fail with empty metadata URI", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",   
        "mint-property",
        [
          Cl.standardPrincipal(address1),
          Cl.stringAscii("123 Main St, New York, NY"),
          Cl.uint(1000000),
          Cl.uint(5000),
          Cl.stringAscii("")
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(108)); // ERR-INVALID-METADATA-URI
    });

    it("should increment property ID and total supply", () => {
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

      const { result: supplyResult } = simnet.callReadOnlyFn(
        "property-nft_clar",    
        "get-total-supply",
        [],
        address1
      );
      expect(supplyResult).toBeOk(Cl.uint(1));

      const { result: lastIdResult } = simnet.callReadOnlyFn(
        "property-nft_clar",    
        "get-last-token-id",
        [],
        address1
      );
      expect(lastIdResult).toBeOk(Cl.uint(1)); // Last minted ID is 1 (property ID 1, last-token-id returns next-id - 1 = 2 - 1 = 1)
    });
  });

  describe("transfer", () => {
    beforeEach(() => {
      // Mint a property for testing
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

    it("should transfer property NFT successfully", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",    
        "transfer",
        [
          Cl.uint(1),
          Cl.standardPrincipal(address1),
          Cl.standardPrincipal(address2)
        ],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));

      const { result: ownerResult } = simnet.callReadOnlyFn(
        "property-nft_clar",    
        "get-owner",
        [Cl.uint(1)],
        address1
      );
      expect(ownerResult).toBeOk(Cl.some(Cl.standardPrincipal(address2)));
    });

    it("should fail with invalid token ID", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",    
        "transfer",
        [
          Cl.uint(0),
          Cl.standardPrincipal(address1),
          Cl.standardPrincipal(address2)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-PROPERTY-ID
    });

    it("should fail if sender is not tx-sender", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",    
        "transfer",
        [
          Cl.uint(1),
          Cl.standardPrincipal(address2),
          Cl.standardPrincipal(address1)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("should fail with invalid recipient (contract itself)", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",    
        "transfer",
        [
          Cl.uint(1),
          Cl.standardPrincipal(address1),
          Cl.contractPrincipal(deployer, "property-nft_clar")
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(109)); // ERR-INVALID-RECIPIENT
    });

    it("should fail if sender equals recipient", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",    
        "transfer",
        [
          Cl.uint(1),
          Cl.standardPrincipal(address1),
          Cl.standardPrincipal(address1)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(109)); // ERR-INVALID-RECIPIENT
    });

    it("should fail if property does not exist", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",    
        "transfer",
        [
          Cl.uint(999),
          Cl.standardPrincipal(address1),
          Cl.standardPrincipal(address2)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(110)); // ERR-PROPERTY-NOT-EXISTS
    });

    it("should fail if sender is not token owner", () => {
      const { result } = simnet.callPublicFn(
        "property-nft_clar",    
        "transfer",
        [
          Cl.uint(1),
          Cl.standardPrincipal(address2),
          Cl.standardPrincipal(address1)
        ],
        address2
      );
      expect(result).toBeErr(Cl.uint(111)); // ERR-NOT-TOKEN-OWNER
    });

    it("should update owner in property data after transfer", () => {
      simnet.callPublicFn(
        "property-nft_clar",    
        "transfer",
        [
          Cl.uint(1),
          Cl.standardPrincipal(address1),
          Cl.standardPrincipal(address2)
        ],
        address1
      );

      const { result } = simnet.callReadOnlyFn(
        "property-nft_clar",      
        "get-property-data",
        [Cl.uint(1)],
        address1
      );
      
      // Extract the data from the response (result is Response wrapping Optional)
      expect(result).toBeOk(Cl.some(Cl.tuple({
        owner: Cl.standardPrincipal(address2),
        location: Cl.stringAscii("123 Main St, New York, NY"),
        valuation: Cl.uint(1000000),
        "monthly-rent": Cl.uint(5000),
        "metadata-uri": Cl.stringAscii("https://example.com/metadata/1")
      })));
    });
  });

  describe("read-only functions", () => {
    beforeEach(() => {
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

    it("should get property data", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-nft_clar",        
        "get-property-data",
        [Cl.uint(1)],
        address1
      );
      
      expect(result).toBeOk(Cl.some(Cl.tuple({
        owner: Cl.standardPrincipal(address1),
        location: Cl.stringAscii("123 Main St, New York, NY"),
        valuation: Cl.uint(1000000),
        "monthly-rent": Cl.uint(5000),
        "metadata-uri": Cl.stringAscii("https://example.com/metadata/1")
      })));
    });

    it("should get token URI", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-nft_clar",      
        "get-token-uri",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.some(Cl.stringAscii("https://example.com/metadata/1")));
    });

    it("should return error for non-existent token URI", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-nft_clar",      
        "get-token-uri",
        [Cl.uint(999)],
        address1
      );
      expect(result).toBeErr(Cl.uint(102)); // ERR-NOT-FOUND
    });

    it("should get property location", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-nft_clar",      
        "get-property-location",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.stringAscii("123 Main St, New York, NY"));
    });

    it("should get property valuation", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-nft_clar",      
        "get-property-valuation",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(1000000));
    });

    it("should get property monthly rent", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-nft_clar",      
        "get-property-monthly-rent",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(5000));
    });

    it("should get owner", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-nft_clar",      
        "get-owner",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.some(Cl.standardPrincipal(address1)));
    });

    it("should get total supply", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-nft_clar",     
        "get-total-supply",
        [],
        address1
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("should get last token id", () => {
      const { result } = simnet.callReadOnlyFn(
        "property-nft_clar",      
        "get-last-token-id",
        [],
        address1
      );
      expect(result).toBeOk(Cl.uint(1)); // Returns next-property-id - 1, which is 2 - 1 = 1
    });
  });
});