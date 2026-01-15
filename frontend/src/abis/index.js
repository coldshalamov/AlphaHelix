export const reserveAbi = [
  { inputs: [], name: 'buy', outputs: [], stateMutability: 'payable', type: 'function' },
  {
    inputs: [{ internalType: 'uint256', name: 'hlxAmount', type: 'uint256' }],
    name: 'sell',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { inputs: [], name: 'RATE', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
];

export const tokenAbi = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  { inputs: [], name: 'decimals', outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
];

export const marketAbi = [
  {
    inputs: [],
    name: 'marketCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'markets',
    outputs: [
      { internalType: 'string', name: 'ipfsCid', type: 'string' },
      { internalType: 'uint256', name: 'commitEndTime', type: 'uint256' },
      { internalType: 'uint256', name: 'revealEndTime', type: 'uint256' },
      { internalType: 'uint256', name: 'yesPool', type: 'uint256' },
      { internalType: 'uint256', name: 'noPool', type: 'uint256' },
      { internalType: 'uint256', name: 'unalignedPool', type: 'uint256' },
      { internalType: 'bool', name: 'resolved', type: 'bool' },
      { internalType: 'bool', name: 'outcome', type: 'bool' },
      { internalType: 'bool', name: 'tie', type: 'bool' },
      { internalType: 'address', name: 'originator', type: 'address' },
      { internalType: 'uint256', name: 'claimedWinningStake', type: 'uint256' },
      { internalType: 'uint256', name: 'claimedRewardPaid', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'marketId', type: 'uint256' },
      { internalType: 'bytes32', name: 'commitHash', type: 'bytes32' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'commitBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'marketId', type: 'uint256' },
      { internalType: 'uint8', name: 'choice', type: 'uint8' },
      { internalType: 'uint256', name: 'salt', type: 'uint256' },
    ],
    name: 'revealBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'marketId', type: 'uint256' },
    ],
    name: 'resolve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'marketId', type: 'uint256' }],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'marketId', type: 'uint256' }],
    name: 'withdrawUnrevealed',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'marketId', type: 'uint256' },
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'uint8', name: 'choice', type: 'uint8' },
    ],
    name: 'bets',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'marketId', type: 'uint256' },
      { internalType: 'address', name: 'user', type: 'address' },
    ],
    name: 'committedAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];
