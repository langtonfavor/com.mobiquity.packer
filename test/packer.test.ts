import { expect } from 'chai';
import { pack } from '../src/packer';

describe('pack', () => {
  it('should return the correct results', () => {
    const expectedOutput = '4\n-\n2,7\n8,9';
    const result = pack('test/example_input');
    expect(result).to.equal(expectedOutput);
  });
});
