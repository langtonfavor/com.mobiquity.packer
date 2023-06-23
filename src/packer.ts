import fs from 'fs';

type Item = {
  index: number;
  weight: number;
  cost: number;
};

export function pack(filePath: string): string {
  const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
  const results: string[] = [];

  for (const line of lines) {
    const [packageLimitString, itemsString] = line.split(':');
    const parsedItems = itemsString.match(/\((.*?)\)/g) || [];

    const packageLimit = parseInt(packageLimitString.trim(), 10);

    const availableItems: Item[] = [];

    for (const item of parsedItems) {
      const matches = item.match(/\((\d+),([\d.]+),€(\d+)\)/);
      if (matches) {
        const [_, index, weight, cost] = matches;
        availableItems.push({
          index: parseInt(index),
          weight: parseFloat(weight),
          cost: parseInt(cost),
        });
      }
    }

    let maxCost = 0;
    let maxWeight = Infinity;
    let maxSelectedItems: Item[] = [];

    function selectItems(items: Item[], totalWeight: number, totalCost: number, selectedItems: Item[]): void {
      if (totalWeight > packageLimit) {
        return;
      }

      if (totalCost > maxCost) {
        maxCost = totalCost;
        maxWeight = totalWeight;
        maxSelectedItems = [...selectedItems];
      } else if (totalCost === maxCost && totalWeight < maxWeight) {
        maxWeight = totalWeight;
        maxSelectedItems = [...selectedItems];
      }

      for (let i = 0; i < items.length; i++) {
        const remainingItems = items.slice(i + 1);
        const item = items[i];
        selectItems(remainingItems, totalWeight + item.weight, totalCost + item.cost, [...selectedItems, item]);
      }
    }

    selectItems(availableItems, 0, 0, []);

    const selectedIndexes = maxSelectedItems.map((item) => item.index).sort((a, b) => a - b);
    const result = selectedIndexes.join(',');

    results.push(result === '' ? '-' : result);
  }

  return results.join('\n');
}

const filePath = process.argv[2] || 'src/example_input';
const result = pack(filePath);
console.log(result);
