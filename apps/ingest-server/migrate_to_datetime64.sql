-- Migration: DateTime to DateTime64(3) for millisecond precision
-- This migration uses ALTER TABLE to modify columns in-place

-- 1. Migrate function_execution table
ALTER TABLE default.function_execution
  MODIFY COLUMN timestamp DateTime64(3);

-- 2. Migrate console_log table
ALTER TABLE default.console_log
  MODIFY COLUMN timestamp DateTime64(3);

-- Verify the changes
DESCRIBE TABLE default.function_execution;
DESCRIBE TABLE default.console_log;
