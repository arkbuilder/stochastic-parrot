export interface RecallPromptDefinition {
  id: string;
  conceptId: string;
  promptStyle: string;
  iconHints: string[];
}

export const RECALL_PROMPTS: RecallPromptDefinition[] = [
  { id: 'prompt_training_data', conceptId: 'training_data', promptStyle: 'What feeds learning?', iconHints: ['fish', 'crate'] },
  { id: 'prompt_model', conceptId: 'model', promptStyle: 'What maps pattern?', iconHints: ['gear', 'compass'] },
  { id: 'prompt_inference', conceptId: 'inference', promptStyle: 'What fires conclusion?', iconHints: ['cannonball', 'bolt'] },
  { id: 'prompt_bias', conceptId: 'bias', promptStyle: 'What leads astray?', iconHints: ['crooked_arrow', 'compass'] },
  { id: 'prompt_classification', conceptId: 'classification', promptStyle: 'What sorts catch?', iconHints: ['bins', 'fish'] },
  { id: 'prompt_feedback_loop', conceptId: 'feedback_loop', promptStyle: 'What turns and returns?', iconHints: ['loop_arrow', 'water'] },
  { id: 'prompt_overfitting', conceptId: 'overfitting', promptStyle: 'What holds too tight?', iconHints: ['barnacle', 'locked_chest'] },
  { id: 'prompt_underfitting', conceptId: 'underfitting', promptStyle: 'What knows too little?', iconHints: ['blank_map', 'frame'] },
  { id: 'prompt_training_vs_testing', conceptId: 'training_vs_testing', promptStyle: 'What catches vs checks?', iconHints: ['net_a', 'net_b'] },
  { id: 'prompt_reinforcement', conceptId: 'reinforcement', promptStyle: 'What rings for reward?', iconHints: ['bell', 'sound_wave'] },
  { id: 'prompt_reward_function', conceptId: 'reward_function', promptStyle: 'What weighs outcomes?', iconHints: ['scale', 'gold'] },
  { id: 'prompt_agent', conceptId: 'agent', promptStyle: 'Who decides action?', iconHints: ['parrot', 'horizon'] },
  { id: 'prompt_neural_network', conceptId: 'neural_network', promptStyle: 'What connects signals?', iconHints: ['rope_web', 'lanterns'] },
  { id: 'prompt_gradient_descent', conceptId: 'gradient_descent', promptStyle: 'What finds the bottom?', iconHints: ['anchor', 'steps'] },
  { id: 'prompt_generalization', conceptId: 'generalization', promptStyle: 'What opens all locks?', iconHints: ['master_key', 'locks'] },
];
