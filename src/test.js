type Item = {
    index: number;
    weight: number;
    cost: number;
  };
  
  export function pack(input: string[]): string {
    const results: string[] = [];
  
    for (const line of input) {
      const [packageLimitRaw, itemsRaw] = line.split(':');
      const packageLimit = parseInt(packageLimitRaw.trim());
      const parsedItems: Item[] = itemsRaw
        .split(') ')
        .map((itemRaw) => {
          const [indexRaw, weightRaw, costRaw] = itemRaw
            .replace('(', '')
            .split(',');
  
          const index = parseInt(indexRaw.trim());
          const weight = parseFloat(weightRaw.trim());
          const cost = parseInt(costRaw.trim().replace(/€/, ''));
  
          return { index, weight, cost };
        });
  
      let maxCost = 0;
      let maxSelectedItems: Item[] = [];
  
      function selectItems(items: Item[], totalWeight: number, totalCost: number, selectedItems: Item[]): void {
        if (items.length === 0) {
          if (totalCost > maxCost) {
            maxCost = totalCost;
            maxSelectedItems = [...selectedItems];
          }
          return;
        }
  
        const item = items[0];
        const remainingItems = items.slice(1);
  
        if (totalWeight + item.weight <= packageLimit) {
          selectItems(remainingItems, totalWeight + item.weight, totalCost + item.cost, [...selectedItems, item]);
        }
  
        selectItems(remainingItems, totalWeight, totalCost, selectedItems);
      }
  
      selectItems(parsedItems, 0, 0, []);
  
      const selectedIndexes = maxSelectedItems.map((item) => item.index).sort((a, b) => a - b);
      const result = selectedIndexes.join(',');
  
      results.push(result === '' ? '-' : result);
    }
  
    return results.join('\n');
  }
  
  // Example usage
  const input = [
    '81 : (1,53.38,€45) (2,88.62,€98) (3,78.48,€3) (4,72.30,€76) (5,30.18,€9) (6,46.34,€48)',
    '8 : (1,15.3,€34)',
    '75 : (1,85.31,€29) (2,14.55,€74) (3,3.98,€16) (4,26.24,€55) (5,63.69,€52) (6,76.25,€75) (7,60.02,€74) (8,93.18,€35) (9,89.95,€78)',
  ];
  
  const result = pack(input);
  console.log(result);
  