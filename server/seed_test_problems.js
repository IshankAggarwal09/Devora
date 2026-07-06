import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Problem from './src/models/problem.model.js';
import User from './src/models/user.model.js';

dotenv.config({ path: './.env' });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Clear existing
    await Problem.deleteMany({});
    
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'dummy',
        authProvider: 'local'
      });
    }

    const problems = [
      {
        title: "Two Sum",
        slug: "two-sum",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
        difficulty: "easy",
        topics: ["Arrays", "Hash Table"],
        constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
        timeLimit: 1000,
        memoryLimit: 256,
        createdBy: user._id,
        testCases: [
          { input: "4\n2 7 11 15\n9", expectedOutput: "0 1", isSample: true, isHidden: false },
          { input: "3\n3 2 4\n6", expectedOutput: "1 2", isSample: false, isHidden: true }
        ]
      },
      {
        title: "Add Two Numbers",
        slug: "add-two-numbers",
        description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
        difficulty: "medium",
        topics: ["Math", "Linked List"],
        constraints: ["The number of nodes in each linked list is in the range [1, 100]", "0 <= Node.val <= 9"],
        timeLimit: 2000,
        memoryLimit: 256,
        createdBy: user._id,
        testCases: [
          { input: "3\n2 4 3\n3\n5 6 4", expectedOutput: "7 0 8", isSample: true, isHidden: false }
        ]
      },
      {
        title: "Median of Two Sorted Arrays",
        slug: "median-of-two-sorted-arrays",
        description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
        difficulty: "hard",
        topics: ["Arrays", "Binary Search"],
        constraints: ["nums1.length == m", "nums2.length == n", "0 <= m <= 1000", "0 <= n <= 1000", "1 <= m + n <= 2000"],
        timeLimit: 1000,
        memoryLimit: 256,
        createdBy: user._id,
        testCases: [
          { input: "2\n1 3\n1\n2", expectedOutput: "2.00000", isSample: true, isHidden: false },
          { input: "2\n1 2\n2\n3 4", expectedOutput: "2.50000", isSample: true, isHidden: false }
        ]
      }
    ];

    await Problem.insertMany(problems);
    console.log("Problems seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
