import fs from 'fs';
import winston from 'winston';
import { APIException, Item } from './packer';

/**
 * Reads the contents of a file and returns an array of lines.
 * @param filePath - The path to the file.
 * @param logger - The logger instance for logging messages.
 * @returns An array of lines read from the file.
 */
export function readFile(filePath: string, logger: winston.Logger): string[] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return fileContent.trim().split('\n');
  } catch (error) {
    logger.error('Error reading file:', error);
    throw new Error('Error reading file');
  }
}

/**
 * Parses the package limit string and returns a valid package limit.
 * @param packageLimitString - The package limit as a string.
 * @param logger - The logger instance for logging messages.
 * @returns The parsed package limit as a number.
 * @throws APIException if the package limit is invalid.
 */
export function parsePackageLimit(packageLimitString: string, logger: winston.Logger): number {
  const packageLimit = parseInt(packageLimitString.trim(), 10);

  if (isNaN(packageLimit) || packageLimit <= 0) {
    logger.error('Invalid package limit:', packageLimitString);
    throw new APIException('Invalid package limit');
  }

  return packageLimit;
}

/**
 * Parses the items string and returns an array of valid items.
 * @param itemsString - The string representation of items.
 * @param logger - The logger instance for logging messages.
 * @returns An array of parsed items.
 * @throws APIException if an item has an invalid format.
 */
export function parseItems(itemsString: string, logger: winston.Logger): Item[] {
  const parsedItems = itemsString.match(/\((.*?)\)/g) || [];
  const items: Item[] = [];

  for (const item of parsedItems) {
    const matches = item.match(/\((\d+),([\d.]+),€(\d+)\)/);
    if (matches) {
      const [_, index, weight, cost] = matches;
      const parsedItem: Item = {
        index: parseInt(index),
        weight: parseFloat(weight),
        cost: parseInt(cost),
      };
      items.push(parsedItem);
    } else {
      logger.error('Invalid item format:', item);
      throw new APIException('Invalid item format');
    }
  }

  return items;
}
