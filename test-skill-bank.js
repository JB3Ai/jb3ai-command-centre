// Test script for skill bank functionality
const { initSkillBank, addSkill, listSkills, getSkill } = require('./scripts/skill-bank.js');

console.log('Testing Skill Bank Functionality...\n');

// Initialize skill bank
console.log('1. Initializing skill bank...');
initSkillBank();

// Add some test skills
console.log('2. Adding test skills...');
addSkill('whatsapp-skill', './skills/whatsapp-skill', 'WhatsApp integration skill');
addSkill('voice-skill', './skills/voice-skill', 'Voice processing skill');
addSkill('analytics-skill', './skills/analytics-skill', 'Analytics processing skill');

// List all skills
console.log('3. Listing all skills...');
listSkills();

// Get a specific skill
console.log('4. Getting specific skill...');
getSkill('whatsapp-skill');

console.log('\nTest completed successfully!');