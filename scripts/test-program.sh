#!/bin/bash

TEST_PATTERN=$1

if [ -z "$DEBUG" ]
then
  echo "Running tests with the DEBUG flag enabled, additional error information will be logged for test failures."
  echo "In addition, Bluebird's Promise implementation will be used to enable more informative stack traces."
else
  echo "Running tests in regular mode. Run with DEBUG=true to see more program log output if transactions fail."
fi
echo ""

if [ "$LOG_TX_SIZE" = true ]
then
  echo "Running tests with the LOG_TX_SIZE flag enabled, which will display transaction size logs"
  echo ""
fi

if [ -z "$TEST_PATTERN" ]
then
  yarn test-sdk src/tests/e2e/*.test.ts
else
  echo "Running tests for pattern: $TEST_PATTERN"
  echo ""
  yarn test-sdk $TEST_PATTERN
fi