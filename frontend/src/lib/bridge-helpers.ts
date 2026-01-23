// Helper functions for USDCx bridging
import * as P from 'micro-packed';
import { createAddress, addressToString, AddressVersion, StacksWireType } from '@stacks/transactions';
import { hex } from '@scure/base';
import { type Hex, pad, toHex } from "viem";

/**
 * Encodes a Stacks address into bytes32 format for xReserve depositToRemote
 */
export const remoteRecipientCoder = P.wrap<string>({
  encodeStream(w, value: string) {
    const address = createAddress(value);
    P.bytes(11).encodeStream(w, new Uint8Array(11).fill(0));
    P.U8.encodeStream(w, address.version);
    P.bytes(20).encodeStream(w, hex.decode(address.hash160));
  },
  decodeStream(r) {
    P.bytes(11).decodeStream(r);
    const version = P.U8.decodeStream(r);
    const hash = P.bytes(20).decodeStream(r);
    return addressToString({
      hash160: hex.encode(hash),
      version: version as AddressVersion,
      type: StacksWireType.Address,
    });
  },
});

/**
 * Converts bytes to bytes32 Hex format
 */
export function bytes32FromBytes(bytes: Uint8Array): Hex {
  return toHex(pad(bytes, { size: 32 }));
}

/**
 * Encodes Stacks address for xReserve remote recipient
 */
export function encodeStacksAddressForBridge(stacksAddress: string): Hex {
  return bytes32FromBytes(remoteRecipientCoder.encode(stacksAddress));
}

/**
 * Encodes Ethereum address for USDCx burn native recipient (pad to 32 bytes)
 */
export function encodeEthereumAddressForBridge(ethAddress: string): Hex {
  // Remove 0x prefix if present
  const cleanAddress = ethAddress.startsWith('0x') ? ethAddress.slice(2) : ethAddress;
  // Pad left to 32 bytes
  return toHex(pad(`0x${cleanAddress}`, { size: 32 }));
}

