// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.26;

/**
 * @dev Provides counters that can only be incremented or decremented by one.
 */
library Counters {
    struct Counter {
        uint256 _value; // Default is 0
    }

    /**
     * @dev Returns the current value of the counter.
     */
    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    /**
     * @dev Increments the counter by 1.
     */
    function increment(Counter storage counter) internal {
        counter._value += 1;
    }

    /**
     * @dev Decrements the counter by 1.
     * Reverts if the counter is already 0.
     */
    function decrement(Counter storage counter) internal {
        uint256 value = counter._value;
        require(value > 0, "Counter: decrement overflow");
        counter._value = value - 1;
    }

    /**
     * @dev Resets the counter to 0.
     */
    function reset(Counter storage counter) internal {
        counter._value = 0;
    }
}