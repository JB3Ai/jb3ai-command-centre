// Skill Bank Manager for JB3AI Command Centre
// This script manages global skills for the command centre

const fs = require('fs');
const path = require('path');

// Configuration
const SKILL_BANK_DIR = './skills';
const SKILL_INDEX_FILE = path.join(SKILL_BANK_DIR, 'index.json');
const LOG_FILE = './skill-bank.log';

// Logging function
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(LOG_FILE, logMessage);
}

// Initialize skill bank
function initSkillBank() {
    try {
        if (!fs.existsSync(SKILL_BANK_DIR)) {
            fs.mkdirSync(SKILL_BANK_DIR, { recursive: true });
            log(`Created skill bank directory: ${SKILL_BANK_DIR}`);
        }
        
        if (!fs.existsSync(SKILL_INDEX_FILE)) {
            fs.writeFileSync(SKILL_INDEX_FILE, JSON.stringify({
                skills: [],
                lastUpdated: new Date().toISOString()
            }, null, 2));
            log('Created skill index file');
        }
        
        log('Skill bank initialized successfully');
        return true;
    } catch (error) {
        log(`Error initializing skill bank: ${error.message}`);
        return false;
    }
}

// Add a skill to the skill bank
function addSkill(skillName, skillPath, description = '') {
    try {
        // Read existing index
        const indexContent = fs.readFileSync(SKILL_INDEX_FILE, 'utf8');
        const index = JSON.parse(indexContent);
        
        // Check if skill already exists
        const existingSkillIndex = index.skills.findIndex(skill => skill.name === skillName);
        if (existingSkillIndex !== -1) {
            log(`Skill '${skillName}' already exists. Updating...`);
            index.skills[existingSkillIndex] = {
                name: skillName,
                path: skillPath,
                description: description,
                lastModified: new Date().toISOString()
            };
        } else {
            // Add new skill
            index.skills.push({
                name: skillName,
                path: skillPath,
                description: description,
                lastModified: new Date().toISOString()
            });
            log(`Added new skill: ${skillName}`);
        }
        
        // Update index
        index.lastUpdated = new Date().toISOString();
        fs.writeFileSync(SKILL_INDEX_FILE, JSON.stringify(index, null, 2));
        log(`Skill '${skillName}' added/updated successfully`);
        return true;
    } catch (error) {
        log(`Error adding skill '${skillName}': ${error.message}`);
        return false;
    }
}

// Remove a skill from the skill bank
function removeSkill(skillName) {
    try {
        // Read existing index
        const indexContent = fs.readFileSync(SKILL_INDEX_FILE, 'utf8');
        const index = JSON.parse(indexContent);
        
        // Find and remove skill
        const initialLength = index.skills.length;
        index.skills = index.skills.filter(skill => skill.name !== skillName);
        
        if (index.skills.length === initialLength) {
            log(`Skill '${skillName}' not found in skill bank`);
            return false;
        }
        
        // Update index
        index.lastUpdated = new Date().toISOString();
        fs.writeFileSync(SKILL_INDEX_FILE, JSON.stringify(index, null, 2));
        log(`Skill '${skillName}' removed successfully`);
        return true;
    } catch (error) {
        log(`Error removing skill '${skillName}': ${error.message}`);
        return false;
    }
}

// List all skills in the skill bank
function listSkills() {
    try {
        const indexContent = fs.readFileSync(SKILL_INDEX_FILE, 'utf8');
        const index = JSON.parse(indexContent);
        
        console.log('Available Skills:');
        console.log('=================');
        if (index.skills.length === 0) {
            console.log('No skills in the skill bank');
            return [];
        }
        
        index.skills.forEach((skill, index) => {
            console.log(`${index + 1}. ${skill.name}`);
            console.log(`   Path: ${skill.path}`);
            console.log(`   Description: ${skill.description || 'No description'}`);
            console.log(`   Last Modified: ${skill.lastModified}`);
            console.log('');
        });
        
        log(`Listed ${index.skills.length} skills`);
        return index.skills;
    } catch (error) {
        log(`Error listing skills: ${error.message}`);
        return [];
    }
}

// Get a specific skill
function getSkill(skillName) {
    try {
        const indexContent = fs.readFileSync(SKILL_INDEX_FILE, 'utf8');
        const index = JSON.parse(indexContent);
        
        const skill = index.skills.find(s => s.name === skillName);
        if (!skill) {
            log(`Skill '${skillName}' not found`);
            return null;
        }
        
        log(`Retrieved skill: ${skillName}`);
        return skill;
    } catch (error) {
        log(`Error getting skill '${skillName}': ${error.message}`);
        return null;
    }
}

// Check if a skill exists
function skillExists(skillName) {
    try {
        const indexContent = fs.readFileSync(SKILL_INDEX_FILE, 'utf8');
        const index = JSON.parse(indexContent);
        
        return index.skills.some(skill => skill.name === skillName);
    } catch (error) {
        log(`Error checking skill existence: ${error.message}`);
        return false;
    }
}

// Update skill description
function updateSkillDescription(skillName, newDescription) {
    try {
        const indexContent = fs.readFileSync(SKILL_INDEX_FILE, 'utf8');
        const index = JSON.parse(indexContent);
        
        const skillIndex = index.skills.findIndex(skill => skill.name === skillName);
        if (skillIndex === -1) {
            log(`Skill '${skillName}' not found`);
            return false;
        }
        
        index.skills[skillIndex].description = newDescription;
        index.skills[skillIndex].lastModified = new Date().toISOString();
        index.lastUpdated = new Date().toISOString();
        
        fs.writeFileSync(SKILL_INDEX_FILE, JSON.stringify(index, null, 2));
        log(`Updated description for skill: ${skillName}`);
        return true;
    } catch (error) {
        log(`Error updating skill description: ${error.message}`);
        return false;
    }
}

// Main function to handle command-line arguments
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Skill Bank Manager for JB3AI Command Centre');
        console.log('==========================================');
        console.log('Usage:');
        console.log('  node skill-bank.js init              - Initialize skill bank');
        console.log('  node skill-bank.js add <name> <path> [description] - Add a skill');
        console.log('  node skill-bank.js remove <name>     - Remove a skill');
        console.log('  node skill-bank.js list              - List all skills');
        console.log('  node skill-bank.js get <name>        - Get a specific skill');
        console.log('  node skill-bank.js exists <name>     - Check if skill exists');
        console.log('  node skill-bank.js update-desc <name> <description> - Update skill description');
        return;
    }
    
    const command = args[0];
    
    switch (command) {
        case 'init':
            initSkillBank();
            break;
        case 'add':
            if (args.length < 3) {
                console.log('Usage: node skill-bank.js add <name> <path> [description]');
                process.exit(1);
            }
            const skillName = args[1];
            const skillPath = args[2];
            const description = args.slice(3).join(' ');
            addSkill(skillName, skillPath, description);
            break;
        case 'remove':
            if (args.length < 2) {
                console.log('Usage: node skill-bank.js remove <name>');
                process.exit(1);
            }
            removeSkill(args[1]);
            break;
        case 'list':
            listSkills();
            break;
        case 'get':
            if (args.length < 2) {
                console.log('Usage: node skill-bank.js get <name>');
                process.exit(1);
            }
            getSkill(args[1]);
            break;
        case 'exists':
            if (args.length < 2) {
                console.log('Usage: node skill-bank.js exists <name>');
                process.exit(1);
            }
            const exists = skillExists(args[1]);
            console.log(exists ? 'true' : 'false');
            break;
        case 'update-desc':
            if (args.length < 3) {
                console.log('Usage: node skill-bank.js update-desc <name> <description>');
                process.exit(1);
            }
            const name = args[1];
            const description = args.slice(2).join(' ');
            updateSkillDescription(name, description);
            break;
        default:
            console.log(`Unknown command: ${command}`);
            console.log('Use "node skill-bank.js" to see usage');
            process.exit(1);
    }
}

// Initialize skill bank if it doesn't exist
if (!fs.existsSync(SKILL_BANK_DIR) || !fs.existsSync(SKILL_INDEX_FILE)) {
    initSkillBank();
}

// Run main function if script is executed directly
if (require.main === module) {
    main();
}

module.exports = {
    initSkillBank,
    addSkill,
    removeSkill,
    listSkills,
    getSkill,
    skillExists,
    updateSkillDescription
};