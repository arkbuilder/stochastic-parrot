/**
 * concept-minigames.ts — Socratic dialog + interactive challenge data
 * for each of the 15 AI/ML concepts.
 *
 * Each minigame has:
 *  - dialog: RPG-style Socratic conversation beats with the parrot
 *  - challenge: an interactive action the player performs to "prove" understanding
 *  - The parrot asks leading questions; the player picks answers
 *  - Wrong answers get gentle correction; right answers advance
 */

export interface DialogBeat {
  /** Who is speaking: parrot or narrator (environment) */
  speaker: 'parrot' | 'narrator';
  /** The dialog text (kept short — 1-2 sentences max) */
  text: string;
  /** If present, player must choose. Index of correct answer in choices. */
  choices?: string[];
  correctChoice?: number;
  /** Feedback shown after wrong answer */
  wrongFeedback?: string;
  /** Feedback shown after correct answer */
  correctFeedback?: string;
}

export interface InteractiveChallenge {
  /** Type of challenge */
  type: 'sort' | 'connect' | 'adjust' | 'select';
  /** Instruction shown (icon-based, kept short) */
  instruction: string;
  /** Items the player interacts with */
  items: string[];
  /** The correct answer (index for select, sorted order for sort, pairs for connect) */
  answer: number | number[] | Array<[number, number]>;
  /** Short success message */
  successText: string;
  /** Short hint on failure */
  hintText: string;
}

export interface ConceptMinigame {
  conceptId: string;
  conceptName: string;
  metaphor: string;
  dialog: DialogBeat[];
  challenge: InteractiveChallenge;
  /** Summary line the parrot says after completing everything */
  wrapUp: string;
}

export const CONCEPT_MINIGAMES: ConceptMinigame[] = [
  // ══════════════════════════════════════════
  // ISLAND 1 — Bay of Learning
  // ══════════════════════════════════════════
  {
    conceptId: 'training_data',
    conceptName: 'Training Data',
    metaphor: 'Fish Crates',
    dialog: [
      { speaker: 'parrot', text: 'Squawk! Look at all these fish crates at the dock!' },
      { speaker: 'parrot', text: 'If ye wanted to teach a machine to tell fish apart, what would ye need first?' },
      {
        speaker: 'parrot',
        text: 'What do ye reckon?',
        choices: [
          'A magic spell',
          'Lots of example fish to study',
          'A bigger boat',
        ],
        correctChoice: 1,
        wrongFeedback: 'Nah — think about it. How do YOU learn? By seeing examples!',
        correctFeedback: 'Aye! Examples! That\'s TRAINING DATA — the examples a machine learns from!',
      },
      { speaker: 'narrator', text: 'Training Data = the examples you feed a machine so it can learn patterns.' },
    ],
    challenge: {
      type: 'sort',
      instruction: 'Sort the good fish into the crate! (Tap fish, skip rocks)',
      items: ['🐟 Fish', '🪨 Rock', '🐠 Fish', '🪸 Coral', '🐡 Fish'],
      answer: [0, 2, 4],
      successText: 'Great catch! You built a clean training dataset!',
      hintText: 'Only pick items that are fish — skip things that aren\'t examples!',
    },
    wrapUp: 'Remember: better data in the crates means better learning. Garbage in, garbage out!',
  },
  {
    conceptId: 'model',
    conceptName: 'Model',
    metaphor: 'Navigational Chart',
    dialog: [
      { speaker: 'parrot', text: 'This chart table is where the captain plots the course!' },
      { speaker: 'parrot', text: 'After studying many voyages, the captain draws a chart. An AI does something similar...' },
      {
        speaker: 'parrot',
        text: 'What would ye call the pattern a machine builds from training data?',
        choices: [
          'A Model',
          'A Database',
          'A Screenshot',
        ],
        correctChoice: 0,
        wrongFeedback: 'Not quite — it\'s the pattern itself, like a chart drawn from experience!',
        correctFeedback: 'That\'s right! A MODEL is the pattern the machine learns from data!',
      },
      { speaker: 'narrator', text: 'A Model = the learned pattern that lets a machine make predictions.' },
    ],
    challenge: {
      type: 'connect',
      instruction: 'Match each voyage to its chart! (Tap pairs)',
      items: ['Storm route → Avoid reefs', 'Trade route → Follow coast', 'Fish route → Deep waters'],
      answer: [[0, 0], [1, 1], [2, 2]],
      successText: 'Your chart is complete! The model captures each pattern!',
      hintText: 'Each route has one matching chart entry — find the pattern!',
    },
    wrapUp: 'A model is like this chart — built from past voyages, used to navigate the future!',
  },
  {
    conceptId: 'inference',
    conceptName: 'Inference',
    metaphor: 'Loaded Cannon',
    dialog: [
      { speaker: 'parrot', text: 'The cannon\'s loaded and ready! But what are we aiming at?' },
      { speaker: 'parrot', text: 'Once ye have a trained model, ye can use it to make predictions on NEW data...' },
      {
        speaker: 'parrot',
        text: 'Using a trained model to make a prediction is called...?',
        choices: [
          'Inference',
          'Training',
          'Deleting',
        ],
        correctChoice: 0,
        wrongFeedback: 'Training is building the model. Using it is called something else!',
        correctFeedback: 'FIRE! Inference = using your model to make predictions!',
      },
      { speaker: 'narrator', text: 'Inference = applying a trained model to new data to get predictions.' },
    ],
    challenge: {
      type: 'select',
      instruction: 'The cannon sees a new shape. What will the model predict? (Tap answer)',
      items: ['🟦 Ship (friendly)', '🟥 Ship (enemy)', '🏝️ Island'],
      answer: 1,
      successText: 'Direct hit! You used inference to identify the target!',
      hintText: 'Think — use what the model already learned to decide!',
    },
    wrapUp: 'Training loads the cannon with knowledge. Inference pulls the trigger!',
  },

  // ══════════════════════════════════════════
  // ISLAND 2 — Driftwood Shallows
  // ══════════════════════════════════════════
  {
    conceptId: 'bias',
    conceptName: 'Bias',
    metaphor: 'Crooked Compass',
    dialog: [
      { speaker: 'parrot', text: 'Hmm, this compass always points a bit to the left...' },
      { speaker: 'parrot', text: 'If yer training data has an imbalance, the model learns that skew!' },
      {
        speaker: 'parrot',
        text: 'What happens when a model learns from lopsided examples?',
        choices: [
          'It becomes perfectly fair',
          'It develops Bias — skewed predictions',
          'It gets faster',
        ],
        correctChoice: 1,
        wrongFeedback: 'Unfair data leads to unfair results — it doesn\'t fix itself!',
        correctFeedback: 'Aye! Bias means the model\'s predictions lean one way — like a crooked compass!',
      },
      { speaker: 'narrator', text: 'Bias = systematic errors from skewed or incomplete training data.' },
    ],
    challenge: {
      type: 'adjust',
      instruction: 'Straighten the compass! Tap to re-center the needle.',
      items: ['← Too left', '↑ Center', '→ Too right'],
      answer: 1,
      successText: 'Compass straightened! Now it points true north!',
      hintText: 'Find the center — balanced data means balanced predictions!',
    },
    wrapUp: 'Always check yer data compass. Biased data = biased model!',
  },
  {
    conceptId: 'classification',
    conceptName: 'Classification',
    metaphor: 'Sorting Bins',
    dialog: [
      { speaker: 'parrot', text: 'The market has sorting bins for different types of fish!' },
      { speaker: 'parrot', text: 'When a machine sorts things into categories, that\'s a special task...' },
      {
        speaker: 'parrot',
        text: 'Sorting items into groups is called...?',
        choices: [
          'Randomization',
          'Classification',
          'Deletion',
        ],
        correctChoice: 1,
        wrongFeedback: 'Not random! It\'s organized sorting into specific groups!',
        correctFeedback: 'That\'s it! Classification = sorting things into categories!',
      },
      { speaker: 'narrator', text: 'Classification = a model deciding which category something belongs to.' },
    ],
    challenge: {
      type: 'sort',
      instruction: 'Sort the catch into the right bins! (Tap to classify)',
      items: ['🐟 Tuna', '🦐 Shrimp', '🐙 Octopus', '🦐 Prawn', '🐟 Salmon'],
      answer: [0, 4],
      successText: 'Perfectly sorted! You\'re a classification expert!',
      hintText: 'Group the similar items together!',
    },
    wrapUp: 'Classification is how AI sorts emails, detects spam, or identifies objects in photos!',
  },
  {
    conceptId: 'feedback_loop',
    conceptName: 'Feedback Loop',
    metaphor: 'Tidewheel',
    dialog: [
      { speaker: 'parrot', text: 'See the tidewheel? Water goes up, comes back down, turns the wheel again!' },
      { speaker: 'parrot', text: 'In AI, model output can become future input, creating a cycle...' },
      {
        speaker: 'parrot',
        text: 'When output feeds back as input, that\'s a...?',
        choices: [
          'Dead end',
          'Feedback Loop',
          'Power outage',
        ],
        correctChoice: 1,
        wrongFeedback: 'It\'s not dead — it keeps cycling! Output becomes input again!',
        correctFeedback: 'Round and round! A Feedback Loop means outputs influence future inputs!',
      },
      { speaker: 'narrator', text: 'Feedback Loop = when a system\'s output feeds back as input, creating cycles.' },
    ],
    challenge: {
      type: 'connect',
      instruction: 'Complete the cycle! Connect each step to the next.',
      items: ['Data → Model', 'Model → Prediction', 'Prediction → New Data'],
      answer: [[0, 1], [1, 2], [2, 0]],
      successText: 'The wheel turns! You completed the feedback loop!',
      hintText: 'Each step leads to the next — and the last leads back to the first!',
    },
    wrapUp: 'Social media feeds are feedback loops — what you click changes what you see next!',
  },

  // ══════════════════════════════════════════
  // ISLAND 3 — Coral Maze
  // ══════════════════════════════════════════
  {
    conceptId: 'overfitting',
    conceptName: 'Overfitting',
    metaphor: 'Barnacle Chest',
    dialog: [
      { speaker: 'parrot', text: 'This chest is covered in so many barnacles it won\'t open!' },
      { speaker: 'parrot', text: 'When a model memorizes training data TOO perfectly, it gets stuck too...' },
      {
        speaker: 'parrot',
        text: 'A model that memorizes instead of learning patterns is...?',
        choices: [
          'Generalized',
          'Overfitting',
          'Optimized',
        ],
        correctChoice: 1,
        wrongFeedback: 'Memorizing isn\'t the same as learning patterns!',
        correctFeedback: 'Right! Overfitting = memorizing the training data instead of learning general patterns!',
      },
      { speaker: 'narrator', text: 'Overfitting = when a model works perfectly on training data but fails on new data.' },
    ],
    challenge: {
      type: 'select',
      instruction: 'Which chest can open new locks? (Not the over-decorated one!)',
      items: ['🔒 Chest with 100 specific barnacles', '🔑 Clean chest with simple lock', '🔒 Chest welded shut'],
      answer: 1,
      successText: 'Simple and flexible beats over-memorized!',
      hintText: 'The one that\'s not stuck trying to match every detail!',
    },
    wrapUp: 'Like this chest — too many details makes it rigid. Keep models flexible!',
  },
  {
    conceptId: 'underfitting',
    conceptName: 'Underfitting',
    metaphor: 'Blank Map Frame',
    dialog: [
      { speaker: 'parrot', text: 'This map has almost nothing on it! How are we supposed to navigate?' },
      { speaker: 'parrot', text: 'If a model hasn\'t learned enough, it can\'t make good predictions either...' },
      {
        speaker: 'parrot',
        text: 'A model that hasn\'t learned enough from data is...?',
        choices: [
          'Underfitting',
          'Overfitting',
          'Perfect',
        ],
        correctChoice: 0,
        wrongFeedback: 'Too little learning, not too much! Think blank map, not crowded map!',
        correctFeedback: 'Aye! Underfitting = the model didn\'t learn enough patterns to be useful!',
      },
      { speaker: 'narrator', text: 'Underfitting = model is too simple to capture the real patterns in data.' },
    ],
    challenge: {
      type: 'select',
      instruction: 'Which map would actually help you find treasure?',
      items: ['🗺️ Blank page', '🗺️ Map with landmarks and paths', '🗺️ Single dot on a page'],
      answer: 1,
      successText: 'Details matter! A model needs enough complexity to be useful!',
      hintText: 'Too sparse is as bad as too complex — find the useful middle!',
    },
    wrapUp: 'Underfitting is the opposite of overfitting — too little detail to be useful!',
  },
  {
    conceptId: 'training_vs_testing',
    conceptName: 'Training vs Testing',
    metaphor: 'Twin Nets',
    dialog: [
      { speaker: 'parrot', text: 'Two nets! One for catching fish, one for measuring the catch!' },
      { speaker: 'parrot', text: 'In AI, ye split yer data in two — one set to learn from, one to test with!' },
      {
        speaker: 'parrot',
        text: 'Why do we split data into training and testing sets?',
        choices: [
          'To save storage space',
          'To check if the model actually learned general patterns',
          'Because we have too much data',
        ],
        correctChoice: 1,
        wrongFeedback: 'It\'s about honesty! Test with data the model hasn\'t seen!',
        correctFeedback: 'Exactly! Testing data checks if the model truly learned — not just memorized!',
      },
      { speaker: 'narrator', text: 'Training Data = learn from this. Testing Data = prove yourself with this.' },
    ],
    challenge: {
      type: 'sort',
      instruction: 'Split the fish! Left net = Training, Right net = Testing',
      items: ['🐟 Fish A (train)', '🐟 Fish B (test)', '🐟 Fish C (train)', '🐟 Fish D (test)', '🐟 Fish E (train)'],
      answer: [0, 2, 4],
      successText: 'Perfect split! Never test with your training data!',
      hintText: 'The training net catches more, the testing net checks quality!',
    },
    wrapUp: 'Always keep training and testing separate — no peeking at the test!',
  },

  // ══════════════════════════════════════════
  // ISLAND 4 — Storm Bastion
  // ══════════════════════════════════════════
  {
    conceptId: 'reinforcement',
    conceptName: 'Reinforcement',
    metaphor: 'Reward Bell',
    dialog: [
      { speaker: 'parrot', text: 'Hear that bell? It rings louder when the lookout spots treasure!' },
      { speaker: 'parrot', text: 'Some AI learns by getting rewards for good actions and penalties for bad ones...' },
      {
        speaker: 'parrot',
        text: 'Learning through rewards and penalties is called...?',
        choices: [
          'Reinforcement Learning',
          'Supervised Learning',
          'Random Guessing',
        ],
        correctChoice: 0,
        wrongFeedback: 'Think about how ye train a parrot — treats for tricks!',
        correctFeedback: 'DING DING! Reinforcement Learning = learning from rewards and penalties!',
      },
      { speaker: 'narrator', text: 'Reinforcement = learn by doing, getting rewards for good actions.' },
    ],
    challenge: {
      type: 'select',
      instruction: 'The parrot did a trick! What should happen to encourage it?',
      items: ['🔔 Ring the reward bell!', '❌ Ignore it', '😡 Scold it'],
      answer: 0,
      successText: 'DING! Positive reinforcement encourages good behavior!',
      hintText: 'Reward good actions to get more of them!',
    },
    wrapUp: 'Game AI, robots, and self-driving cars all use reinforcement learning!',
  },
  {
    conceptId: 'reward_function',
    conceptName: 'Reward Function',
    metaphor: 'Treasure Scale',
    dialog: [
      { speaker: 'parrot', text: 'This scale weighs outcomes — is the treasure worth the risk?' },
      { speaker: 'parrot', text: 'In RL, the reward function decides HOW MUCH reward an action gets...' },
      {
        speaker: 'parrot',
        text: 'What decides the size of the reward in reinforcement learning?',
        choices: [
          'Random chance',
          'The Reward Function',
          'The screen resolution',
        ],
        correctChoice: 1,
        wrongFeedback: 'It\'s not random — someone designs the rules for scoring!',
        correctFeedback: 'The Reward Function is the formula that scores every action!',
      },
      { speaker: 'narrator', text: 'Reward Function = the rules that assign scores to actions and outcomes.' },
    ],
    challenge: {
      type: 'adjust',
      instruction: 'Balance the scale! More gold = higher reward. Align the sides!',
      items: ['⚖️ Light (penalty)', '⚖️ Balanced (neutral)', '⚖️ Heavy (reward)'],
      answer: 2,
      successText: 'The scale tips toward reward! Good actions earn gold!',
      hintText: 'A good reward function gives the highest score to the best outcome!',
    },
    wrapUp: 'Design rewards carefully — a bad reward function teaches bad habits!',
  },
  {
    conceptId: 'agent',
    conceptName: 'Agent',
    metaphor: 'Crow\'s Nest Parrot',
    dialog: [
      { speaker: 'parrot', text: 'That\'s ME up there! I scan the horizon and decide where to go!' },
      { speaker: 'parrot', text: 'In AI, an Agent is anything that perceives its environment and takes actions...' },
      {
        speaker: 'parrot',
        text: 'What makes something an AI Agent?',
        choices: [
          'It has a screen',
          'It observes the world and decides what to do',
          'It stores data',
        ],
        correctChoice: 1,
        wrongFeedback: 'An agent acts — it doesn\'t just store or display!',
        correctFeedback: 'Right! An Agent perceives the environment and takes actions to achieve goals!',
      },
      { speaker: 'narrator', text: 'Agent = an entity that observes, decides, and acts in an environment.' },
    ],
    challenge: {
      type: 'select',
      instruction: 'Which of these is an AI Agent?',
      items: ['📊 A spreadsheet', '🤖 A robot that navigates a maze', '💾 A USB drive'],
      answer: 1,
      successText: 'The robot observes, decides, and acts — it\'s an agent!',
      hintText: 'An agent needs to perceive AND act, not just store!',
    },
    wrapUp: 'You\'re kind of an agent too — you observe this game and decide what to do!',
  },

  // ══════════════════════════════════════════
  // ISLAND 5 — Kraken's Reach
  // ══════════════════════════════════════════
  {
    conceptId: 'neural_network',
    conceptName: 'Neural Network',
    metaphor: 'Rigging Web',
    dialog: [
      { speaker: 'parrot', text: 'Look at the rigging — ropes connecting every mast with signal lanterns!' },
      { speaker: 'parrot', text: 'A Neural Network connects layers of "nodes" — signals flow through connections...' },
      {
        speaker: 'parrot',
        text: 'What is a Neural Network inspired by?',
        choices: [
          'Fish scales',
          'The human brain',
          'Ship anchors',
        ],
        correctChoice: 1,
        wrongFeedback: 'Think of what has interconnected signal pathways...',
        correctFeedback: 'Aye! Neural Networks are inspired by how neurons connect in the brain!',
      },
      { speaker: 'narrator', text: 'Neural Network = layers of connected nodes that process signals, inspired by the brain.' },
    ],
    challenge: {
      type: 'connect',
      instruction: 'Light the signal path! Connect input lanterns to output lanterns.',
      items: ['Input → Hidden Layer', 'Hidden Layer → Hidden Layer', 'Hidden Layer → Output'],
      answer: [[0, 1], [1, 2]],
      successText: 'Signal transmitted! The network is alive!',
      hintText: 'Data flows forward: input → hidden layers → output!',
    },
    wrapUp: 'Neural networks power image recognition, language models, and so much more!',
  },
  {
    conceptId: 'gradient_descent',
    conceptName: 'Gradient Descent',
    metaphor: 'Anchor Winch',
    dialog: [
      { speaker: 'parrot', text: 'The anchor drops step by step, feeling for the ocean floor...' },
      { speaker: 'parrot', text: 'Neural networks learn by taking small steps to reduce error — gradient descent!' },
      {
        speaker: 'parrot',
        text: 'How does gradient descent find the best answer?',
        choices: [
          'Random jumps',
          'Small steps toward less error',
          'One giant leap',
        ],
        correctChoice: 1,
        wrongFeedback: 'Not random! It\'s step by step, always downhill toward less error!',
        correctFeedback: 'Step by step! Gradient Descent takes small steps to minimize error!',
      },
      { speaker: 'narrator', text: 'Gradient Descent = iteratively adjusting the model step-by-step to reduce error.' },
    ],
    challenge: {
      type: 'adjust',
      instruction: 'Lower the anchor step by step! Tap to descend toward the lowest point.',
      items: ['⬇️ Step 1 (high error)', '⬇️ Step 2 (medium error)', '⬇️ Step 3 (low error!)'],
      answer: 2,
      successText: 'Anchor at the bottom! Error minimized!',
      hintText: 'Keep stepping down — each step should reduce the error!',
    },
    wrapUp: 'Every time a neural network trains, gradient descent helps it get a little bit better!',
  },
  {
    conceptId: 'generalization',
    conceptName: 'Generalization',
    metaphor: 'Master Key Shrine',
    dialog: [
      { speaker: 'parrot', text: 'A master key that opens ANY lock on ANY island? Now that\'s powerful!' },
      { speaker: 'parrot', text: 'When a model works well on NEW data it\'s never seen, that\'s generalization!' },
      {
        speaker: 'parrot',
        text: 'A model that performs well on brand new data has good...?',
        choices: [
          'Memorization',
          'Generalization',
          'Decoration',
        ],
        correctChoice: 1,
        wrongFeedback: 'Memorization only works on things you\'ve seen. This is about NEW things!',
        correctFeedback: 'The master key! Generalization = working well on data you\'ve never seen!',
      },
      { speaker: 'narrator', text: 'Generalization = a model\'s ability to perform well on new, unseen data.' },
    ],
    challenge: {
      type: 'select',
      instruction: 'Which key opens ALL the locks?',
      items: ['🔑 Key that only fits lock #7', '🔑 Master key (fits any lock)', '🔑 Broken key'],
      answer: 1,
      successText: 'The master key works everywhere — true generalization!',
      hintText: 'Find the key that doesn\'t just work on ONE specific lock!',
    },
    wrapUp: 'The goal of all AI: learn patterns general enough to handle anything new!',
  },
];

/** Look up a minigame by concept ID */
export function getConceptMinigame(conceptId: string): ConceptMinigame | undefined {
  return CONCEPT_MINIGAMES.find((mg) => mg.conceptId === conceptId);
}
