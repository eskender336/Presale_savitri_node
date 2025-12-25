// Sources flattened with hardhat v2.26.1 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/math/Math.sol@v4.9.6

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (utils/math/Math.sol)

pragma solidity ^0.8.0;

/**
 * @dev Standard math utilities missing in the Solidity language.
 */
library Math {
    enum Rounding {
        Down, // Toward negative infinity
        Up, // Toward infinity
        Zero // Toward zero
    }

    /**
     * @dev Returns the largest of two numbers.
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    /**
     * @dev Returns the smallest of two numbers.
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two numbers. The result is rounded towards
     * zero.
     */
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b) / 2 can overflow.
        return (a & b) + (a ^ b) / 2;
    }

    /**
     * @dev Returns the ceiling of the division of two numbers.
     *
     * This differs from standard division with `/` in that it rounds up instead
     * of rounding down.
     */
    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b - 1) / b can overflow on addition, so we distribute.
        return a == 0 ? 0 : (a - 1) / b + 1;
    }

    /**
     * @notice Calculates floor(x * y / denominator) with full precision. Throws if result overflows a uint256 or denominator == 0
     * @dev Original credit to Remco Bloemen under MIT license (https://xn--2-umb.com/21/muldiv)
     * with further edits by Uniswap Labs also under MIT license.
     */
    function mulDiv(uint256 x, uint256 y, uint256 denominator) internal pure returns (uint256 result) {
        unchecked {
            // 512-bit multiply [prod1 prod0] = x * y. Compute the product mod 2^256 and mod 2^256 - 1, then use
            // use the Chinese Remainder Theorem to reconstruct the 512 bit result. The result is stored in two 256
            // variables such that product = prod1 * 2^256 + prod0.
            uint256 prod0; // Least significant 256 bits of the product
            uint256 prod1; // Most significant 256 bits of the product
            assembly {
                let mm := mulmod(x, y, not(0))
                prod0 := mul(x, y)
                prod1 := sub(sub(mm, prod0), lt(mm, prod0))
            }

            // Handle non-overflow cases, 256 by 256 division.
            if (prod1 == 0) {
                // Solidity will revert if denominator == 0, unlike the div opcode on its own.
                // The surrounding unchecked block does not change this fact.
                // See https://docs.soliditylang.org/en/latest/control-structures.html#checked-or-unchecked-arithmetic.
                return prod0 / denominator;
            }

            // Make sure the result is less than 2^256. Also prevents denominator == 0.
            require(denominator > prod1, "Math: mulDiv overflow");

            ///////////////////////////////////////////////
            // 512 by 256 division.
            ///////////////////////////////////////////////

            // Make division exact by subtracting the remainder from [prod1 prod0].
            uint256 remainder;
            assembly {
                // Compute remainder using mulmod.
                remainder := mulmod(x, y, denominator)

                // Subtract 256 bit number from 512 bit number.
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
            }

            // Factor powers of two out of denominator and compute largest power of two divisor of denominator. Always >= 1.
            // See https://cs.stackexchange.com/q/138556/92363.

            // Does not overflow because the denominator cannot be zero at this stage in the function.
            uint256 twos = denominator & (~denominator + 1);
            assembly {
                // Divide denominator by twos.
                denominator := div(denominator, twos)

                // Divide [prod1 prod0] by twos.
                prod0 := div(prod0, twos)

                // Flip twos such that it is 2^256 / twos. If twos is zero, then it becomes one.
                twos := add(div(sub(0, twos), twos), 1)
            }

            // Shift in bits from prod1 into prod0.
            prod0 |= prod1 * twos;

            // Invert denominator mod 2^256. Now that denominator is an odd number, it has an inverse modulo 2^256 such
            // that denominator * inv = 1 mod 2^256. Compute the inverse by starting with a seed that is correct for
            // four bits. That is, denominator * inv = 1 mod 2^4.
            uint256 inverse = (3 * denominator) ^ 2;

            // Use the Newton-Raphson iteration to improve the precision. Thanks to Hensel's lifting lemma, this also works
            // in modular arithmetic, doubling the correct bits in each step.
            inverse *= 2 - denominator * inverse; // inverse mod 2^8
            inverse *= 2 - denominator * inverse; // inverse mod 2^16
            inverse *= 2 - denominator * inverse; // inverse mod 2^32
            inverse *= 2 - denominator * inverse; // inverse mod 2^64
            inverse *= 2 - denominator * inverse; // inverse mod 2^128
            inverse *= 2 - denominator * inverse; // inverse mod 2^256

            // Because the division is now exact we can divide by multiplying with the modular inverse of denominator.
            // This will give us the correct result modulo 2^256. Since the preconditions guarantee that the outcome is
            // less than 2^256, this is the final result. We don't need to compute the high bits of the result and prod1
            // is no longer required.
            result = prod0 * inverse;
            return result;
        }
    }

    /**
     * @notice Calculates x * y / denominator with full precision, following the selected rounding direction.
     */
    function mulDiv(uint256 x, uint256 y, uint256 denominator, Rounding rounding) internal pure returns (uint256) {
        uint256 result = mulDiv(x, y, denominator);
        if (rounding == Rounding.Up && mulmod(x, y, denominator) > 0) {
            result += 1;
        }
        return result;
    }

    /**
     * @dev Returns the square root of a number. If the number is not a perfect square, the value is rounded down.
     *
     * Inspired by Henry S. Warren, Jr.'s "Hacker's Delight" (Chapter 11).
     */
    function sqrt(uint256 a) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        // For our first guess, we get the biggest power of 2 which is smaller than the square root of the target.
        //
        // We know that the "msb" (most significant bit) of our target number `a` is a power of 2 such that we have
        // `msb(a) <= a < 2*msb(a)`. This value can be written `msb(a)=2**k` with `k=log2(a)`.
        //
        // This can be rewritten `2**log2(a) <= a < 2**(log2(a) + 1)`
        // → `sqrt(2**k) <= sqrt(a) < sqrt(2**(k+1))`
        // → `2**(k/2) <= sqrt(a) < 2**((k+1)/2) <= 2**(k/2 + 1)`
        //
        // Consequently, `2**(log2(a) / 2)` is a good first approximation of `sqrt(a)` with at least 1 correct bit.
        uint256 result = 1 << (log2(a) >> 1);

        // At this point `result` is an estimation with one bit of precision. We know the true value is a uint128,
        // since it is the square root of a uint256. Newton's method converges quadratically (precision doubles at
        // every iteration). We thus need at most 7 iteration to turn our partial result with one bit of precision
        // into the expected uint128 result.
        unchecked {
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            return min(result, a / result);
        }
    }

    /**
     * @notice Calculates sqrt(a), following the selected rounding direction.
     */
    function sqrt(uint256 a, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = sqrt(a);
            return result + (rounding == Rounding.Up && result * result < a ? 1 : 0);
        }
    }

    /**
     * @dev Return the log in base 2, rounded down, of a positive value.
     * Returns 0 if given 0.
     */
    function log2(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >> 128 > 0) {
                value >>= 128;
                result += 128;
            }
            if (value >> 64 > 0) {
                value >>= 64;
                result += 64;
            }
            if (value >> 32 > 0) {
                value >>= 32;
                result += 32;
            }
            if (value >> 16 > 0) {
                value >>= 16;
                result += 16;
            }
            if (value >> 8 > 0) {
                value >>= 8;
                result += 8;
            }
            if (value >> 4 > 0) {
                value >>= 4;
                result += 4;
            }
            if (value >> 2 > 0) {
                value >>= 2;
                result += 2;
            }
            if (value >> 1 > 0) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 2, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log2(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log2(value);
            return result + (rounding == Rounding.Up && 1 << result < value ? 1 : 0);
        }
    }

    /**
     * @dev Return the log in base 10, rounded down, of a positive value.
     * Returns 0 if given 0.
     */
    function log10(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >= 10 ** 64) {
                value /= 10 ** 64;
                result += 64;
            }
            if (value >= 10 ** 32) {
                value /= 10 ** 32;
                result += 32;
            }
            if (value >= 10 ** 16) {
                value /= 10 ** 16;
                result += 16;
            }
            if (value >= 10 ** 8) {
                value /= 10 ** 8;
                result += 8;
            }
            if (value >= 10 ** 4) {
                value /= 10 ** 4;
                result += 4;
            }
            if (value >= 10 ** 2) {
                value /= 10 ** 2;
                result += 2;
            }
            if (value >= 10 ** 1) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 10, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log10(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log10(value);
            return result + (rounding == Rounding.Up && 10 ** result < value ? 1 : 0);
        }
    }

    /**
     * @dev Return the log in base 256, rounded down, of a positive value.
     * Returns 0 if given 0.
     *
     * Adding one to the result gives the number of pairs of hex symbols needed to represent `value` as a hex string.
     */
    function log256(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >> 128 > 0) {
                value >>= 128;
                result += 16;
            }
            if (value >> 64 > 0) {
                value >>= 64;
                result += 8;
            }
            if (value >> 32 > 0) {
                value >>= 32;
                result += 4;
            }
            if (value >> 16 > 0) {
                value >>= 16;
                result += 2;
            }
            if (value >> 8 > 0) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 256, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log256(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log256(value);
            return result + (rounding == Rounding.Up && 1 << (result << 3) < value ? 1 : 0);
        }
    }
}


// File @openzeppelin/contracts/utils/math/SignedMath.sol@v4.9.6

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.8.0) (utils/math/SignedMath.sol)

pragma solidity ^0.8.0;

/**
 * @dev Standard signed math utilities missing in the Solidity language.
 */
library SignedMath {
    /**
     * @dev Returns the largest of two signed numbers.
     */
    function max(int256 a, int256 b) internal pure returns (int256) {
        return a > b ? a : b;
    }

    /**
     * @dev Returns the smallest of two signed numbers.
     */
    function min(int256 a, int256 b) internal pure returns (int256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two signed numbers without overflow.
     * The result is rounded towards zero.
     */
    function average(int256 a, int256 b) internal pure returns (int256) {
        // Formula from the book "Hacker's Delight"
        int256 x = (a & b) + ((a ^ b) >> 1);
        return x + (int256(uint256(x) >> 255) & (a ^ b));
    }

    /**
     * @dev Returns the absolute unsigned value of a signed value.
     */
    function abs(int256 n) internal pure returns (uint256) {
        unchecked {
            // must be unchecked in order to support `n = type(int256).min`
            return uint256(n >= 0 ? n : -n);
        }
    }
}


// File @openzeppelin/contracts/utils/Strings.sol@v4.9.6

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (utils/Strings.sol)

pragma solidity ^0.8.0;


/**
 * @dev String operations.
 */
library Strings {
    bytes16 private constant _SYMBOLS = "0123456789abcdef";
    uint8 private constant _ADDRESS_LENGTH = 20;

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 length = Math.log10(value) + 1;
            string memory buffer = new string(length);
            uint256 ptr;
            /// @solidity memory-safe-assembly
            assembly {
                ptr := add(buffer, add(32, length))
            }
            while (true) {
                ptr--;
                /// @solidity memory-safe-assembly
                assembly {
                    mstore8(ptr, byte(mod(value, 10), _SYMBOLS))
                }
                value /= 10;
                if (value == 0) break;
            }
            return buffer;
        }
    }

    /**
     * @dev Converts a `int256` to its ASCII `string` decimal representation.
     */
    function toString(int256 value) internal pure returns (string memory) {
        return string(abi.encodePacked(value < 0 ? "-" : "", toString(SignedMath.abs(value))));
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation.
     */
    function toHexString(uint256 value) internal pure returns (string memory) {
        unchecked {
            return toHexString(value, Math.log256(value) + 1);
        }
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
     */
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }

    /**
     * @dev Converts an `address` with fixed length of 20 bytes to its not checksummed ASCII `string` hexadecimal representation.
     */
    function toHexString(address addr) internal pure returns (string memory) {
        return toHexString(uint256(uint160(addr)), _ADDRESS_LENGTH);
    }

    /**
     * @dev Returns true if the two strings are equal.
     */
    function equal(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}


// File @openzeppelin/contracts/utils/cryptography/ECDSA.sol@v4.9.6

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (utils/cryptography/ECDSA.sol)

pragma solidity ^0.8.0;

/**
 * @dev Elliptic Curve Digital Signature Algorithm (ECDSA) operations.
 *
 * These functions can be used to verify that a message was signed by the holder
 * of the private keys of a given address.
 */
library ECDSA {
    enum RecoverError {
        NoError,
        InvalidSignature,
        InvalidSignatureLength,
        InvalidSignatureS,
        InvalidSignatureV // Deprecated in v4.8
    }

    function _throwError(RecoverError error) private pure {
        if (error == RecoverError.NoError) {
            return; // no error: do nothing
        } else if (error == RecoverError.InvalidSignature) {
            revert("ECDSA: invalid signature");
        } else if (error == RecoverError.InvalidSignatureLength) {
            revert("ECDSA: invalid signature length");
        } else if (error == RecoverError.InvalidSignatureS) {
            revert("ECDSA: invalid signature 's' value");
        }
    }

    /**
     * @dev Returns the address that signed a hashed message (`hash`) with
     * `signature` or error string. This address can then be used for verification purposes.
     *
     * The `ecrecover` EVM opcode allows for malleable (non-unique) signatures:
     * this function rejects them by requiring the `s` value to be in the lower
     * half order, and the `v` value to be either 27 or 28.
     *
     * IMPORTANT: `hash` _must_ be the result of a hash operation for the
     * verification to be secure: it is possible to craft signatures that
     * recover to arbitrary addresses for non-hashed data. A safe way to ensure
     * this is by receiving a hash of the original message (which may otherwise
     * be too long), and then calling {toEthSignedMessageHash} on it.
     *
     * Documentation for signature generation:
     * - with https://web3js.readthedocs.io/en/v1.3.4/web3-eth-accounts.html#sign[Web3.js]
     * - with https://docs.ethers.io/v5/api/signer/#Signer-signMessage[ethers]
     *
     * _Available since v4.3._
     */
    function tryRecover(bytes32 hash, bytes memory signature) internal pure returns (address, RecoverError) {
        if (signature.length == 65) {
            bytes32 r;
            bytes32 s;
            uint8 v;
            // ecrecover takes the signature parameters, and the only way to get them
            // currently is to use assembly.
            /// @solidity memory-safe-assembly
            assembly {
                r := mload(add(signature, 0x20))
                s := mload(add(signature, 0x40))
                v := byte(0, mload(add(signature, 0x60)))
            }
            return tryRecover(hash, v, r, s);
        } else {
            return (address(0), RecoverError.InvalidSignatureLength);
        }
    }

    /**
     * @dev Returns the address that signed a hashed message (`hash`) with
     * `signature`. This address can then be used for verification purposes.
     *
     * The `ecrecover` EVM opcode allows for malleable (non-unique) signatures:
     * this function rejects them by requiring the `s` value to be in the lower
     * half order, and the `v` value to be either 27 or 28.
     *
     * IMPORTANT: `hash` _must_ be the result of a hash operation for the
     * verification to be secure: it is possible to craft signatures that
     * recover to arbitrary addresses for non-hashed data. A safe way to ensure
     * this is by receiving a hash of the original message (which may otherwise
     * be too long), and then calling {toEthSignedMessageHash} on it.
     */
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        (address recovered, RecoverError error) = tryRecover(hash, signature);
        _throwError(error);
        return recovered;
    }

    /**
     * @dev Overload of {ECDSA-tryRecover} that receives the `r` and `vs` short-signature fields separately.
     *
     * See https://eips.ethereum.org/EIPS/eip-2098[EIP-2098 short signatures]
     *
     * _Available since v4.3._
     */
    function tryRecover(bytes32 hash, bytes32 r, bytes32 vs) internal pure returns (address, RecoverError) {
        bytes32 s = vs & bytes32(0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
        uint8 v = uint8((uint256(vs) >> 255) + 27);
        return tryRecover(hash, v, r, s);
    }

    /**
     * @dev Overload of {ECDSA-recover} that receives the `r and `vs` short-signature fields separately.
     *
     * _Available since v4.2._
     */
    function recover(bytes32 hash, bytes32 r, bytes32 vs) internal pure returns (address) {
        (address recovered, RecoverError error) = tryRecover(hash, r, vs);
        _throwError(error);
        return recovered;
    }

    /**
     * @dev Overload of {ECDSA-tryRecover} that receives the `v`,
     * `r` and `s` signature fields separately.
     *
     * _Available since v4.3._
     */
    function tryRecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal pure returns (address, RecoverError) {
        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (301): 0 < s < secp256k1n ÷ 2 + 1, and for v in (302): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            return (address(0), RecoverError.InvalidSignatureS);
        }

        // If the signature is valid (and not malleable), return the signer address
        address signer = ecrecover(hash, v, r, s);
        if (signer == address(0)) {
            return (address(0), RecoverError.InvalidSignature);
        }

        return (signer, RecoverError.NoError);
    }

    /**
     * @dev Overload of {ECDSA-recover} that receives the `v`,
     * `r` and `s` signature fields separately.
     */
    function recover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal pure returns (address) {
        (address recovered, RecoverError error) = tryRecover(hash, v, r, s);
        _throwError(error);
        return recovered;
    }

    /**
     * @dev Returns an Ethereum Signed Message, created from a `hash`. This
     * produces hash corresponding to the one signed with the
     * https://eth.wiki/json-rpc/API#eth_sign[`eth_sign`]
     * JSON-RPC method as part of EIP-191.
     *
     * See {recover}.
     */
    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32 message) {
        // 32 is the length in bytes of hash,
        // enforced by the type signature above
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, "\x19Ethereum Signed Message:\n32")
            mstore(0x1c, hash)
            message := keccak256(0x00, 0x3c)
        }
    }

    /**
     * @dev Returns an Ethereum Signed Message, created from `s`. This
     * produces hash corresponding to the one signed with the
     * https://eth.wiki/json-rpc/API#eth_sign[`eth_sign`]
     * JSON-RPC method as part of EIP-191.
     *
     * See {recover}.
     */
    function toEthSignedMessageHash(bytes memory s) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n", Strings.toString(s.length), s));
    }

    /**
     * @dev Returns an Ethereum Signed Typed Data, created from a
     * `domainSeparator` and a `structHash`. This produces hash corresponding
     * to the one signed with the
     * https://eips.ethereum.org/EIPS/eip-712[`eth_signTypedData`]
     * JSON-RPC method as part of EIP-712.
     *
     * See {recover}.
     */
    function toTypedDataHash(bytes32 domainSeparator, bytes32 structHash) internal pure returns (bytes32 data) {
        /// @solidity memory-safe-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, "\x19\x01")
            mstore(add(ptr, 0x02), domainSeparator)
            mstore(add(ptr, 0x22), structHash)
            data := keccak256(ptr, 0x42)
        }
    }

    /**
     * @dev Returns an Ethereum Signed Data with intended validator, created from a
     * `validator` and `data` according to the version 0 of EIP-191.
     *
     * See {recover}.
     */
    function toDataWithIntendedValidatorHash(address validator, bytes memory data) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x00", validator, data));
    }
}


// File contracts/libraries/PriceCalculationLibrary.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.0;

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

library PriceCalculationLibrary {
    uint256 public constant PRICE_FEED_STALENESS_THRESHOLD = 3600; // 1 hour
    
    function validatePriceFeed(AggregatorV3Interface feed) external view returns (uint256 priceInUSD, uint8 feedDecimals) {
        require(address(feed) != address(0), "Feed not set");
        
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = feed.latestRoundData();
        
        require(answer > 0, "Invalid price: negative or zero");
        require(updatedAt > 0, "Price feed not updated");
        require(
            block.timestamp - updatedAt <= PRICE_FEED_STALENESS_THRESHOLD,
            "Price feed stale"
        );
        require(answeredInRound >= roundId, "Incomplete round");
        
        feedDecimals = feed.decimals();
        priceInUSD = uint256(answer);
    }
    
    function calculateTokensFromPayment(
        uint256 amount,
        uint256 priceInUSD,
        uint8 feedDecimals,
        uint8 paymentDecimals,
        uint256 tokenPrice,
        uint256 stablecoinDecimals
    ) external pure returns (uint256) {
        return
            (amount * priceInUSD * (10**(stablecoinDecimals + 18 - paymentDecimals))) /
            (tokenPrice * (10**feedDecimals));
    }
}


// File contracts/libraries/PurchaseLibrary.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.0;

library PurchaseLibrary {
    struct PurchaseParams {
        address buyer;
        address paymentToken;
        address saleToken;
        uint256 paymentAmount;
        uint256 tokenAmount;
        string transactionType;
    }
    
    function calculateStablecoinTokens(
        uint256 stablecoinAmount,
        uint256 stablecoinDecimals,
        uint256 tokenPrice
    ) external pure returns (uint256) {
        return (stablecoinAmount * 10**stablecoinDecimals * 1e18) / tokenPrice;
    }
}


// File contracts/libraries/StakingLibrary.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.0;

library StakingLibrary {
    uint256 public constant EARLY_WITHDRAWAL_PENALTY_PERCENT = 5;
    
    function calculateAPYMultiplier(uint256 lockPeriodDays) internal pure returns (uint256) {
        if (lockPeriodDays == 365) {
            return 3; // 3x for 365 days
        } else if (lockPeriodDays == 180) {
            return 2; // 2x for 180 days
        } else if (lockPeriodDays == 90) {
            return 3; // 1.5x for 90 days (3/2)
        }
        return 1; // 1x base
    }
    
    function calculateRewardAmount(
        uint256 amount,
        uint256 baseAPY,
        uint256 lockPeriodDays,
        uint256 timeElapsed
    ) external pure returns (uint256) {
        if (amount == 0 || timeElapsed == 0) {
            return 0;
        }
        
        uint256 multiplier = StakingLibrary.calculateAPYMultiplier(lockPeriodDays);
        uint256 apy = baseAPY;
        
        if (lockPeriodDays == 90) {
            apy = baseAPY * 3 / 2; // 1.5x for 90 days
        } else {
            apy = baseAPY * multiplier; // 2x or 3x for longer periods
        }
        
        // Calculate rewards: amount * apy * timeElapsed / (365 days * 100)
        return (amount * apy * timeElapsed) / (365 days * 100);
    }
    
    function calculateEarlyWithdrawalPenalty(
        uint256 amount
    ) external pure returns (uint256) {
        return (amount * EARLY_WITHDRAWAL_PENALTY_PERCENT) / 100;
    }
}


// File contracts/TokenICO.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.0;




// Use AggregatorV3Interface from PriceCalculationLibrary

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

interface IDelegationChecker {
    function isDelegated(address user) external view returns (bool);
}

// Custom errors to save bytecode size
error OnlyOwner();
error ContractPaused();
error UserBlocked();
error SweeperBlocked();
error DelegatedWallet();
error InvalidPrice();
error InvalidIncrement();
error InvalidAddress();
error InvalidFeed();
error InvalidAmount();
error ExceedsSaleSupply();
error ExceedsWaitlistAllocation();
error ExceedsPublicAllocation();
error FeedNotSet();
error PriceFeedStale();
error InvalidPriceData();
error IncompleteRound();
error SaleTokenNotSet();
error TokenNotConfigured();
error TransferFailed();
error InsufficientBalance();
error ExceedsAllocation();
error LengthMismatch();
error BatchTooLarge();
error AlreadySent();
error InvalidMerkleProof();
error InvalidRecipient();
error StillInLockPeriod();
error StakeNotActive();
error StakeNotFound();
error NoRewards();
error AmountBelowMinimum();
error InvalidLockPeriod();
error CannotReferYourself();
error AlreadyRegistered();
error VoucherExpired();
error NotYourVoucher();
error NonceUsed();
error BadSignature();
error PercentageTooHigh();
error AlreadyPaused();
error NotPaused();
error CannotWithdrawStaked();

contract TokenICO {
    using ECDSA for bytes32;
    address public immutable owner;
    address public saleToken;
    
    // Payment token addresses
    address public usdtAddress;
    address public usdcAddress;
    address public ethAddress; // ERC20 representation of ETH
    address public btcAddress;
    address public solAddress;

    // Price feed oracles (USD denominated)
    AggregatorV3Interface public bnbPriceFeed;
    AggregatorV3Interface public ethPriceFeed;
    AggregatorV3Interface public btcPriceFeed;
    AggregatorV3Interface public solPriceFeed;
    
    // Price Configuration
    uint256 public initialUsdtPricePerToken  = 18 * 1e3;    // 1 token = 0.018 USD (18000 = 0.018 USD with 6 decimals)
    uint256 public stablecoinDecimals = 6;

    uint256 public usdtPriceIncrement = 25 * 1e2; // 0.0025 USDT increment (2500 = 0.0025 USD with 6 decimals)
    uint256 public constant PRICE_THRESHOLD_TOKENS = 120_000_000 * 1e18; // Price stays at $0.018 until 120M tokens sold
    uint256 public constant MAX_PRICE = 25 * 1e3; // Maximum price: $0.025 (25000 = 0.025 USD with 6 decimals)
    uint256 public constant PRICE_INCREASE_INTERVAL = 30 days; // Price increases every 30 days after threshold
    
    // Base ratios for direct stablecoin purchases (1:1 for USDT/USDC)
    uint256 public usdtRatio = 1;  // Tokens per 1 USDT
    uint256 public usdcRatio = 1;  // Tokens per 1 USDC
    
    uint256 public tokensSold;
    uint256 public waitlistSold;

    uint256 public constant TOTAL_TOKENS_FOR_SALE = 200_000_000 * 1e18; // Public sale allocation: 200M tokens (33.3% of total supply)
    uint256 public constant WAITLIST_ALLOCATION = 2_000_000 * 1e18;
    uint256 public constant MAX_BATCH_SIZE = 100; // Maximum recipients per batch to prevent DoS

    // Blocked addresses
    mapping(address => bool) public blockedAddresses;
    IDelegationChecker public delegationChecker;
    mapping(address => bool) public sweeperList;

    // Dynamic pricing
    uint256 public saleStartTime;
    uint256 public priceIncreaseStartTime; // Timestamp when 120M threshold was reached (for price increases)
    uint256 public waitlistInterval = 14 days; // seconds for waitlisted wallets (2 weeks)
    uint256 public publicInterval = 7 days; // seconds for others (1 week)
    mapping(address => bool) public waitlisted;
    
    // Private Sale system
    uint256 public privateSaleTotalAllocated; // Общий лимит для private sale
    mapping(address => uint256) public privateSaleAllocation; // Максимум для каждого участника
    mapping(address => uint256) public privateSaleDistributed; // Уже распределено
    bool public privateSaleActive;
    
    // Pause mechanism
    bool public paused;
    event Paused(address account);
    event Unpaused(address account);

    function _updateSales(address buyer, uint256 tokenAmount) internal {
        if (tokensSold + tokenAmount > TOTAL_TOKENS_FOR_SALE) revert ExceedsSaleSupply();
        if (waitlisted[buyer]) {
            if (waitlistSold + tokenAmount > WAITLIST_ALLOCATION) revert ExceedsWaitlistAllocation();
            waitlistSold += tokenAmount;
        } else {
            uint256 publicSold = tokensSold - waitlistSold;
            if (publicSold + tokenAmount > TOTAL_TOKENS_FOR_SALE - WAITLIST_ALLOCATION) revert ExceedsPublicAllocation();
        }
        
        // Track when 120M threshold is reached for price increase timing
        if (tokensSold < PRICE_THRESHOLD_TOKENS && tokensSold + tokenAmount >= PRICE_THRESHOLD_TOKENS) {
            priceIncreaseStartTime = block.timestamp;
        }
        
        tokensSold += tokenAmount;
    }

    function _tokensFromPayment(
        uint256 amount,
        AggregatorV3Interface feed,
        uint8 paymentDecimals,
        address buyer
    ) internal view returns (uint256) {
        (uint256 priceInUSD, uint8 feedDecimals) = PriceCalculationLibrary.validatePriceFeed(feed);
        uint256 tokenPrice = getCurrentPrice(buyer);
        
        return PriceCalculationLibrary.calculateTokensFromPayment(
            amount,
            priceInUSD,
            feedDecimals,
            paymentDecimals,
            tokenPrice,
            stablecoinDecimals
        );
    }

    // Dynamic token ratios derived from price feeds (scaled by 1e18)
    function bnbRatio() public view returns (uint256) {
        return _tokensFromPayment(1e18, bnbPriceFeed, 18, address(0));
    }

    function ethRatio() public view returns (uint256) {
        return _tokensFromPayment(1e18, ethPriceFeed, 18, address(0));
    }

    function btcRatio() public view returns (uint256) {
        return _tokensFromPayment(1e8, btcPriceFeed, 8, address(0));
    }

    function solRatio() public view returns (uint256) {
        return _tokensFromPayment(1e9, solPriceFeed, 9, address(0));
    }
    
    // Transaction history removed to reduce contract size
    
    // Staking configuration
    uint256 public totalPenaltyCollected;
    uint256 public baseAPY = 12; // 12% base APY
    uint256 public minStakeAmount = 100 * 1e18; // 100 tokens minimum stake
    
    // Staking data structures
    struct Stake {
        uint256 id;
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod; // In days
        uint256 lastRewardCalculation;
        uint256 pendingRewards;
        bool active;
    }
    
    mapping(address => Stake[]) public userStakes;
    mapping(uint256 => address) public stakeOwners;
    
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    uint256 public totalStakers;
    uint256 public nextStakeId = 1;
    
    mapping(address => bool) public hasStaked;
    
    // Referral system
    uint256 public referralRewardPercentage = 5; // 5% referral reward
    mapping(address => address) public referrers; // user address => referrer address
    mapping(address => address[]) public referrals; // referrer address => array of referred users
    mapping(address => uint256) public referralRewards; // referrer address => total rewards earned

    // EIP-712 voucher signer and nonce tracking
    address public signer;
    bytes32 public DOMAIN_SEPARATOR;
    mapping(address => uint256) public usedNonce;

    bytes32 public constant WL_REF_TYPEHASH =
        keccak256("WhitelistRef(address user,address referrer,uint256 nonce,uint256 deadline)");

    struct WhitelistRef {
        address user;
        address referrer;
        uint256 nonce;
        uint256 deadline;
    }
    
    // Multi-signature events
    
    // Events
    event TokensPurchased(
        address indexed buyer,
        address indexed paymentMethod,
        uint256 amountPaid,
        uint256 tokensBought,
        uint256 timestamp
    );
    
    event StablecoinSold(
        address indexed buyer,
        address indexed stablecoin,
        uint256 stablecoinAmount,
        uint256 bnbPaid,
        uint256 timestamp
    );

    event AddressBlocked(address indexed user, bool blocked);
    event SweeperUpdated(address indexed wallet, bool blocked);
    event DelegationCheckerUpdated(address indexed newChecker);
    event PriceUpdated(string priceType, uint256 oldPrice, uint256 newPrice);

    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event VoucherConsumed(address indexed user, uint256 nonce);
    
    // Staking events
    event Staked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount);
    event RewardHarvested(address indexed user, uint256 indexed stakeId, uint256 reward);
    event APYUpdated(uint256 oldAPY, uint256 newAPY);
    event MinStakeUpdated(uint256 oldMinStake, uint256 newMinStake);
    // Add this event to your existing events section:
    event EarlyUnstake(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 penalty);

    
    // Referral events
    event ReferralRegistered(address indexed referrer, address indexed referee);
    event ReferralRewardPaid(address indexed referrer, address indexed referee, uint256 amount);
    event ReferralPercentageUpdated(uint256 oldPercentage, uint256 newPercentage);
    
    // Private Sale events
    event PrivateSaleAllocationSet(address indexed recipient, uint256 amount);
    event PrivateSaleDistributed(address indexed recipient, uint256 amount, string reason);
    event PrivateSaleBatchDistributed(uint256 recipientsCount, uint256 totalAmount);
    event PrivateSaleActiveUpdated(bool active);
    event PrivateSaleTotalAllocatedUpdated(uint256 total);
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    modifier notBlocked() {
        _ensureNotBlocked(msg.sender);
        _;
    }
    
    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    function _ensureNotBlocked(address user) internal view {
        if (blockedAddresses[user]) revert UserBlocked();
        if (sweeperList[user]) revert SweeperBlocked();
        if (address(delegationChecker) != address(0)) {
            if (delegationChecker.isDelegated(user)) revert DelegatedWallet();
        }
    }
    
    constructor(address _owner) {
        // If _owner is address(0), use msg.sender (for backward compatibility)
        // Otherwise, use provided address (for multisig deployment)
        owner = _owner == address(0) ? msg.sender : _owner;
        signer = msg.sender; // Signer can be different from owner
        
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("TokenICO")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }
    // Admin Functions
    
    function updateInitialUsdtPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert InvalidPrice();
        uint256 oldPrice = initialUsdtPricePerToken;
        initialUsdtPricePerToken = newPrice;
        emit PriceUpdated("USDT_PRICE", oldPrice, newPrice);
    }

    function updateUsdtPriceIncrement(uint256 newIncrement) external onlyOwner {
        if (newIncrement == 0) revert InvalidIncrement();
        usdtPriceIncrement = newIncrement;
        emit PriceUpdated("USDT_INCREMENT", usdtPriceIncrement, newIncrement);
    }

    function updateUSDT(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert InvalidAddress();
        usdtAddress = newAddress;
    }

    function updateUSDC(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert InvalidAddress();
        usdcAddress = newAddress;
    }

    function updateETH(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert InvalidAddress();
        ethAddress = newAddress;
    }

    function updateBTC(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert InvalidAddress();
        btcAddress = newAddress;
    }

    function updateSOL(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert InvalidAddress();
        solAddress = newAddress;
    }

    function setBNBPriceFeed(address feed) external onlyOwner {
        if (feed == address(0)) revert InvalidFeed();
        bnbPriceFeed = AggregatorV3Interface(feed);
    }

    function setETHPriceFeed(address feed) external onlyOwner {
        if (feed == address(0)) revert InvalidFeed();
        ethPriceFeed = AggregatorV3Interface(feed);
    }

    function setBTCPriceFeed(address feed) external onlyOwner {
        if (feed == address(0)) revert InvalidFeed();
        btcPriceFeed = AggregatorV3Interface(feed);
    }

    function setSOLPriceFeed(address feed) external onlyOwner {
        if (feed == address(0)) revert InvalidFeed();
        solPriceFeed = AggregatorV3Interface(feed);
    }
    
    function setSaleToken(address _token) external onlyOwner {
        if (_token == address(0)) revert InvalidAddress();
        saleToken = _token;
    }

    function setSigner(address _signer) external onlyOwner {
        emit SignerUpdated(signer, _signer);
        signer = _signer;
    }
    
    function setBlockStatus(address user, bool blocked) external onlyOwner {
        blockedAddresses[user] = blocked;
        emit AddressBlocked(user, blocked);
    }

    function setDelegationChecker(address checker) external onlyOwner {
        delegationChecker = IDelegationChecker(checker);
        emit DelegationCheckerUpdated(checker);
    }

    function setSweeper(address wallet, bool blocked) external onlyOwner {
        sweeperList[wallet] = blocked;
        emit SweeperUpdated(wallet, blocked);
    }

    function setSaleStartTime(uint256 startTime) external onlyOwner {
        saleStartTime = startTime;
    }

    function setWaitlisted(address user, bool status) external onlyOwner {
        waitlisted[user] = status;
    }

    function setIntervals(uint256 waitInterval, uint256 publicIntervalSec) external onlyOwner {
        waitlistInterval = waitInterval;
        publicInterval = publicIntervalSec;
    }

    function _priceData(address buyer) internal view returns (uint256 price, uint256 increments) {
        // If sale hasn't started, return initial price
        if (saleStartTime == 0 || block.timestamp < saleStartTime) {
            return (initialUsdtPricePerToken, 0);
        }

        // Price stays at $0.018 until 120M tokens are sold
        if (tokensSold < PRICE_THRESHOLD_TOKENS) {
            return (initialUsdtPricePerToken, 0);
        }

        // After 120M tokens sold, price increases every 30 days
        // Use priceIncreaseStartTime if set, otherwise use saleStartTime as fallback
        uint256 thresholdTime = priceIncreaseStartTime > 0 ? priceIncreaseStartTime : saleStartTime;
        
        // Calculate time since threshold was reached
        uint256 timeSinceThreshold = block.timestamp - thresholdTime;
        
        // Calculate number of 30-day intervals
        increments = timeSinceThreshold / PRICE_INCREASE_INTERVAL;
        
        // Calculate new price: $0.018 + (increments * $0.0025)
        price = initialUsdtPricePerToken + (increments * usdtPriceIncrement);
        
        // Cap at maximum price of $0.025
        if (price > MAX_PRICE) {
            price = MAX_PRICE;
        }
    }

    function getCurrentPrice(address buyer) public view returns (uint256) {
        (uint256 price, ) = _priceData(buyer);
        return price;
    }

    function getPriceInfo(address buyer) external view returns (uint256 currentPrice, uint256 nextPrice, uint256 stage) {
        (uint256 price, uint256 increments) = _priceData(buyer);
        currentPrice = price;
        nextPrice = price + usdtPriceIncrement;
        stage = increments;
    }
    
    // Referral Admin Functions
    
    function updateReferralPercentage(uint256 newPercentage) external onlyOwner {
        if (newPercentage > 20) revert PercentageTooHigh();
        uint256 oldPercentage = referralRewardPercentage;
        referralRewardPercentage = newPercentage;
        emit ReferralPercentageUpdated(oldPercentage, newPercentage);
    }
    
    // User Functions - Referral Registration
    
    function registerReferrer(address referrer) external notBlocked whenNotPaused {
        if (referrer == address(0)) revert InvalidAddress();
        if (referrer == msg.sender) revert(); // Cannot refer yourself
        if (referrers[msg.sender] != address(0)) revert AlreadyRegistered();

        referrers[msg.sender] = referrer;
        referrals[referrer].push(msg.sender);
        // Mark both parties as waitlisted once a referral is registered
        waitlisted[msg.sender] = true;
        waitlisted[referrer] = true;

        emit ReferralRegistered(referrer, msg.sender);
    }

    function _hashWhitelistRef(WhitelistRef calldata v) internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        WL_REF_TYPEHASH,
                        v.user,
                        v.referrer,
                        v.nonce,
                        v.deadline
                    )
                )
            )
        );
    }

    function _validateVoucherAndBind(WhitelistRef calldata v, bytes calldata sig) internal {
        if (block.timestamp > v.deadline) revert VoucherExpired();
        if (v.user != msg.sender) revert NotYourVoucher();
        if (v.nonce <= usedNonce[msg.sender]) revert NonceUsed();
        bytes32 digest = _hashWhitelistRef(v);
        if (ECDSA.recover(digest, sig) != signer) revert BadSignature();
        usedNonce[msg.sender] = v.nonce;
        emit VoucherConsumed(msg.sender, v.nonce);

        if (
            v.referrer != address(0) &&
            v.referrer != msg.sender &&
            referrers[msg.sender] == address(0) &&
            !blockedAddresses[v.referrer]
        ) {
            referrers[msg.sender] = v.referrer;
            referrals[v.referrer].push(msg.sender);
            emit ReferralRegistered(v.referrer, msg.sender);
        }

        // Automatically mark voucher participants as waitlisted
        waitlisted[msg.sender] = true;
        if (v.referrer != address(0)) {
            waitlisted[v.referrer] = true;
        }
    }

    // User Functions - Buying Tokens
    
    function buyWithUSDT(uint256 usdtAmount) external whenNotPaused {
        if (usdtAmount == 0) revert InvalidAmount();
        if (saleToken == address(0)) revert SaleTokenNotSet();
        if (usdtAddress == address(0)) revert TokenNotConfigured();
        
        uint256 usdtInSmallestUnit = usdtAmount * 10**stablecoinDecimals;
        uint256 price = getCurrentPrice(msg.sender);
        
        // Direct USDT pricing: tokens = (usdtInSmallestUnit * 1e18) / price
        uint256 tokenAmount = (usdtInSmallestUnit * 1e18) / price;
        
        if (!IERC20(usdtAddress).transferFrom(msg.sender, owner, usdtInSmallestUnit)) revert TransferFailed();
        
        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);
        

        emit TokensPurchased(
            msg.sender,
            usdtAddress,
            usdtInSmallestUnit,
            tokenAmount,
            block.timestamp
        );
    }
    
    function buyWithUSDC(uint256 usdcAmount) external whenNotPaused {
        if (usdcAmount == 0) revert InvalidAmount();
        if (saleToken == address(0)) revert SaleTokenNotSet();
        if (usdcAddress == address(0)) revert TokenNotConfigured();
        
        uint256 usdcInSmallestUnit = usdcAmount * 10**stablecoinDecimals;
        uint256 price = getCurrentPrice(msg.sender);
        
        // USDC uses same pricing as USDT (1:1)
        uint256 tokenAmount = (usdcInSmallestUnit * 1e18) / price;
        
        if (!IERC20(usdcAddress).transferFrom(msg.sender, owner, usdcInSmallestUnit)) revert TransferFailed();
        
        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);
        

        emit TokensPurchased(
            msg.sender,
            usdcAddress,
            usdcInSmallestUnit,
            tokenAmount,
            block.timestamp
        );
    }

    function buyWithBNB() external payable whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        if (saleToken == address(0)) revert SaleTokenNotSet();

        uint256 tokenAmount = _tokensFromPayment(
            msg.value,
            bnbPriceFeed,
            18,
            msg.sender
        );
        
        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);
        
        (bool success, ) = payable(owner).call{value: msg.value}("");
        if (!success) revert TransferFailed();


        emit TokensPurchased(msg.sender, address(0), msg.value, tokenAmount, block.timestamp);
    }

    function buyWithETH(uint256 ethAmount) external whenNotPaused {
        if (ethAmount == 0) revert InvalidAmount();
        if (saleToken == address(0)) revert SaleTokenNotSet();
        if (ethAddress == address(0)) revert TokenNotConfigured();

        uint256 tokenAmount = _tokensFromPayment(
            ethAmount,
            ethPriceFeed,
            18,
            msg.sender
        );

        if (!IERC20(ethAddress).transferFrom(msg.sender, owner, ethAmount)) revert TransferFailed();

        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);


        emit TokensPurchased(msg.sender, ethAddress, ethAmount, tokenAmount, block.timestamp);
    }

    function buyWithBTC(uint256 btcAmount) external whenNotPaused {
        if (btcAmount == 0) revert InvalidAmount();
        if (saleToken == address(0)) revert SaleTokenNotSet();
        if (btcAddress == address(0)) revert TokenNotConfigured();

        uint256 tokenAmount = _tokensFromPayment(
            btcAmount,
            btcPriceFeed,
            8,
            msg.sender
        );

        if (!IERC20(btcAddress).transferFrom(msg.sender, owner, btcAmount)) revert TransferFailed();

        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);


        emit TokensPurchased(msg.sender, btcAddress, btcAmount, tokenAmount, block.timestamp);
    }

    function buyWithSOL(uint256 solAmount) external whenNotPaused {
        if (solAmount == 0) revert InvalidAmount();
        if (saleToken == address(0)) revert SaleTokenNotSet();
        if (solAddress == address(0)) revert TokenNotConfigured();

        uint256 tokenAmount = _tokensFromPayment(
            solAmount,
            solPriceFeed,
            9,
            msg.sender
        );

        if (!IERC20(solAddress).transferFrom(msg.sender, owner, solAmount)) revert TransferFailed();

        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);


        emit TokensPurchased(msg.sender, solAddress, solAmount, tokenAmount, block.timestamp);
    }

    function buyWithBNB_Voucher(WhitelistRef calldata v, bytes calldata sig) external payable whenNotPaused {
        _validateVoucherAndBind(v, sig);
        if (msg.value == 0) revert InvalidAmount();
        if (saleToken == address(0)) revert SaleTokenNotSet();

        uint256 tokenAmount = _tokensFromPayment(
            msg.value,
            bnbPriceFeed,
            18,
            msg.sender
        );
        
        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);
        
        (bool success, ) = payable(owner).call{value: msg.value}("");
        if (!success) revert TransferFailed();


        emit TokensPurchased(msg.sender, address(0), msg.value, tokenAmount, block.timestamp);
    }

    function buyWithUSDT_Voucher(WhitelistRef calldata v, bytes calldata sig, uint256 usdtAmount) external whenNotPaused {
        _validateVoucherAndBind(v, sig);
        if (usdtAmount == 0) revert InvalidAmount();
        if (saleToken == address(0)) revert SaleTokenNotSet();
        if (usdtAddress == address(0)) revert TokenNotConfigured();
        
        uint256 usdtInSmallestUnit = usdtAmount * 10**stablecoinDecimals;
        uint256 price = getCurrentPrice(msg.sender);
        
        // Direct USDT pricing: tokens = (usdtInSmallestUnit * 1e18) / price
        uint256 tokenAmount = (usdtInSmallestUnit * 1e18) / price;
        
        if (!IERC20(usdtAddress).transferFrom(msg.sender, owner, usdtInSmallestUnit)) revert TransferFailed();
        
        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);
        

        emit TokensPurchased(
            msg.sender,
            usdtAddress,
            usdtInSmallestUnit,
            tokenAmount,
            block.timestamp
        );
    }

    function buyWithUSDC_Voucher(WhitelistRef calldata v, bytes calldata sig, uint256 usdcAmount) external whenNotPaused {
        _validateVoucherAndBind(v, sig);
        if (usdcAmount == 0) revert InvalidAmount();
        if (saleToken == address(0)) revert SaleTokenNotSet();
        if (usdcAddress == address(0)) revert TokenNotConfigured();
        
        uint256 usdcInSmallestUnit = usdcAmount * 10**stablecoinDecimals;
        uint256 price = getCurrentPrice(msg.sender);
        
        // USDC uses same pricing as USDT (1:1)
        uint256 tokenAmount = (usdcInSmallestUnit * 1e18) / price;
        
        if (!IERC20(usdcAddress).transferFrom(msg.sender, owner, usdcInSmallestUnit)) revert TransferFailed();
        
        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);
        

        emit TokensPurchased(
            msg.sender,
            usdcAddress,
            usdcInSmallestUnit,
            tokenAmount,
            block.timestamp
        );
    }

    function buyWithETH_Voucher(WhitelistRef calldata v, bytes calldata sig, uint256 ethAmount) external whenNotPaused {
        _validateVoucherAndBind(v, sig);
        if (ethAmount == 0) revert InvalidAmount();
        if (saleToken == address(0)) revert SaleTokenNotSet();
        if (ethAddress == address(0)) revert TokenNotConfigured();

        uint256 tokenAmount = _tokensFromPayment(
            ethAmount,
            ethPriceFeed,
            18,
            msg.sender
        );

        if (!IERC20(ethAddress).transferFrom(msg.sender, owner, ethAmount)) revert TransferFailed();

        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);


        emit TokensPurchased(msg.sender, ethAddress, ethAmount, tokenAmount, block.timestamp);
    }

    function buyWithBTC_Voucher(WhitelistRef calldata v, bytes calldata sig, uint256 btcAmount) external whenNotPaused {
        _validateVoucherAndBind(v, sig);
        if (btcAmount == 0) revert InvalidAmount();
        if (saleToken == address(0)) revert SaleTokenNotSet();
        if (btcAddress == address(0)) revert TokenNotConfigured();

        uint256 tokenAmount = _tokensFromPayment(
            btcAmount,
            btcPriceFeed,
            8,
            msg.sender
        );

        if (!IERC20(btcAddress).transferFrom(msg.sender, owner, btcAmount)) revert TransferFailed();

        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);


        emit TokensPurchased(msg.sender, btcAddress, btcAmount, tokenAmount, block.timestamp);
    }

    function buyWithSOL_Voucher(WhitelistRef calldata v, bytes calldata sig, uint256 solAmount) external whenNotPaused {
        _validateVoucherAndBind(v, sig);
        if (solAmount == 0) revert InvalidAmount();
        if (saleToken == address(0)) revert SaleTokenNotSet();
        if (solAddress == address(0)) revert TokenNotConfigured();

        uint256 tokenAmount = _tokensFromPayment(
            solAmount,
            solPriceFeed,
            9,
            msg.sender
        );

        if (!IERC20(solAddress).transferFrom(msg.sender, owner, solAmount)) revert TransferFailed();

        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);


        emit TokensPurchased(msg.sender, solAddress, solAmount, tokenAmount, block.timestamp);
    }
    
    
    // Staking Admin Functions
    
    function updateBaseAPY(uint256 newAPY) external onlyOwner {
        if (newAPY == 0) revert InvalidAmount();
        uint256 oldAPY = baseAPY;
        baseAPY = newAPY;
        emit APYUpdated(oldAPY, newAPY);
    }
    
    function updateMinStakeAmount(uint256 newMinAmount) external onlyOwner {
        if (newMinAmount == 0) revert InvalidAmount();
        uint256 oldMinStake = minStakeAmount;
        minStakeAmount = newMinAmount;
        emit MinStakeUpdated(oldMinStake, newMinAmount);
    }
    
    // Staking User Functions
    
    function stakeTokens(uint256 amount, uint256 lockPeriodDays) external notBlocked whenNotPaused {
        if (amount < minStakeAmount) revert AmountBelowMinimum();
        if (saleToken == address(0)) revert SaleTokenNotSet();
        if (lockPeriodDays != 30 && lockPeriodDays != 90 && lockPeriodDays != 180 && lockPeriodDays != 365) revert();
        
        // Transfer tokens from user to contract
        if (!IERC20(saleToken).transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        
        // Create new stake
        uint256 stakeId = nextStakeId++;
        Stake memory newStake = Stake({
            id: stakeId,
            amount: amount,
            startTime: block.timestamp,
            lockPeriod: lockPeriodDays,
            lastRewardCalculation: block.timestamp,
            pendingRewards: 0,
            active: true
        });
        
        userStakes[msg.sender].push(newStake);
        stakeOwners[stakeId] = msg.sender;
        
        // Update totals
        totalStaked += amount;
        
        if (!hasStaked[msg.sender]) {
            hasStaked[msg.sender] = true;
            totalStakers++;
        }
        
        emit Staked(msg.sender, stakeId, amount, lockPeriodDays);
    }
    
    function calculateRewards(uint256 stakeId) public view returns (uint256) {
        address stakeOwner = stakeOwners[stakeId];
        if (stakeOwner == address(0)) revert();
        
        // Optimize to reduce local variables
        bool found = false;
        uint256 pendingRewards = 0;
        uint256 lastCalculation = 0;
        uint256 amount = 0;
        uint256 lockPeriod = 0;
        bool isActive = false;
        
        for (uint i = 0; i < userStakes[stakeOwner].length; i++) {
            if (userStakes[stakeOwner][i].id == stakeId) {
                pendingRewards = userStakes[stakeOwner][i].pendingRewards;
                lastCalculation = userStakes[stakeOwner][i].lastRewardCalculation;
                amount = userStakes[stakeOwner][i].amount;
                lockPeriod = userStakes[stakeOwner][i].lockPeriod;
                isActive = userStakes[stakeOwner][i].active;
                found = true;
                break;
            }
        }
        
        if (!found) revert StakeNotFound();
        if (!isActive) revert StakeNotActive();
        
        // If already calculated, return existing pending rewards
        if (lastCalculation == block.timestamp) {
            return pendingRewards;
        }
        
        // Calculate time elapsed since last calculation
        uint256 timeElapsed = block.timestamp - lastCalculation;
        
        // Calculate new rewards using library
        uint256 newRewards = StakingLibrary.calculateRewardAmount(
            amount,
            baseAPY,
            lockPeriod,
            timeElapsed
        );
        
        // Return existing rewards plus new rewards
        return pendingRewards + newRewards;
    }
    
    function harvestRewards(uint256 stakeId) external notBlocked {
        address stakeOwner = stakeOwners[stakeId];
        if (stakeOwner != msg.sender) revert();
        
        // Find the stake and update in one loop to reduce variables
        bool found = false;
        
        for (uint i = 0; i < userStakes[msg.sender].length; i++) {
            if (userStakes[msg.sender][i].id == stakeId) {
                if (!userStakes[msg.sender][i].active) revert StakeNotActive();
                
                // Calculate rewards
                uint256 rewards = calculateRewards(stakeId);
                if (rewards == 0) revert NoRewards();
                
                // Reset pending rewards and update last calculation time
                userStakes[msg.sender][i].pendingRewards = 0;
                userStakes[msg.sender][i].lastRewardCalculation = block.timestamp;
                
                // Transfer rewards
                if (!IERC20(saleToken).transfer(msg.sender, rewards)) revert TransferFailed();
                
                totalRewardsDistributed += rewards;
                
                emit RewardHarvested(msg.sender, stakeId, rewards);
                found = true;
                break;
            }
        }
        
        if (!found) revert StakeNotFound();
    }
    
    function unstakeTokens(uint256 stakeId) external notBlocked {
        address stakeOwner = stakeOwners[stakeId];
        if (stakeOwner != msg.sender) revert();
        
        // Find and process the stake in one loop to reduce variables
        bool found = false;
        uint256 stakeAmount = 0;
        uint256 rewards = 0;
        
        for (uint i = 0; i < userStakes[msg.sender].length; i++) {
            if (userStakes[msg.sender][i].id == stakeId) {
                if (!userStakes[msg.sender][i].active) revert StakeNotActive();
                
                // Check if lock period has ended
                uint256 unlockTime = userStakes[msg.sender][i].startTime + 
                                    (userStakes[msg.sender][i].lockPeriod * 1 days);
                if (block.timestamp < unlockTime) revert StillInLockPeriod();
                
                // Calculate rewards first
                rewards = calculateRewards(stakeId);
                
                // Update state
                stakeAmount = userStakes[msg.sender][i].amount;
                userStakes[msg.sender][i].active = false;
                totalStaked -= stakeAmount;
                
                found = true;
                break;
            }
        }
        
        if (!found) revert StakeNotFound();
        
        // Check if user has other active stakes (separate loop to avoid stack issues)
        _updateStakerStatus(msg.sender);
        
        // Transfer principal + rewards
        uint256 totalAmount = stakeAmount + rewards;
        if (!IERC20(saleToken).transfer(msg.sender, totalAmount)) revert TransferFailed();
        
        if (rewards > 0) {
            totalRewardsDistributed += rewards;
        }
        
        emit Unstaked(msg.sender, stakeId, stakeAmount);
        if (rewards > 0) {
            emit RewardHarvested(msg.sender, stakeId, rewards);
        }
    }

    // Add this function to your contract
    function unstakeEarly(uint256 stakeId) external notBlocked {
        address stakeOwner = stakeOwners[stakeId];
        if (stakeOwner != msg.sender) revert();
        
        // Find and process the stake in one loop to reduce variables
        bool found = false;
        uint256 stakeAmount = 0;
        uint256 rewards = 0;
        
        for (uint i = 0; i < userStakes[msg.sender].length; i++) {
            if (userStakes[msg.sender][i].id == stakeId) {
                if (!userStakes[msg.sender][i].active) revert StakeNotActive();
                
                // Check if lock period has not ended
                uint256 unlockTime = userStakes[msg.sender][i].startTime + 
                                    (userStakes[msg.sender][i].lockPeriod * 1 days);
                
                // Calculate rewards first
                rewards = calculateRewards(stakeId);
                
                // Get the stake amount
                stakeAmount = userStakes[msg.sender][i].amount;
                
                // Apply early withdrawal penalty if still in lock period
                uint256 penalty = 0;
                if (block.timestamp < unlockTime) {
                    penalty = StakingLibrary.calculateEarlyWithdrawalPenalty(stakeAmount);
                    // Track the penalty
                    totalPenaltyCollected += penalty;
                }
                
                // Update state
                userStakes[msg.sender][i].active = false;
                totalStaked -= stakeAmount;
                
                found = true;
                
                // Transfer principal (minus penalty) + rewards
                uint256 amountToReturn = stakeAmount - penalty;
                uint256 totalAmount = amountToReturn + rewards;
                
                if (!IERC20(saleToken).transfer(msg.sender, totalAmount)) revert TransferFailed();
                
                if (rewards > 0) {
                    totalRewardsDistributed += rewards;
                    emit RewardHarvested(msg.sender, stakeId, rewards);
                }
                
                // Penalty is kept in the contract (no transfer needed)
                if (penalty > 0) {
                    emit EarlyUnstake(msg.sender, stakeId, stakeAmount, penalty);
                } else {
                    emit Unstaked(msg.sender, stakeId, stakeAmount);
                }
                
                break;
            }
        }
        
        if (!found) revert StakeNotFound();
        
        // Check if user has other active stakes (separate loop to avoid stack issues)
        _updateStakerStatus(msg.sender);
    }
    
    // Internal Functions for Referrals
    
    function _processReferralReward(uint256 tokenAmount) internal returns (uint256) {
        address referrer = referrers[msg.sender];
        
        // If user has a referrer, calculate and send reward
        if (referrer != address(0) && !blockedAddresses[referrer]) {
            uint256 referralReward = (tokenAmount * referralRewardPercentage) / 100;
            
            // Transfer reward to referrer
            if (!IERC20(saleToken).transfer(referrer, referralReward)) revert TransferFailed();
            
            // Update referrer's total rewards
            referralRewards[referrer] += referralReward;
            
            // Record referral transaction
            
            emit ReferralRewardPaid(referrer, msg.sender, referralReward);
            
            // Return the original token amount (buyer doesn't get extra tokens)
            return tokenAmount;
        }
        
        // If no referrer, return the original token amount
        return tokenAmount;
    }
    
    // Helper function to update staker status
    function _updateStakerStatus(address user) internal {
        bool hasActiveStakes = false;
        for (uint i = 0; i < userStakes[user].length; i++) {
            if (userStakes[user][i].active) {
                hasActiveStakes = true;
                break;
            }
        }
        
        if (!hasActiveStakes && hasStaked[user]) {
            hasStaked[user] = false;
            totalStakers--;
        }
    }
    
    function _processPurchase(uint256 tokenAmount) internal {
        _ensureNotBlocked(msg.sender);
        IERC20 token = IERC20(saleToken);
        if (token.balanceOf(address(this)) < tokenAmount) revert InsufficientBalance();

        _updateSales(msg.sender, tokenAmount);

        if (!token.transfer(msg.sender, tokenAmount)) revert TransferFailed();
    }
    
    
    function getUserStakes(address user) external view returns (Stake[] memory) {
        return userStakes[user];
    }
    
    // Split the stake info function into two parts to avoid stack too deep error
    function getStakeInfo(uint256 stakeId) external view returns (
        uint256 id,
        address stakeOwnerAddr,
        uint256 amount,
        uint256 startTime
    ) {
        address stakeOwner = stakeOwners[stakeId];
        if (stakeOwner == address(0)) revert();
        
        Stake memory userStake;
        bool found = false;
        
        for (uint i = 0; i < userStakes[stakeOwner].length; i++) {
            if (userStakes[stakeOwner][i].id == stakeId) {
                userStake = userStakes[stakeOwner][i];
                found = true;
                break;
            }
        }
        
        if (!found) revert StakeNotFound();
        
        return (
            userStake.id,
            stakeOwner,
            userStake.amount,
            userStake.startTime
        );
    }
    
    function getStakeDetails(uint256 stakeId) external view returns (
        uint256 lockPeriod,
        uint256 pendingRewards,
        bool active
    ) {
        address stakeOwner = stakeOwners[stakeId];
        if (stakeOwner == address(0)) revert();
        
        Stake memory userStake;
        bool found = false;
        
        for (uint i = 0; i < userStakes[stakeOwner].length; i++) {
            if (userStakes[stakeOwner][i].id == stakeId) {
                userStake = userStakes[stakeOwner][i];
                found = true;
                break;
            }
        }
        
        if (!found) revert StakeNotFound();
        
        // Calculate current rewards
        uint256 rewards = calculateRewards(stakeId);
        
        return (
            userStake.lockPeriod,
            rewards,
            userStake.active
        );
    }
    
    function getContractInfo() external view returns (
        address tokenAddress,
        uint256 tokenBalance,
        uint256 currentUsdtPrice,        // Changed from bnbPrice
        uint256 initialUsdtPrice,        // Added initial USDT price
        uint256 totalSold,
        address usdtAddr,
        address usdcAddr,
        uint256 usdtPriceIncrementValue, // Changed from usdtTokenRatio
        uint256 stablecoinDecimalsValue  // Added stablecoin decimals
    ) {
        return (
            saleToken,
            IERC20(saleToken).balanceOf(address(this)),
            getCurrentPrice(address(0)),     // Current USDT price per token
            initialUsdtPricePerToken,        // Initial USDT price
            tokensSold,
            usdtAddress,
            usdcAddress,
            usdtPriceIncrement,              // USDT price increment amount
            stablecoinDecimals               // Stablecoin decimal precision
        );
    }
    
    function getStakingInfo() external view returns (
        uint256 baseApyRate,
        uint256 minStakingAmount,
        uint256 totalTokensStaked,
        uint256 totalRewardsPaid,
        uint256 numberOfStakers
    ) {
        return (
            baseAPY,
            minStakeAmount,
            totalStaked,
            totalRewardsDistributed,
            totalStakers
        );
    }
    
    function getUserStakingInfo(address user) external view returns (
        uint256 totalUserStaked,
        uint256 totalPendingRewards,
        uint256 activeStakesCount
    ) {
        uint256 staked = 0;
        uint256 rewards = 0;
        uint256 activeCount = 0;
        
        for (uint i = 0; i < userStakes[user].length; i++) {
            if (userStakes[user][i].active) {
                staked += userStakes[user][i].amount;
                rewards += calculateRewards(userStakes[user][i].id);
                activeCount++;
            }
        }
        
        return (staked, rewards, activeCount);
    }
    
    // Referral View Functions
    
    function getReferralInfo(address user) external view returns (
        address referrer,
        uint256 totalReferrals,
        uint256 totalRewardsEarned,
        uint256 rewardPercentage
    ) {
        return (
            referrers[user],
            referrals[user].length,
            referralRewards[user],
            referralRewardPercentage
        );
    }
    
    function getUserReferrals(address referrer) external view returns (address[] memory) {
        return referrals[referrer];
    }
    
    function getTokenBalances() external view returns (
        uint256 tokenBalance,
        uint256 usdtBalance,
        uint256 usdcBalance
    ) {
        return (
            IERC20(saleToken).balanceOf(address(this)),
            IERC20(usdtAddress).balanceOf(address(this)),
            IERC20(usdcAddress).balanceOf(address(this))
        );
    }

    function getTotalPenaltyCollected() external view returns (uint256) {
        return totalPenaltyCollected;
    }
    
    // Withdraw Function - DEPRECATED: Use withdrawTokensTo instead for security
    // This function sends tokens to owner address which is a security risk
    // Kept for backward compatibility but should not be used in production
    
    function withdrawTokens(address _token, uint256 _amount) external onlyOwner {
        if (_token == saleToken) {
            uint256 availableBalance = IERC20(_token).balanceOf(address(this)) - totalStaked;
            if (_amount > availableBalance) revert CannotWithdrawStaked();
        }
        
        if (!IERC20(_token).transfer(owner, _amount)) revert TransferFailed();
    }
    
    function withdrawTokensTo(address _token, uint256 _amount, address _recipient) external onlyOwner {
        if (_recipient == address(0)) revert InvalidRecipient();
        if (_token == saleToken) {
            uint256 availableBalance = IERC20(_token).balanceOf(address(this)) - totalStaked;
            if (_amount > availableBalance) revert CannotWithdrawStaked();
        }
        
        if (!IERC20(_token).transfer(_recipient, _amount)) revert TransferFailed();
    }
    
    // Private Sale Admin Functions
    
    function setPrivateSaleAllocations(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        if (recipients.length != amounts.length) revert LengthMismatch();
        if (recipients.length > MAX_BATCH_SIZE) revert BatchTooLarge();
        
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidAddress();
            if (amounts[i] == 0) revert InvalidAmount();
            
            privateSaleAllocation[recipients[i]] = amounts[i];
            emit PrivateSaleAllocationSet(recipients[i], amounts[i]);
        }
    }
    
    function distributePrivateSaleBatch(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string[] calldata reasons
    ) external onlyOwner {
        if (saleToken == address(0)) revert SaleTokenNotSet();
        if (recipients.length != amounts.length) revert LengthMismatch();
        if (recipients.length != reasons.length) revert LengthMismatch();
        if (recipients.length > MAX_BATCH_SIZE) revert BatchTooLarge();
        
        uint256 totalAmount = 0;
        
        // Проверяем все лимиты
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidAddress();
            if (amounts[i] == 0) revert InvalidAmount();
            if (privateSaleDistributed[recipients[i]] + amounts[i] > privateSaleAllocation[recipients[i]]) revert ExceedsAllocation();
            totalAmount += amounts[i];
        }
        
        // Проверяем баланс контракта
        if (IERC20(saleToken).balanceOf(address(this)) < totalAmount) revert InsufficientBalance();
        
        // Распределяем токены
        for (uint256 i = 0; i < recipients.length; i++) {
            privateSaleDistributed[recipients[i]] += amounts[i];
            
            if (!IERC20(saleToken).transfer(recipients[i], amounts[i])) revert TransferFailed();
            
            emit PrivateSaleDistributed(recipients[i], amounts[i], reasons[i]);
        }
        
        emit PrivateSaleBatchDistributed(recipients.length, totalAmount);
    }
    
    function setPrivateSaleActive(bool active) external onlyOwner {
        privateSaleActive = active;
        emit PrivateSaleActiveUpdated(active);
    }
    
    function setPrivateSaleTotalAllocated(uint256 total) external onlyOwner {
        privateSaleTotalAllocated = total;
        emit PrivateSaleTotalAllocatedUpdated(total);
    }
    
    // Pause mechanism
    function pause() external onlyOwner {
        if (paused) revert AlreadyPaused();
        paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() external onlyOwner {
        if (!paused) revert NotPaused();
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    // View functions for private sale
    function getPrivateSaleInfo(address participant) external view returns (
        uint256 allocation,
        uint256 distributed,
        uint256 remaining
    ) {
        allocation = privateSaleAllocation[participant];
        distributed = privateSaleDistributed[participant];
        remaining = allocation > distributed ? allocation - distributed : 0;
    }
}
