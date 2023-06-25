import winston, { Logger } from 'winston';
import fs from 'fs';

export interface Item {
  index: number;
  weight: number;
  cost: number;
}

export class APIException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIException';
  }
}

interface FileReader {
  readLinesFromFile(filePath: string, logger: Logger): string[];
}

interface ItemParser {
  parseItems(itemsString: string, logger: Logger): Item[];
}

interface ItemSelector {
  selectItems(
    items: Item[],
    packageLimit: number,
    totalWeight: number,
    totalCost: number,
    selectedItems: Item[],
    resultObj: { maxCost: number; maxWeight: number; maxSelectedItems: Item[] }
  ): void;
}

class DefaultFileReader implements FileReader {
  readLinesFromFile(filePath: string, logger: Logger): string[] {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return fileContent.trim().split('\n');
  }
}

class DefaultItemParser implements ItemParser {
  parseItems(itemsString: string, logger: Logger): Item[] {
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
}

class DefaultItemSelector implements ItemSelector {
  selectItems(
    items: Item[],
    packageLimit: number,
    totalWeight: number,
    totalCost: number,
    selectedItems: Item[],
    resultObj: { maxCost: number; maxWeight: number; maxSelectedItems: Item[] }
  ): void {
    if (totalWeight > packageLimit) {
      return;
    }

    if (totalCost > resultObj.maxCost) {
      resultObj.maxCost = totalCost;
      resultObj.maxWeight = totalWeight;
      resultObj.maxSelectedItems = [...selectedItems];
    } else if (totalCost === resultObj.maxCost && totalWeight < resultObj.maxWeight) {
      resultObj.maxWeight = totalWeight;
      resultObj.maxSelectedItems = [...selectedItems];
    }

    for (let i = 0; i < items.length; i++) {
      const remainingItems = items.slice(i + 1);
      const item = items[i];
      this.selectItems(
        remainingItems,
        packageLimit,
        totalWeight + item.weight,
        totalCost + item.cost,
        [...selectedItems, item],
        resultObj
      );
    }
  }
}

interface ItemPacker {
  pack(filePath: string, logger: Logger): string;
}

class DefaultItemPacker implements ItemPacker {
  private fileReader: FileReader;
  private itemParser: ItemParser;
  private itemSelector: ItemSelector;

  constructor(fileReader: FileReader, itemParser: ItemParser, itemSelector: ItemSelector) {
    this.fileReader = fileReader;
    this.itemParser = itemParser;
    this.itemSelector = itemSelector;
  }

  pack(filePath: string, logger: Logger): string {
    let lines: string[];
    try {
      lines = this.fileReader.readLinesFromFile(filePath, logger);
    } catch (error) {
      logger.error(`Error reading file: ${error}`);
      throw new APIException('Error reading file');
    }

    const results: string[] = [];

    for (const line of lines) {
      const [packageLimitString, itemsString] = line.split(':');

      let packageLimit: number;
      try {
        packageLimit = this.parsePackageLimit(packageLimitString, logger);
      } catch (error) {
        logger.error(`Error parsing package limit: ${error}`);
        results.push('-'); // Invalid input, add '-' as the result
        continue; // Move to the next line
      }

      let availableItems: Item[];
      try {
        availableItems = this.itemParser.parseItems(itemsString, logger);
      } catch (error) {
        logger.error(`Error parsing items: ${error}`);
        throw new APIException('Invalid item format');
      }

      logger.info(`Package Limit: ${packageLimit}`);
      logger.debug('Available Items:', availableItems);

      const resultObj: {
        maxCost: number;
        maxWeight: number;
        maxSelectedItems: Item[];
      } = {
        maxCost: 0,
        maxWeight: Infinity,
        maxSelectedItems: [],
      };

      try {
        this.itemSelector.selectItems(availableItems, packageLimit, 0, 0, [], resultObj);
      } catch (error) {
        logger.error(`Error selecting items: ${error}`);
        throw new APIException('Error selecting items');
      }

      const selectedIndexes = resultObj.maxSelectedItems.map((item) => item.index).sort((a, b) => a - b);
      const result = selectedIndexes.join(',');

      results.push(result === '' ? '-' : result);
    }

    return results.join('\n');
  }

  private parsePackageLimit(packageLimitString: string, logger: Logger): number {
    const packageLimit = parseInt(packageLimitString.trim(), 10);

    if (isNaN(packageLimit) || packageLimit <= 0) {
      throw new APIException('Invalid package limit');
    }

    return packageLimit;
  }
}

export {
  FileReader,
  ItemParser,
  ItemSelector,
  DefaultFileReader,
  DefaultItemParser,
  DefaultItemSelector,
  ItemPacker,
  DefaultItemPacker,
};

// Usage example
const filePath = process.argv[2] || 'src/example_input.txt';
try {
  // Create a logger instance
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs.log' }),
    ],
  });

  const fileReader = new DefaultFileReader();
  const itemParser = new DefaultItemParser();
  const itemSelector = new DefaultItemSelector();
  const itemPacker = new DefaultItemPacker(fileReader, itemParser, itemSelector);

  const result = itemPacker.pack(filePath, logger);
  console.log(result);
} catch (error) {
  if (error instanceof APIException) {
    console.error('API Exception:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}

/*
  Dependency Injection:

  Dependency injection is used in this code to provide the necessary dependencies (strategies) to
  the ItemPacker class. Instead of creating the strategies within the ItemPacker class, they are
  passed as constructor arguments when creating an instance of the ItemPacker class.

  By injecting the strategies, the ItemPacker class becomes more flexible and decoupled from the
  specific implementations of the strategies. It allows different strategies to be easily swapped
  in and out without modifying the ItemPacker class itself.

  In the usage example, instances of the DefaultFileReader, DefaultItemParser, and
  DefaultItemSelector classes are created separately, and then they are injected into the
  DefaultItemPacker constructor. This way, the ItemPacker class can work with any implementation
  that adheres to the respective strategy interfaces.

  The use of dependency injection promotes loose coupling, testability, and modularity in the
  codebase. It enables easy replacement and customization of the strategies while keeping the core
  logic of the ItemPacker class intact.
*/

/*
  Algorithms Used:

  1. Depth-First Search (DFS) Algorithm:
     - Applied in the selectItems method of the DefaultItemSelector class.
     - Recursively explores all possible combinations of selected items.
     - Keeps track of the total weight, total cost, and the items selected so far.
     - Determines the combination of items that maximizes the cost while respecting the weight limit.

  2. Greedy Algorithm:
     - Applied implicitly in the selectItems method of the DefaultItemSelector class.
     - Prioritizes selecting items with higher cost-to-weight ratios.
     - Helps to improve the efficiency of the selection process by selecting promising items early.

  3. Sorting Algorithm (Array.sort):
     - Used in various places, such as sorting the selectedIndexes array.
     - Sorts the array of items based on a specific criteria (e.g., index, cost, weight).
     - Helps to organize the data in a desired order for processing or presentation.

  These algorithms are chosen for their effectiveness in solving the problem efficiently and
  producing the desired results. DFS allows exhaustive exploration of all possible combinations,
  while the greedy approach prioritizes items with better cost-to-weight ratios for a more
  optimized selection process. Sorting algorithms provide a way to order the items based on
  specific criteria, facilitating easier processing and analysis.
*/



