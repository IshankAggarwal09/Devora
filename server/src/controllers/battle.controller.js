import Battle from '../models/battle.model.js';
import Problem from '../models/problem.model.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const DIFFICULTY_BASELINES_MINUTES = {
  easy: 10,
  medium: 20,
  hard: 35
};

const generateRoomCode = async () => {
  let isUnique = false;
  let roomCode = '';

  while (!isUnique) {
    roomCode = '';
    for (let i = 0; i < 6; i++) {
      roomCode += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }

    const existing = await Battle.findOne({ roomCode });
    if (!existing) {
      isUnique = true;
    }
  }

  return roomCode;
};

const calculateMinDuration = (settings) => {
  let minDuration = 0;
  for (let i = 0; i < settings.questionCount; i++) {
    const baseline = DIFFICULTY_BASELINES_MINUTES[settings.difficulty] || 20; // fallback to medium
    minDuration += baseline;
  }
  return minDuration;
};

export const createBattle = async (req, res) => {
  try {
    const { settings, duration } = req.body;
    
    // Validate Duration
    const minAllowed = calculateMinDuration(settings);
    if (duration < minAllowed) {
      return res.status(400).json({ 
        error: `Duration too short. Based on the settings, the minimum allowed duration is ${minAllowed} minutes.` 
      });
    }

    const roomCode = await generateRoomCode();

    const battle = await Battle.create({
      roomCode,
      host: req.user._id,
      participants: [{ user: req.user._id }], // Host joins automatically
      settings,
      duration,
      status: 'waiting'
    });

    res.status(201).json(battle);
  } catch (error) {
    console.error('Error creating battle:', error);
    res.status(500).json({ error: 'Server error creating battle' });
  }
};

export const joinBattle = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const battle = await Battle.findOne({ roomCode });

    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (battle.status !== 'waiting') {
      return res.status(403).json({ error: 'Battle is already in progress or completed' });
    }

    if (battle.participants.length >= battle.maxParticipants) {
      return res.status(403).json({ error: 'Room is full' });
    }

    const alreadyJoined = battle.participants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (!alreadyJoined) {
      battle.participants.push({ user: req.user._id });
      await battle.save();
    }

    // Populate user info before returning
    await battle.populate('participants.user', 'name avatarUrl githubId');
    await battle.populate('host', 'name');

    res.status(200).json(battle);
  } catch (error) {
    console.error('Error joining battle:', error);
    res.status(500).json({ error: 'Server error joining battle' });
  }
};

export const getBattle = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const battle = await Battle.findOne({ roomCode })
      .populate('participants.user', 'name avatarUrl githubId')
      .populate('host', 'name')
      .populate('questions', '-testCases'); // Ensure test cases don't leak here if we populate

    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    res.status(200).json(battle);
  } catch (error) {
    console.error('Error fetching battle:', error);
    res.status(500).json({ error: 'Server error fetching battle' });
  }
};
