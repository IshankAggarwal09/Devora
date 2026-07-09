import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Problem from './src/models/problem.model.js';
import User from './src/models/user.model.js';

dotenv.config();

const problemsData = [
  {
    title: 'Two Sum',
    difficulty: 'easy',
    topics: ['Arrays', 'Hash Table', 'Database'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

**Input Format**
The first line contains an integer \`n\`, the size of the array.
The second line contains \`n\` space-separated integers representing \`nums\`.
The third line contains the integer \`target\`.

**Output Format**
Print two space-separated integers representing the indices.`,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isSample: true },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2', isSample: false },
      { input: '2\n3 3\n6', expectedOutput: '0 1', isSample: false },
      { input: '5\n-1 -2 -3 -4 -5\n-8', expectedOutput: '2 4', isSample: false }
    ]
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'easy',
    topics: ['Strings', 'Depth-First Search'],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Input Format**
A single string \`s\`.

**Output Format**
Print \`true\` if the string is valid, otherwise \`false\`.`,
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only.'
    ],
    testCases: [
      { input: '()', expectedOutput: 'true', isSample: true },
      { input: '()[]{}', expectedOutput: 'true', isSample: false },
      { input: '(]', expectedOutput: 'false', isSample: false },
      { input: '([)]', expectedOutput: 'false', isSample: false },
      { input: '{[]}', expectedOutput: 'true', isSample: false }
    ]
  },
  {
    title: 'Contains Duplicate',
    difficulty: 'easy',
    topics: ['Arrays', 'Hash Table', 'Sorting'],
    description: `Given an integer array \`nums\`, return \`true\` if any value appears at least twice in the array, and return \`false\` if every element is distinct.

**Input Format**
The first line contains an integer \`n\`, the size of the array.
The second line contains \`n\` space-separated integers representing \`nums\`.

**Output Format**
Print \`true\` or \`false\`.`,
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9'
    ],
    testCases: [
      { input: '4\n1 2 3 1', expectedOutput: 'true', isSample: true },
      { input: '4\n1 2 3 4', expectedOutput: 'false', isSample: false },
      { input: '10\n1 1 1 3 3 4 3 2 4 2', expectedOutput: 'true', isSample: false },
      { input: '1\n5', expectedOutput: 'false', isSample: false }
    ]
  },
  {
    title: 'Climbing Stairs',
    difficulty: 'easy',
    topics: ['Math', 'Dynamic Programming'],
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

**Input Format**
A single integer \`n\`.

**Output Format**
A single integer representing the number of ways.`,
    constraints: [
      '1 <= n <= 45'
    ],
    testCases: [
      { input: '2', expectedOutput: '2', isSample: true },
      { input: '3', expectedOutput: '3', isSample: false },
      { input: '4', expectedOutput: '5', isSample: false },
      { input: '45', expectedOutput: '1836311903', isSample: false }
    ]
  },
  {
    title: 'Missing Number',
    difficulty: 'easy',
    topics: ['Arrays', 'Math', 'Sorting'],
    description: `Given an array \`nums\` containing \`n\` distinct numbers in the range \`[0, n]\`, return the only number in the range that is missing from the array.

**Input Format**
The first line contains an integer \`n\`.
The second line contains \`n\` space-separated integers.

**Output Format**
A single integer.`,
    constraints: [
      'n == nums.length',
      '1 <= n <= 10^4',
      '0 <= nums[i] <= n'
    ],
    testCases: [
      { input: '3\n3 0 1', expectedOutput: '2', isSample: true },
      { input: '2\n0 1', expectedOutput: '2', isSample: false },
      { input: '9\n9 6 4 2 3 5 7 0 1', expectedOutput: '8', isSample: false },
      { input: '1\n1', expectedOutput: '0', isSample: false }
    ]
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'easy',
    topics: ['Arrays', 'Greedy', 'Dynamic Programming'],
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

**Input Format**
The first line contains an integer \`n\`.
The second line contains \`n\` space-separated integers.

**Output Format**
A single integer representing the max profit.`,
    constraints: [
      '1 <= prices.length <= 10^5',
      '0 <= prices[i] <= 10^4'
    ],
    testCases: [
      { input: '6\n7 1 5 3 6 4', expectedOutput: '5', isSample: true },
      { input: '5\n7 6 4 3 1', expectedOutput: '0', isSample: false },
      { input: '1\n5', expectedOutput: '0', isSample: false },
      { input: '2\n1 10000', expectedOutput: '9999', isSample: false }
    ]
  },
  {
    title: 'Plus One',
    difficulty: 'easy',
    topics: ['Arrays', 'Math', 'Database'],
    description: `You are given a large integer represented as an integer array \`digits\`, where each \`digits[i]\` is the \`i\`th digit of the integer. The digits are ordered from most significant to least significant in left-to-right order. The large integer does not contain any leading 0's.

Increment the large integer by one and return the resulting array of digits.

**Input Format**
The first line contains an integer \`n\`.
The second line contains \`n\` space-separated integers representing the digits.

**Output Format**
Space-separated integers representing the new digits.`,
    constraints: [
      '1 <= digits.length <= 100',
      '0 <= digits[i] <= 9'
    ],
    testCases: [
      { input: '3\n1 2 3', expectedOutput: '1 2 4', isSample: true },
      { input: '4\n4 3 2 1', expectedOutput: '4 3 2 2', isSample: false },
      { input: '1\n9', expectedOutput: '1 0', isSample: false },
      { input: '3\n9 9 9', expectedOutput: '1 0 0 0', isSample: false }
    ]
  },
  {
    title: 'Valid Anagram',
    difficulty: 'easy',
    topics: ['Strings', 'Hash Table', 'Sorting'],
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

**Input Format**
Two lines, the first containing \`s\` and the second containing \`t\`.

**Output Format**
\`true\` or \`false\`.`,
    constraints: [
      '1 <= s.length, t.length <= 5 * 10^4',
      's and t consist of lowercase English letters.'
    ],
    testCases: [
      { input: 'anagram\nnagaram', expectedOutput: 'true', isSample: true },
      { input: 'rat\ncar', expectedOutput: 'false', isSample: false },
      { input: 'a\na', expectedOutput: 'true', isSample: false },
      { input: 'ab\na', expectedOutput: 'false', isSample: false }
    ]
  },
  {
    title: 'Majority Element',
    difficulty: 'easy',
    topics: ['Arrays', 'Hash Table', 'Sorting'],
    description: `Given an array \`nums\` of size \`n\`, return the majority element.

The majority element is the element that appears more than \`⌊n / 2⌋\` times. You may assume that the majority element always exists in the array.

**Input Format**
The first line contains an integer \`n\`.
The second line contains \`n\` space-separated integers.

**Output Format**
A single integer.`,
    constraints: [
      'n == nums.length',
      '1 <= n <= 5 * 10^4',
      '-10^9 <= nums[i] <= 10^9'
    ],
    testCases: [
      { input: '3\n3 2 3', expectedOutput: '3', isSample: true },
      { input: '7\n2 2 1 1 1 2 2', expectedOutput: '2', isSample: false },
      { input: '1\n5', expectedOutput: '5', isSample: false }
    ]
  },
  {
    title: 'Single Number',
    difficulty: 'easy',
    topics: ['Arrays', 'Math', 'Hash Table'],
    description: `Given a non-empty array of integers \`nums\`, every element appears twice except for one. Find that single one.

You must implement a solution with a linear runtime complexity and use only constant extra space.

**Input Format**
The first line contains an integer \`n\`.
The second line contains \`n\` space-separated integers.

**Output Format**
A single integer.`,
    constraints: [
      '1 <= nums.length <= 3 * 10^4',
      '-3 * 10^4 <= nums[i] <= 3 * 10^4',
      'Each element in the array appears twice except for one element which appears only once.'
    ],
    testCases: [
      { input: '3\n2 2 1', expectedOutput: '1', isSample: true },
      { input: '5\n4 1 2 1 2', expectedOutput: '4', isSample: false },
      { input: '1\n1', expectedOutput: '1', isSample: false }
    ]
  },
  {
    title: 'Maximum Subarray',
    difficulty: 'medium',
    topics: ['Arrays', 'Dynamic Programming', 'Greedy'],
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

**Input Format**
The first line contains an integer \`n\`.
The second line contains \`n\` space-separated integers.

**Output Format**
A single integer representing the maximum sum.`,
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4'
    ],
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isSample: true },
      { input: '1\n1', expectedOutput: '1', isSample: false },
      { input: '5\n5 4 -1 7 8', expectedOutput: '23', isSample: false },
      { input: '3\n-5 -2 -9', expectedOutput: '-2', isSample: false }
    ]
  },
  {
    title: 'Merge Intervals',
    difficulty: 'medium',
    topics: ['Arrays', 'Sorting'],
    description: `Given an array of \`intervals\` where \`intervals[i] = [starti, endi]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

**Input Format**
The first line contains an integer \`n\`.
The next \`n\` lines each contain two space-separated integers representing the start and end of an interval.

**Output Format**
Print each merged interval on a new line as two space-separated integers.`,
    constraints: [
      '1 <= intervals.length <= 10^4',
      '0 <= starti <= endi <= 10^4'
    ],
    testCases: [
      { input: '4\n1 3\n2 6\n8 10\n15 18', expectedOutput: '1 6\n8 10\n15 18', isSample: true },
      { input: '2\n1 4\n4 5', expectedOutput: '1 5', isSample: false },
      { input: '3\n1 4\n0 4\n0 0', expectedOutput: '0 4', isSample: false }
    ]
  },
  {
    title: 'Number of Islands',
    difficulty: 'medium',
    topics: ['Arrays', 'Depth-First Search'],
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

**Input Format**
The first line contains two integers \`m\` and \`n\`.
The next \`m\` lines each contain a string of length \`n\` consisting of '1's and '0's.

**Output Format**
A single integer representing the number of islands.`,
    constraints: [
      'm == grid.length',
      'n == grid[i].length',
      '1 <= m, n <= 300'
    ],
    testCases: [
      { input: '4 5\n11110\n11010\n11000\n00000', expectedOutput: '1', isSample: true },
      { input: '4 5\n11000\n11000\n00100\n00011', expectedOutput: '3', isSample: false },
      { input: '1 1\n1', expectedOutput: '1', isSample: false },
      { input: '2 2\n00\n00', expectedOutput: '0', isSample: false }
    ]
  },
  {
    title: 'Word Break',
    difficulty: 'medium',
    topics: ['Strings', 'Dynamic Programming', 'Hash Table'],
    description: `Given a string \`s\` and a dictionary of strings \`wordDict\`, return \`true\` if \`s\` can be segmented into a space-separated sequence of one or more dictionary words.

**Input Format**
The first line is the string \`s\`.
The second line is an integer \`k\`, the number of words in the dictionary.
The third line contains \`k\` space-separated strings.

**Output Format**
\`true\` or \`false\`.`,
    constraints: [
      '1 <= s.length <= 300',
      '1 <= wordDict.length <= 1000',
      '1 <= wordDict[i].length <= 20'
    ],
    testCases: [
      { input: 'leetcode\n2\nleet code', expectedOutput: 'true', isSample: true },
      { input: 'applepenapple\n2\napple pen', expectedOutput: 'true', isSample: false },
      { input: 'catsandog\n5\ncats dog sand and cat', expectedOutput: 'false', isSample: false },
      { input: 'a\n1\nb', expectedOutput: 'false', isSample: false }
    ]
  },
  {
    title: 'Coin Change',
    difficulty: 'medium',
    topics: ['Arrays', 'Dynamic Programming', 'Greedy'],
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

**Input Format**
The first line contains an integer \`n\`.
The second line contains \`n\` space-separated integers representing \`coins\`.
The third line contains the integer \`amount\`.

**Output Format**
A single integer.`,
    constraints: [
      '1 <= coins.length <= 12',
      '1 <= coins[i] <= 2^31 - 1',
      '0 <= amount <= 10^4'
    ],
    testCases: [
      { input: '3\n1 2 5\n11', expectedOutput: '3', isSample: true },
      { input: '1\n2\n3', expectedOutput: '-1', isSample: false },
      { input: '1\n1\n0', expectedOutput: '0', isSample: false }
    ]
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'medium',
    topics: ['Strings', 'Hash Table'],
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.

**Input Format**
A single string \`s\` (can be empty).

**Output Format**
A single integer representing the length.`,
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ],
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isSample: true },
      { input: 'bbbbb', expectedOutput: '1', isSample: false },
      { input: 'pwwkew', expectedOutput: '3', isSample: false },
      { input: 'a', expectedOutput: '1', isSample: false }
    ]
  },
  {
    title: 'Trapping Rain Water',
    difficulty: 'hard',
    topics: ['Arrays', 'Dynamic Programming', 'Math'],
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

**Input Format**
The first line contains an integer \`n\`.
The second line contains \`n\` space-separated non-negative integers.

**Output Format**
A single integer.`,
    constraints: [
      'n == height.length',
      '1 <= n <= 2 * 10^4',
      '0 <= height[i] <= 10^5'
    ],
    testCases: [
      { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6', isSample: true },
      { input: '6\n4 2 0 3 2 5', expectedOutput: '9', isSample: false },
      { input: '1\n100', expectedOutput: '0', isSample: false },
      { input: '2\n1 1', expectedOutput: '0', isSample: false }
    ]
  },
  {
    title: 'First Missing Positive',
    difficulty: 'hard',
    topics: ['Arrays', 'Hash Table', 'Database'],
    description: `Given an unsorted integer array \`nums\`. Return the smallest positive integer that is not present in \`nums\`.

You must implement an algorithm that runs in \`O(n)\` time and uses \`O(1)\` auxiliary space.

**Input Format**
The first line contains an integer \`n\`.
The second line contains \`n\` space-separated integers.

**Output Format**
A single integer.`,
    constraints: [
      '1 <= nums.length <= 10^5',
      '-2^31 <= nums[i] <= 2^31 - 1'
    ],
    testCases: [
      { input: '3\n1 2 0', expectedOutput: '3', isSample: true },
      { input: '4\n3 4 -1 1', expectedOutput: '2', isSample: false },
      { input: '5\n7 8 9 11 12', expectedOutput: '1', isSample: false },
      { input: '2\n1 2', expectedOutput: '3', isSample: false }
    ]
  },
  {
    title: 'Edit Distance',
    difficulty: 'hard',
    topics: ['Strings', 'Dynamic Programming'],
    description: `Given two strings \`word1\` and \`word2\`, return the minimum number of operations required to convert \`word1\` to \`word2\`.

You have the following three operations permitted on a word:
- Insert a character
- Delete a character
- Replace a character

**Input Format**
Two lines, containing \`word1\` and \`word2\` respectively.

**Output Format**
A single integer.`,
    constraints: [
      '0 <= word1.length, word2.length <= 500'
    ],
    testCases: [
      { input: 'horse\nros', expectedOutput: '3', isSample: true },
      { input: 'intention\nexecution', expectedOutput: '5', isSample: false },
      { input: 'a\nb', expectedOutput: '1', isSample: false },
      { input: '\na', expectedOutput: '1', isSample: false }
    ]
  },
  {
    title: 'Candy',
    difficulty: 'hard',
    topics: ['Arrays', 'Greedy'],
    description: `There are \`n\` children standing in a line. Each child is assigned a rating value given in the integer array \`ratings\`.

You are giving candies to these children subjected to the following requirements:
- Each child must have at least one candy.
- Children with a higher rating get more candies than their neighbors.

Return the minimum number of candies you need to have to distribute the candies to the children.

**Input Format**
The first line contains an integer \`n\`.
The second line contains \`n\` space-separated integers representing \`ratings\`.

**Output Format**
A single integer.`,
    constraints: [
      'n == ratings.length',
      '1 <= n <= 2 * 10^4',
      '0 <= ratings[i] <= 2 * 10^4'
    ],
    testCases: [
      { input: '3\n1 0 2', expectedOutput: '5', isSample: true },
      { input: '3\n1 2 2', expectedOutput: '4', isSample: false },
      { input: '1\n10', expectedOutput: '1', isSample: false }
    ]
  },
  {
    title: 'Course Schedule',
    difficulty: 'medium',
    topics: ['Depth-First Search', 'Math'],
    description: `There are a total of \`numCourses\` courses you have to take, labeled from \`0\` to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [ai, bi]\` indicates that you must take course \`bi\` first if you want to take course \`ai\`.

Return \`true\` if you can finish all courses. Otherwise, return \`false\`.

**Input Format**
The first line contains \`numCourses\` and an integer \`p\` (the number of prerequisites).
The next \`p\` lines each contain two integers \`ai\` and \`bi\`.

**Output Format**
\`true\` or \`false\`.`,
    constraints: [
      '1 <= numCourses <= 2000',
      '0 <= prerequisites.length <= 5000'
    ],
    testCases: [
      { input: '2 1\n1 0', expectedOutput: 'true', isSample: true },
      { input: '2 2\n1 0\n0 1', expectedOutput: 'false', isSample: false },
      { input: '1 0', expectedOutput: 'true', isSample: false }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB.');
    
    // Find first user to set as creator
    const admin = await User.findOne({});
    if (!admin) {
      console.error('No users found to set as creator.');
      process.exit(1);
    }
    
    // Delete Dummy Problem and existing problems to clear the DB
    await Problem.deleteMany({});
    console.log('Cleared existing problems.');

    const problemsToInsert = problemsData.map(p => ({
      ...p,
      createdBy: admin._id
    }));

    await Problem.insertMany(problemsToInsert);
    console.log(`Seeded ${problemsToInsert.length} problems!`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
}

seed();
