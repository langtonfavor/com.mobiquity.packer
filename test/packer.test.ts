// packer.test.ts
import { Logger } from 'winston';
import {
  DefaultFileReader,
  DefaultItemParser,
  DefaultItemSelector,
  Item,
  APIException,
} from '../src/packer';
import { expect } from 'chai';

describe('DefaultFileReader', () => {
  const logger: Logger = /* Mock the logger instance */;
  const fileReader = new DefaultFileReader();

  test('readLinesFromFile should return an array of lines', () => {
    const filePath = 'test/example_input.txt';
    const expectedLines = ['line 1', 'line 2', 'line 3'];

    const result = fileReader.readLinesFromFile(filePath, logger);

    expect(result).equal(expectedLines);
  });

  test('readLinesFromFile should throw an APIException when there is an error reading the file', () => {
    const filePath = 'nonexistent_file.txt';

    expect(() => {
      fileReader.readLinesFromFile(filePath, logger);
    }).throw(APIException);
  });
});

describe('DefaultItemParser', () => {
  const itemParser = new DefaultItemParser();

  test('parseItems should return an array of parsed items', () => {
    const itemsString = '(1,10,€5)\n(2,20,€10)\n(3,30,€15)';
    const expectedItems: Item[] = [
      { index: 1, weight: 10, cost: 5 },
      { index: 2, weight: 20, cost: 10 },
      { index: 3, weight: 30, cost: 15 },
    ];

    const result = itemParser.parseItems(itemsString, logger);

    expect(result).equal(expectedItems);
  });

  test('parseItems should throw an APIException when there is an error parsing an item', () => {
    const itemsString = '(1,10,€5)\n(2,20,15)\n(3,30,€15)';

    expect(() => {
      itemParser.parseItems(itemsString, logger);
    }).throw(APIException);
  });
});

describe('DefaultItemSelector', () => {
  const itemSelector = new DefaultItemSelector();

  test('selectItems should select the maximum cost items within the package limit', () => {
    const items: Item[] = [
      { index: 1, weight: 10, cost: 5 },
      { index: 2, weight: 20, cost: 10 },
      { index: 3, weight: 30, cost: 15 },
    ];
    const packageLimit = 30;
    const totalWeight = 0;
    const totalCost = 0;
    const selectedItems: Item[] = [];
    const resultObj = { maxCost: 0, maxWeight: Infinity, maxSelectedItems: [] };
    const expectedMaxCost = 15;
    const expectedMaxWeight = 30;
    const expectedMaxSelectedItems: Item[] = [
      { index: 3, weight: 30, cost: 15 },
    ];

    itemSelector.selectItems(items, packageLimit, totalWeight, totalCost, selectedItems, resultObj);

    expect(resultObj.maxCost).equal(expectedMaxCost);
    expect(resultObj.maxWeight).equal(expectedMaxWeight);
    expect(resultObj.maxSelectedItems).equal(expectedMaxSelectedItems);
  });

  test('selectItems should not select items that exceed the package limit', () => {
    const items: Item[] = [
      { index: 1, weight: 10, cost: 5 },
      { index: 2, weight: 20, cost: 10 },
      { index: 3, weight: 30, cost: 15 },
    ];
    const packageLimit = 20;
    const totalWeight = 0;
    const totalCost = 0;
    const selectedItems: Item[] = [];
    const resultObj = { maxCost: 0, maxWeight: Infinity, maxSelectedItems: [] };
    const expectedMaxCost = 0;
    const expectedMaxWeight = Infinity;
    const expectedMaxSelectedItems: Item[] = [];

    itemSelector.selectItems(items, packageLimit, totalWeight, totalCost, selectedItems, resultObj);

    expect(resultObj.maxCost).equal(expectedMaxCost);
    expect(resultObj.maxWeight).equal(expectedMaxWeight);
    expect(resultObj.maxSelectedItems).equal(expectedMaxSelectedItems);
  });
});
